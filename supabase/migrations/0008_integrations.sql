-- Phase 3: integrations (n8n webhooks + API keys), bot conversations
create table public.integration_settings (
  key text primary key, config jsonb not null default '{}'::jsonb, secrets jsonb not null default '{}'::jsonb,
  last_used_at timestamptz, last_test_at timestamptz, last_test_status text, updated_at timestamptz not null default now()
);
create table public.api_keys (
  id uuid primary key default gen_random_uuid(), name text not null default 'n8n', prefix text not null, key_hash text unique not null,
  created_at timestamptz not null default now(), last_used_at timestamptz, revoked_at timestamptz
);
create table public.webhook_logs (
  id uuid primary key default gen_random_uuid(), event text not null, payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','sent','failed','dead')),
  attempts int not null default 0, http_status int, error text, next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(), sent_at timestamptz
);
create index on public.webhook_logs (status, next_attempt_at);
create index on public.webhook_logs (created_at desc);
create table public.bot_conversations (
  id uuid primary key default gen_random_uuid(), channel text not null check (channel in ('telegram','whatsapp')), external_id text not null,
  customer_name text, phone text, last_message_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (channel, external_id)
);
create table public.bot_messages (
  id bigint generated always as identity primary key, conversation_id uuid not null references public.bot_conversations(id) on delete cascade,
  role text not null check (role in ('customer','bot')), body text not null, sent_at timestamptz not null default now()
);
create index on public.bot_messages (conversation_id, sent_at);
alter table public.integration_settings enable row level security; alter table public.api_keys enable row level security;
alter table public.webhook_logs enable row level security; alter table public.bot_conversations enable row level security; alter table public.bot_messages enable row level security;
create policy owner_all_integrations on public.integration_settings for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy owner_all_api_keys on public.api_keys for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy owner_all_webhooks on public.webhook_logs for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy owner_all_conversations on public.bot_conversations for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy owner_all_bot_messages on public.bot_messages for all to authenticated using (public.is_owner()) with check (public.is_owner());
insert into public.integration_settings (key, config) values ('n8n', '{"enabled": false, "webhook_url": ""}'), ('whatsapp', '{}'), ('telegram', '{}'), ('facebook', '{}'), ('gmail', '{}');

-- Enqueue only while the n8n link is enabled and has a URL. A failure to deliver NEVER affects the order itself.
create function app_private.wh_enqueue(p_event text, p_payload jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.integration_settings where key = 'n8n' and (config->>'enabled')::boolean is true and coalesce(config->>'webhook_url', '') <> '') then
    insert into public.webhook_logs (event, payload) values (p_event, p_payload);
  end if;
end $$;

create function app_private.trg_order_created() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.wh_enqueue('order.created', jsonb_build_object('number', new.number, 'status', new.status, 'subtotal', new.subtotal, 'discount', new.discount, 'total', new.total,
    'customer_name', new.customer_name, 'phone', new.phone, 'branch', (select name from public.branches where id = new.branch_id), 'fulfillment', new.fulfillment, 'address', new.address,
    'payment_method', new.payment_method, 'notes', new.notes, 'coupon_code', new.coupon_code, 'track_token', new.token, 'created_at', new.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'variant', variant_label, 'qty', qty, 'unit_price', unit_price, 'is_custom', is_custom, 'measurements', measurements)) from public.order_items where order_id = new.id), '[]'::jsonb)));
  return null;
end $$;
-- deferred: fires at commit, after create_order() has inserted the order items
create constraint trigger wh_order_created after insert on public.orders deferrable initially deferred for each row execute function app_private.trg_order_created();

create function app_private.trg_order_status() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    perform app_private.wh_enqueue('order.status_changed', jsonb_build_object('number', new.number, 'from', old.status, 'to', new.status, 'customer_name', new.customer_name, 'phone', new.phone,
      'total', new.total, 'branch', (select name from public.branches where id = new.branch_id), 'track_token', new.token));
  end if;
  return null;
end $$;
create trigger wh_order_status after update of status on public.orders for each row execute function app_private.trg_order_status();

create function app_private.trg_lead() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.wh_enqueue('lead.created', jsonb_build_object('phone', new.phone, 'source', new.source, 'coupon_code', (select code from public.coupons where id = new.coupon_id), 'created_at', new.created_at));
  return null;
end $$;
create trigger wh_lead after insert on public.leads for each row execute function app_private.trg_lead();

create function app_private.trg_review() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.wh_enqueue('review.created', jsonb_build_object('product', (select name from public.products where id = new.product_id), 'rating', new.rating, 'author', new.author_name, 'body', new.body, 'status', new.status));
  return null;
end $$;
create trigger wh_review after insert on public.reviews for each row execute function app_private.trg_review();

create function app_private.trg_stock() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.stock <= 5 and old.stock > 5 and not coalesce((select is_custom from public.products where id = new.product_id), false) then
    perform app_private.wh_enqueue('stock.low', jsonb_build_object('product', (select name from public.products where id = new.product_id), 'variant', new.label, 'stock', new.stock));
  end if;
  return null;
end $$;
create trigger wh_stock after update of stock on public.product_variants for each row execute function app_private.trg_stock();

