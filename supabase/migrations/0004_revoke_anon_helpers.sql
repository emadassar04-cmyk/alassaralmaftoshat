revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_owner() to authenticated;
