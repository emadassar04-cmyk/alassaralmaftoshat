-- Direct Telegram notifications from the site (independent of n8n / ngrok). Same outbox, one row per target.
alter table public.webhook_logs add column target text not null default 'n8n' check (target in ('n8n','telegram'));

create or replace function app_private.wh_enqueue(p_event text, p_payload jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.integration_settings where key = 'n8n' and (config->>'enabled')::boolean is true and coalesce(config->>'webhook_url', '') <> '') then
    insert into public.webhook_logs (event, payload, target) values (p_event, p_payload, 'n8n');
  end if;
  if exists (select 1 from public.integration_settings where key = 'telegram' and (config->>'notify')::boolean is true and coalesce(config->>'chat_id', '') <> '' and coalesce(secrets->>'token', '') <> '') then
    insert into public.webhook_logs (event, payload, target) values (p_event, p_payload, 'telegram');
  end if;
end $$;

create function public.dispatch_claim2(p_secret text, p_limit int default 10) returns table (id uuid, event text, payload jsonb, created_at timestamptz, attempts int, target text)
language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.check_secret(p_secret);
  return query
  with c as (select w.id from public.webhook_logs w where w.status in ('pending','failed') and w.next_attempt_at <= now() order by w.created_at limit least(p_limit, 25) for update skip locked)
  update public.webhook_logs w set attempts = w.attempts + 1, next_attempt_at = now() + interval '2 minutes' from c where w.id = c.id
  returning w.id, w.event, w.payload, w.created_at, w.attempts, w.target;
end $$;

create function public.dispatch_config2(p_secret text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform app_private.check_secret(p_secret);
  return (select jsonb_object_agg(key, jsonb_build_object('config', config, 'secrets', secrets)) from public.integration_settings where key in ('n8n', 'telegram'));
end $$;