-- Server-secret RPCs used by the Next.js server (API key checks, dispatcher, bot endpoints)
create function public.api_authenticate(p_secret text, p_hash text) returns boolean language plpgsql security definer set search_path = '' as $$
declare k uuid;
begin
  perform app_private.check_secret(p_secret);
  if not exists (select 1 from public.integration_settings where key = 'n8n' and (config->>'enabled')::boolean is true) then return false; end if;
  select id into k from public.api_keys where key_hash = p_hash and revoked_at is null;
  if k is null then return false; end if;
  update public.api_keys set last_used_at = now() where id = k;
  update public.integration_settings set last_used_at = now() where key = 'n8n';
  return true;
end $$;

create function public.api_get_order(p_secret text, p_number text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare o public.orders;
begin
  perform app_private.check_secret(p_secret);
  select * into o from public.orders where number = upper(btrim(p_number));
  if not found then return null; end if;
  return jsonb_build_object('number', o.number, 'status', o.status, 'created_at', o.created_at, 'customer_name', o.customer_name, 'phone', o.phone, 'fulfillment', o.fulfillment, 'address', o.address,
    'payment_method', o.payment_method, 'subtotal', o.subtotal, 'discount', o.discount, 'total', o.total, 'branch', (select name from public.branches where id = o.branch_id), 'track_token', o.token,
    'items', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'variant', variant_label, 'qty', qty, 'price', coalesce(custom_price, unit_price), 'measurements', measurements)) from public.order_items where order_id = o.id), '[]'::jsonb));
end $$;

create function public.api_set_order_status(p_secret text, p_number text, p_status text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders; old_s public.order_status;
begin
  perform app_private.check_secret(p_secret);
  if p_status not in ('new','confirmed','ready','received','cancelled') then raise exception 'invalid_status'; end if;
  select * into o from public.orders where number = upper(btrim(p_number));
  if not found then raise exception 'not_found'; end if;
  old_s := o.status;
  update public.orders set status = p_status::public.order_status where id = o.id;
  insert into public.audit_log (actor, action, entity, entity_id, details) values (null, 'update', 'orders', o.id::text, jsonb_build_object('status', jsonb_build_object('old', old_s, 'new', p_status), 'via', 'api'));
  return jsonb_build_object('number', o.number, 'status', p_status);
end $$;

create function public.api_save_message(p_secret text, p_channel text, p_external text, p_name text, p_phone text, p_role text, p_body text, p_at timestamptz) returns uuid
language plpgsql security definer set search_path = '' as $$
declare cid uuid; ph text := public.normalize_phone(p_phone);
begin
  perform app_private.check_secret(p_secret);
  if p_channel not in ('telegram','whatsapp') or p_role not in ('customer','bot') or coalesce(btrim(p_external), '') = '' or coalesce(btrim(p_body), '') = '' then raise exception 'invalid_message'; end if;
  insert into public.bot_conversations (channel, external_id, customer_name, phone, last_message_at) values (p_channel, left(p_external, 100), left(p_name, 100), ph, coalesce(p_at, now()))
  on conflict (channel, external_id) do update set customer_name = coalesce(excluded.customer_name, public.bot_conversations.customer_name), phone = coalesce(excluded.phone, public.bot_conversations.phone),
    last_message_at = greatest(public.bot_conversations.last_message_at, excluded.last_message_at)
  returning id into cid;
  insert into public.bot_messages (conversation_id, role, body, sent_at) values (cid, p_role, left(p_body, 4000), coalesce(p_at, now()));
  return cid;
end $$;

create function public.dispatch_claim(p_secret text, p_limit int default 10) returns table (id uuid, event text, payload jsonb, created_at timestamptz, attempts int)
language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.check_secret(p_secret);
  return query
  with c as (select w.id from public.webhook_logs w where w.status in ('pending','failed') and w.next_attempt_at <= now() order by w.created_at limit least(p_limit, 25) for update skip locked)
  update public.webhook_logs w set attempts = w.attempts + 1, next_attempt_at = now() + interval '2 minutes' from c where w.id = c.id
  returning w.id, w.event, w.payload, w.created_at, w.attempts;
end $$;

create function public.dispatch_result(p_secret text, p_id uuid, p_ok boolean, p_http int, p_error text) returns void language plpgsql security definer set search_path = '' as $$
declare a int;
begin
  perform app_private.check_secret(p_secret);
  select w.attempts into a from public.webhook_logs w where w.id = p_id;
  if p_ok then update public.webhook_logs set status = 'sent', http_status = p_http, error = null, sent_at = now() where id = p_id;
  else update public.webhook_logs set status = case when a >= 8 then 'dead' else 'failed' end, http_status = p_http, error = left(p_error, 300),
    next_attempt_at = now() + (case a when 1 then interval '1 minute' when 2 then interval '5 minutes' when 3 then interval '15 minutes' when 4 then interval '1 hour' when 5 then interval '3 hours' else interval '12 hours' end) where id = p_id; end if;
  update public.integration_settings set last_used_at = now() where key = 'n8n';
end $$;

create function public.dispatch_config(p_secret text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  perform app_private.check_secret(p_secret);
  select jsonb_build_object('config', config, 'secrets', secrets) into r from public.integration_settings where key = 'n8n';
  return r;
end $$;
