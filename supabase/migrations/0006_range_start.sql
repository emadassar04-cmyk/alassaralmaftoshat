create function public.range_start(p_range text) returns timestamptz language sql stable set search_path = '' as $$
  select case p_range
    when 'today' then (date_trunc('day', now() at time zone 'Asia/Gaza')) at time zone 'Asia/Gaza'
    when 'tomorrow' then (date_trunc('day', now() at time zone 'Asia/Gaza') + interval '1 day') at time zone 'Asia/Gaza'
    when 'week' then (date_trunc('day', now() at time zone 'Asia/Gaza') - interval '6 days') at time zone 'Asia/Gaza'
    when 'month' then (date_trunc('day', now() at time zone 'Asia/Gaza') - interval '29 days') at time zone 'Asia/Gaza'
    else '-infinity'::timestamptz end
$$;
revoke execute on function public.range_start(text) from public, anon;
grant execute on function public.range_start(text) to authenticated;
