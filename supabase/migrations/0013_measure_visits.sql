-- Home measurement visits: customers book a slot (branch + day + time); staff confirm/complete from the dashboard.
-- Availability rules live in store_settings 'visits' (owner-editable). Booking goes through a secret-gated RPC only.

create sequence public.visit_seq start 101;
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  seq bigint not null default nextval('public.visit_seq') unique,
  number text generated always as ('V-' || seq::text) stored,
  token text unique not null default encode(extensions.gen_random_bytes(16), 'hex'),
  branch_id uuid not null references public.branches(id),
  customer_name text not null, phone text not null, area text not null, address text,
  items text[] not null default '{}', notes text,
  visit_date date not null, slot text not null,
  status text not null default 'new' check (status in ('new','confirmed','done','cancelled')),
  staff_notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index visits_date_idx on public.visits (visit_date, slot) where status <> 'cancelled';
alter table public.visits enable row level security;
create policy staff_all_visits on public.visits for all to authenticated using (public.is_staff()) with check (public.is_staff());
create trigger aud_visits after insert or update or delete on public.visits for each row execute function app_private.audit();

insert into public.store_settings (key, value) values ('visits', jsonb_build_object(
  'enabled', true,
  'days', jsonb_build_array(0, 1, 2, 3, 4, 6),          -- JS getDay(): 0=Sunday … 6=Saturday (Friday = 5 off)
  'slots', jsonb_build_array('10:00', '12:00', '14:00', '16:00', '18:00'),
  'capacity', 1, 'lead_days', 1, 'horizon_days', 14,
  'items', jsonb_build_array('ستائر', 'فرش عربي', 'باطنة', 'أخرى')
)) on conflict (key) do nothing;

create or replace function app_private.visit_cfg() returns jsonb language sql stable security definer set search_path = '' as
$$ select coalesce((select value from public.store_settings where key = 'visits'), '{}'::jsonb) $$;

-- Public availability: only counts per (date, slot), never personal data.
create function public.visit_availability(p_secret text, p_branch uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c jsonb := app_private.visit_cfg(); today date := (now() at time zone 'Asia/Gaza')::date;
begin
  perform app_private.check_secret(p_secret);
  return jsonb_build_object(
    'config', c - 'notes',
    'today', today,
    'now_time', to_char(now() at time zone 'Asia/Gaza', 'HH24:MI'),
    'booked', coalesce((select jsonb_object_agg(k, n) from (
        select visit_date::text || ' ' || slot k, count(*) n from public.visits
         where branch_id = p_branch and status <> 'cancelled' and visit_date between today and today + coalesce((c->>'horizon_days')::int, 14)
         group by 1) s), '{}'::jsonb));
end $$;

create function public.create_visit(p_secret text, p_ip text, p_payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := app_private.visit_cfg(); today date := (now() at time zone 'Asia/Gaza')::date;
  ph text := public.normalize_phone(p_payload->>'phone'); nm text := btrim(coalesce(p_payload->>'name', ''));
  ar text := btrim(coalesce(p_payload->>'area', '')); d date; sl text := p_payload->>'slot'; br public.branches; v public.visits; taken int; its text[];
begin
  perform app_private.check_secret(p_secret);
  perform app_private.rl('vip:' || coalesce(p_ip, '-'), 6, 3600);
  if coalesce((c->>'enabled')::boolean, false) is not true then raise exception 'visits_closed'; end if;
  if ph is null then raise exception 'invalid_phone'; end if;
  perform app_private.rl('vph:' || ph, 3, 86400);
  if char_length(nm) < 2 then raise exception 'invalid_name'; end if;
  if char_length(ar) < 2 then raise exception 'area_required'; end if;
  select * into br from public.branches where is_active and id::text = p_payload->>'branch_id';
  if not found then raise exception 'invalid_branch'; end if;
  begin d := (p_payload->>'date')::date; exception when others then raise exception 'invalid_slot'; end;
  if d is null or d < today + coalesce((c->>'lead_days')::int, 1) or d > today + coalesce((c->>'horizon_days')::int, 14) then raise exception 'invalid_slot'; end if;
  if not (c->'days' @> to_jsonb(extract(dow from d)::int)) or not (c->'slots' @> to_jsonb(sl)) then raise exception 'invalid_slot'; end if;
  select array_agg(x) into its from jsonb_array_elements_text(coalesce(p_payload->'items', '[]'::jsonb)) x where c->'items' @> to_jsonb(x);
  -- serialize bookings of the same branch/day/slot so capacity can't be exceeded by concurrent requests
  perform pg_advisory_xact_lock(hashtextextended(br.id::text || d::text || sl, 0));
  select count(*) into taken from public.visits where branch_id = br.id and visit_date = d and slot = sl and status <> 'cancelled';
  if taken >= coalesce((c->>'capacity')::int, 1) then raise exception 'slot_taken'; end if;
  insert into public.visits (branch_id, customer_name, phone, area, address, items, notes, visit_date, slot)
  values (br.id, left(nm, 80), ph, left(ar, 80), left(nullif(btrim(coalesce(p_payload->>'address', '')), ''), 300), coalesce(its, '{}'), left(nullif(btrim(coalesce(p_payload->>'notes', '')), ''), 500), d, sl)
  returning * into v;
  perform app_private.wh_enqueue('visit.created', jsonb_build_object('number', v.number, 'customer_name', v.customer_name, 'phone', v.phone, 'branch', br.name,
    'area', v.area, 'address', v.address, 'items', to_jsonb(v.items), 'notes', v.notes, 'date', v.visit_date, 'slot', v.slot));
  return jsonb_build_object('number', v.number, 'date', v.visit_date, 'slot', v.slot, 'branch', br.name, 'whatsapp', br.whatsapp);
end $$;

-- Morning digest of today's visits, enqueued at most once per day (the cron endpoint is public, so this must be idempotent).
create table app_private.digests (day date primary key, created_at timestamptz not null default now());
create function public.visits_digest(p_secret text) returns boolean language plpgsql security definer set search_path = '' as $$
declare today date := (now() at time zone 'Asia/Gaza')::date; list jsonb;
begin
  perform app_private.check_secret(p_secret);
  insert into app_private.digests (day) values (today) on conflict do nothing;
  if not found then return false; end if;
  select jsonb_agg(jsonb_build_object('number', v.number, 'slot', v.slot, 'customer_name', v.customer_name, 'phone', v.phone, 'area', v.area, 'branch', b.name, 'status', v.status, 'items', to_jsonb(v.items)) order by v.slot)
    into list from public.visits v join public.branches b on b.id = v.branch_id where v.visit_date = today and v.status in ('new', 'confirmed');
  if list is null then return false; end if;
  perform app_private.wh_enqueue('visits.today', jsonb_build_object('date', today, 'visits', list));
  return true;
end $$;
