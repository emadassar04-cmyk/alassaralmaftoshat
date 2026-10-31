drop policy staff_all_coupons on public.coupons;
create policy staff_all_coupons on public.coupons for all to authenticated
  using (public.is_staff() and (lead_phone is null or public.is_owner()))
  with check (public.is_staff() and (lead_phone is null or public.is_owner()));
