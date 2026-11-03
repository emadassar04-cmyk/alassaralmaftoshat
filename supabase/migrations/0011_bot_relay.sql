-- Optional n8n mode for the customer bot: the site keeps the Telegram webhook and relays messages to n8n over HTTP,
-- falling back to answering itself when n8n is unreachable. These helpers let the site send n8n's replies and record relay health.
create function public.bot_chat_id(p_secret text, p_conversation uuid) returns text language plpgsql stable security definer set search_path = '' as $$
begin
  perform app_private.check_secret(p_secret);
  return (select external_id from public.bot_conversations where id = p_conversation and channel = 'telegram');
end $$;

create function public.bot_relay_status(p_secret text, p_ok boolean, p_error text) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.check_secret(p_secret);
  update public.integration_settings
     set config = config || jsonb_build_object('relay', jsonb_build_object('ok', p_ok, 'at', now(), 'error', left(coalesce(p_error, ''), 200)))
   where key = 'bot';
end $$;
