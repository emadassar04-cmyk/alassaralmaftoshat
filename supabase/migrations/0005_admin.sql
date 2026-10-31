-- Phase 2: admin foundations (storage, audit, totals, stats, staff management)

-- Storage: public-read product images, staff-only writes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;
create policy staff_insert_product_images on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_staff());
create policy staff_update_product_images on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_staff()) with check (bucket_id = 'product-images' and public.is_staff());
create policy staff_delete_product_images on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_staff());

-- Audit log: records only changes made by signed-in staff (auth.uid() is null for storefront RPCs)
create function app_private.audit() returns trigger language plpgsql security definer set search_path = '' as $$
declare d jsonb; rid text;
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(n.key, jsonb_build_object('old', o.value, 'new', n.value)), '{}'::jsonb) into d
    from jsonb_each(to_jsonb(new)) n join jsonb_each(to_jsonb(old)) o using (key)
    where n.value is distinct from o.value and n.key <> 'updated_at';
    if d = '{}'::jsonb then return new; end if;
    insert into public.audit_log (actor, action, entity, entity_id, details) values (auth.uid(), 'update', tg_table_name, to_jsonb(new)->>'id', d);
    return new;
  elsif tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, entity, entity_id, details) values (auth.uid(), 'insert', tg_table_name, to_jsonb(new)->>'id', to_jsonb(new));
    return new;
  else
    insert into public.audit_log (actor, action, entity, entity_id, details) values (auth.uid(), 'delete', tg_table_name, to_jsonb(old)->>'id', to_jsonb(old));
    return old;
  end if;
end $$;
create trigger aud_products after insert or update or delete on public.products for each row execute function app_private.audit();
create trigger aud_variants after insert or update or delete on public.product_variants for each row execute function app_private.audit();
create trigger aud_orders after update or delete on public.orders for each row execute function app_private.audit();
create trigger aud_items after update or delete on public.order_items for each row execute function app_private.audit();
create trigger aud_coupons after insert or update or delete on public.coupons for each row execute function app_private.audit();
create trigger aud_branches after insert or update or delete on public.branches for each row execute function app_private.audit();
create trigger aud_settings after insert or update or delete on public.store_settings for each row execute function app_private.audit();
create trigger aud_reviews after update or delete on public.reviews for each row execute function app_private.audit();
create trigger aud_posts after insert or update or delete on public.posts for each row execute function app_private.audit();
create trigger aud_profiles after insert or update or delete on public.profiles for each row execute function app_private.audit();

-- A staff-edited item price (custom_price) re-prices the order
create function app_private.recalc_order() returns trigger language plpgsql security definer set search_path = '' as $$
declare oid uuid := coalesce(new.order_id, old.order_id);
begin
  update public.orders o set subtotal = s.sub, total = greatest(0, s.sub - o.discount)
  from (select coalesce(sum(coalesce(custom_price, unit_price) * qty), 0) sub from public.order_items where order_id = oid) s
  where o.id = oid;
  return null;
end $$;
create trigger trg_recalc_order after update of custom_price, unit_price, qty or delete on public.order_items for each row execute function app_private.recalc_order();

-- Dashboard stats. Money figures are returned for the owner only.
create function public.admin_stats(p_from timestamptz, p_to timestamptz, p_branch uuid default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare own boolean := public.is_owner(); r jsonb;
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  with o as (select * from public.orders where created_at >= p_from and created_at < p_to and (p_branch is null or branch_id = p_branch)),
       v as (select * from o where status <> 'cancelled')
  select jsonb_build_object(
    'orders_total', (select count(*) from o),
    'orders_new', (select count(*) from public.orders where status = 'new'),
    'by_status', (select coalesce(jsonb_object_agg(status, c), '{}'::jsonb) from (select status, count(*) c from o group by 1) x),
    'top_products', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'qty', q, 'revenue', case when own then rev end) order by q desc), '[]'::jsonb)
      from (select i.name, sum(i.qty) q, sum(coalesce(i.custom_price, i.unit_price) * i.qty) rev from public.order_items i join v on v.id = i.order_id group by i.name order by 2 desc limit 8) t),
    'sales', case when own then (select coalesce(sum(total), 0) from v) end,
    'by_branch', case when own then (select coalesce(jsonb_agg(jsonb_build_object('branch', b.name, 'orders', x.c, 'sales', x.s)), '[]'::jsonb)
      from (select branch_id, count(*) c, sum(total) s from v group by 1) x join public.branches b on b.id = x.branch_id) end,
    'by_payment', case when own then (select coalesce(jsonb_agg(jsonb_build_object('method', payment_method, 'orders', c)), '[]'::jsonb) from (select payment_method, count(*) c from v group by 1) x) end,
    'daily', case when own then (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'orders', c, 'sales', s) order by d), '[]'::jsonb)
      from (select (created_at at time zone 'Asia/Gaza')::date d, count(*) c, sum(total) s from v group by 1) x) end,
    'leads', case when own then (select count(*) from public.leads where created_at >= p_from and created_at < p_to) end
  ) into r;
  return r;
end $$;

create function public.admin_customers() returns table (phone text, name text, orders bigint, spent numeric, last_order timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select o.phone, max(o.customer_name), count(*), coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0), max(o.created_at)
    from public.orders o group by o.phone order by 5 desc;
end $$;

create function public.list_staff() returns table (id uuid, email text, role text, full_name text, is_active boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select p.id, u.email::text, p.role, p.full_name, p.is_active from public.profiles p join auth.users u on u.id = p.id order by p.created_at;
end $$;

create function public.owner_set_role(p_email text, p_role text, p_name text default null, p_active boolean default true) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
  if not public.is_owner() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_role not in ('owner', 'supervisor') then raise exception 'invalid_role'; end if;
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then raise exception 'user_not_found'; end if;
  if uid = auth.uid() and (p_role <> 'owner' or not p_active) then raise exception 'cannot_change_self'; end if;
  insert into public.profiles (id, role, full_name, is_active) values (uid, p_role, p_name, p_active)
  on conflict (id) do update set role = excluded.role, full_name = coalesce(excluded.full_name, public.profiles.full_name), is_active = excluded.is_active;
end $$;

revoke execute on function public.admin_stats(timestamptz, timestamptz, uuid), public.admin_customers(), public.list_staff(), public.owner_set_role(text, text, text, boolean) from public, anon;
grant execute on function public.admin_stats(timestamptz, timestamptz, uuid), public.admin_customers(), public.list_staff(), public.owner_set_role(text, text, text, boolean) to authenticated;

alter publication supabase_realtime add table public.orders;
