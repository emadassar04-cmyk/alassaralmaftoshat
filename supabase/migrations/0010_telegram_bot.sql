-- Customer Telegram bot (runs inside the site). Owner-only dashboard; webhook handler uses secret-gated RPCs.
alter table public.bot_conversations add column handled_by text not null default 'bot' check (handled_by in ('bot','human'));
alter table public.bot_conversations add column needs_human boolean not null default false;
alter table public.bot_messages add column author text not null default 'ai' check (author in ('ai','human'));
create table app_private.bot_updates (update_id bigint primary key, created_at timestamptz not null default now());
insert into public.integration_settings (key, config) values ('bot', '{"enabled": false}') on conflict (key) do nothing;

create function public.bot_config(p_secret text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform app_private.check_secret(p_secret);
  return (select jsonb_build_object('config', config, 'secrets', secrets) from public.integration_settings where key = 'bot');
end $$;

-- Records an incoming customer message once (Telegram may redeliver an update). Returns the conversation state.
create function public.bot_ingest(p_secret text, p_update_id bigint, p_chat_id text, p_name text, p_text text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c public.bot_conversations;
begin
  perform app_private.check_secret(p_secret);
  insert into app_private.bot_updates (update_id) values (p_update_id) on conflict do nothing;
  if not found then return jsonb_build_object('duplicate', true); end if;
  if random() < 0.02 then delete from app_private.bot_updates where created_at < now() - interval '3 days'; end if;
  insert into public.bot_conversations (channel, external_id, customer_name, last_message_at) values ('telegram', left(p_chat_id, 100), left(p_name, 100), now())
  on conflict (channel, external_id) do update set customer_name = coalesce(excluded.customer_name, public.bot_conversations.customer_name), last_message_at = now()
  returning * into c;
  insert into public.bot_messages (conversation_id, role, author, body) values (c.id, 'customer', 'ai', left(p_text, 4000));
  return jsonb_build_object('duplicate', false, 'conversation_id', c.id, 'handled_by', c.handled_by, 'needs_human', c.needs_human, 'phone', c.phone);
end $$;

create function public.bot_history(p_secret text, p_conversation uuid, p_limit int default 20) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform app_private.check_secret(p_secret);
  return coalesce((select jsonb_agg(jsonb_build_object('role', role, 'body', body) order by sent_at, id)
    from (select * from public.bot_messages where conversation_id = p_conversation order by sent_at desc, id desc limit least(p_limit, 40)) m), '[]'::jsonb);
end $$;

create function public.bot_save_reply(p_secret text, p_conversation uuid, p_body text) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.check_secret(p_secret);
  insert into public.bot_messages (conversation_id, role, author, body) values (p_conversation, 'bot', 'ai', left(p_body, 4000));
  update public.bot_conversations set last_message_at = now() where id = p_conversation;
end $$;

create function public.bot_handoff(p_secret text, p_conversation uuid, p_reason text) returns void language plpgsql security definer set search_path = '' as $$
declare c public.bot_conversations;
begin
  perform app_private.check_secret(p_secret);
  update public.bot_conversations set handled_by = 'human', needs_human = true where id = p_conversation returning * into c;
  perform app_private.wh_enqueue('bot.handoff', jsonb_build_object('conversation_id', c.id, 'customer_name', c.customer_name, 'reason', left(p_reason, 300)));
end $$;
