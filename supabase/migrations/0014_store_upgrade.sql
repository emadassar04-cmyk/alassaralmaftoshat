-- Store upgrade: product-level stock, scheduled offers, featured products, category visibility,
-- internal order notes, and reference photos for custom orders. Existing data is preserved.

-- 1) Products without variants can now track stock (NULL = not tracked, as before).
alter table public.products add column stock int check (stock is null or stock >= 0);
alter table public.products add column is_featured boolean not null default false;
-- 2) Offers can be scheduled; outside the window the sale price is ignored everywhere (site + server pricing).
alter table public.products add column sale_starts_at timestamptz, add column sale_ends_at timestamptz;
alter table public.products add constraint sale_window check (sale_starts_at is null or sale_ends_at is null or sale_starts_at < sale_ends_at);
-- 3) Categories can be hidden without deleting them.
alter table public.categories add column is_visible boolean not null default true;
-- 4) Staff-only notes on an order.
alter table public.orders add column staff_notes text;
create trigger aud_categories after insert or update or delete on public.categories for each row execute function app_private.audit();

create or replace function app_private.active_sale(prod public.products) returns numeric language sql stable set search_path = '' as $$
  select case when prod.sale_price is not null
               and (prod.sale_starts_at is null or prod.sale_starts_at <= now())
               and (prod.sale_ends_at is null or prod.sale_ends_at > now())
              then prod.sale_price end
$$;
revoke all on function app_private.active_sale(public.products) from public, anon, authenticated;

create or replace function app_private.item_price(prod public.products, var public.product_variants, meas jsonb) returns numeric
language plpgsql stable set search_path = '' as $$
declare
  rate numeric := coalesce(var.price, app_private.active_sale(prod), prod.base_price);
  pr jsonb := prod.measurement_schema->'pricing'; f jsonb; l_lbl text; w_lbl text; l numeric; w numeric; k numeric;
begin
  if not prod.is_custom or pr is null or pr->>'type' <> 'area' then return rate; end if;
  for f in select * from jsonb_array_elements(coalesce(prod.measurement_schema->'fields', '[]'::jsonb)) loop
    if f->>'key' = pr->>'length' then l_lbl := f->>'label'; end if;
    if f->>'key' = pr->>'width' then w_lbl := f->>'label'; end if;
  end loop;
  if jsonb_typeof(meas) <> 'object' then return null; end if;
  begin
    l := replace(translate(btrim(meas->>l_lbl), '٠١٢٣٤٥٦٧٨٩٫', '0123456789.'), ',', '.')::numeric;
    w := replace(translate(btrim(meas->>w_lbl), '٠١٢٣٤٥٦٧٨٩٫', '0123456789.'), ',', '.')::numeric;
  exception when others then return null;
  end;
  k := case when pr->>'unit' = 'cm' then 0.01 else 1 end;
  l := l * k; w := w * k;
  if l is null or w is null or l <= 0 or w <= 0 or l > 30 or w > 30 then return null; end if; -- sanity: up to 30 m per side
  return round(rate * l * w, 2);
end $$;
revoke all on function app_private.item_price(public.products, public.product_variants, jsonb) from public, anon, authenticated;

create or replace function public.create_order(p_secret text, p_ip text, p_payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  ph text := public.normalize_phone(p_payload->>'phone'); nm text := btrim(coalesce(p_payload->>'name', ''));
  ful text := p_payload->>'fulfillment'; pay text := p_payload->>'payment_method';
  br uuid; cust uuid; it jsonb; prod public.products; var public.product_variants; unit numeric; q int;
  sub numeric := 0; cp jsonb; disc numeric := 0; cid uuid; o public.orders; n int := 0;
begin
  perform app_private.check_secret(p_secret);
  perform app_private.rl('ip:' || coalesce(p_ip, '-'), 10, 3600);
  if ph is null then raise exception 'invalid_phone'; end if;
  perform app_private.rl('ph:' || ph, 5, 3600);
  if char_length(nm) < 2 then raise exception 'invalid_name'; end if;
  if ful not in ('pickup','delivery') or pay not in ('in_store','cod','palpay','jawwal_pay','bank_palestine') then raise exception 'invalid_options'; end if;
  if ful = 'delivery' and char_length(btrim(coalesce(p_payload->>'address', ''))) < 3 then raise exception 'address_required'; end if;
  select id into br from public.branches where is_active and (id::text = p_payload->>'branch_id' or slug = p_payload->>'branch_slug') limit 1;
  if br is null then raise exception 'invalid_branch'; end if;
  if jsonb_typeof(p_payload->'items') <> 'array' or jsonb_array_length(p_payload->'items') not between 1 and 30 then raise exception 'invalid_items'; end if;

  insert into public.customers (phone, name) values (ph, nm) on conflict (phone) do update set name = excluded.name returning id into cust;

  -- first pass: price + stock validation (nothing is deducted until the order is confirmed)
  for it in select * from jsonb_array_elements(p_payload->'items') loop
    q := greatest(1, least(coalesce((it->>'qty')::int, 1), 50));
    select * into prod from public.products where id = (it->>'product_id')::uuid and status = 'visible';
    if not found then raise exception 'invalid_product'; end if;
    var := null;
    if (it->>'variant_id') is not null then
      select * into var from public.product_variants where id = (it->>'variant_id')::uuid and product_id = prod.id and is_active;
      if not found then raise exception 'invalid_variant'; end if;
    elsif exists (select 1 from public.product_variants where product_id = prod.id and is_active) and not prod.is_custom then
      raise exception 'variant_required';
    end if;
    if not prod.is_custom and var.id is not null and var.stock < q then raise exception 'out_of_stock:%', prod.name; end if;
    if not prod.is_custom and var.id is null and prod.stock is not null and prod.stock < q then raise exception 'out_of_stock:%', prod.name; end if;
    unit := app_private.item_price(prod, var, it->'measurements');
    if unit is null then raise exception 'invalid_measurements:%', prod.name; end if;
    sub := sub + unit * q; n := n + 1;
  end loop;

  if nullif(btrim(coalesce(p_payload->>'coupon_code', '')), '') is not null then
    cp := app_private.eval_coupon(p_payload->>'coupon_code', ph, sub);
    if not (cp->>'valid')::boolean then raise exception 'coupon:%', cp->>'message'; end if;
    disc := (cp->>'discount')::numeric; cid := (cp->>'coupon_id')::uuid;
    update public.coupons set used_count = used_count + 1 where id = cid;
  end if;

  insert into public.orders (customer_id, customer_name, phone, branch_id, fulfillment, address, payment_method, subtotal, discount, total, coupon_id, coupon_code, notes)
  values (cust, nm, ph, br, ful, nullif(btrim(coalesce(p_payload->>'address','')), ''), pay, sub, disc, sub - disc, cid, upper(nullif(btrim(coalesce(p_payload->>'coupon_code','')), '')), left(p_payload->>'notes', 1000))
  returning * into o;

  for it in select * from jsonb_array_elements(p_payload->'items') loop
    q := greatest(1, least(coalesce((it->>'qty')::int, 1), 50));
    select * into prod from public.products where id = (it->>'product_id')::uuid;
    var := null;
    if (it->>'variant_id') is not null then select * into var from public.product_variants where id = (it->>'variant_id')::uuid; end if;
    insert into public.order_items (order_id, product_id, variant_id, name, variant_label, qty, unit_price, measurements, is_custom)
    values (o.id, prod.id, var.id, prod.name, var.label, q, app_private.item_price(prod, var, it->'measurements'),
            case when jsonb_typeof(it->'measurements') = 'object' then it->'measurements' end, prod.is_custom);
  end loop;

  return jsonb_build_object('number', o.number, 'token', o.token, 'subtotal', o.subtotal, 'discount', o.discount, 'total', o.total);
end $$;



-- Stock: deducted on "confirmed", restored on "cancelled" — now for variants AND untracked-variant products with a stock number.
create or replace function app_private.orders_stock() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if new.status = 'confirmed' and not new.stock_deducted then
    update public.product_variants v set stock = greatest(0, v.stock - s.q)
    from (select variant_id, sum(qty) q from public.order_items where order_id = new.id and not is_custom and variant_id is not null group by 1) s
    where v.id = s.variant_id;
    update public.products p set stock = greatest(0, p.stock - s.q)
    from (select product_id, sum(qty) q from public.order_items where order_id = new.id and not is_custom and variant_id is null group by 1) s
    where p.id = s.product_id and p.stock is not null;
    new.stock_deducted := true;
  elsif new.status = 'cancelled' and new.stock_deducted then
    update public.product_variants v set stock = v.stock + s.q
    from (select variant_id, sum(qty) q from public.order_items where order_id = new.id and not is_custom and variant_id is not null group by 1) s
    where v.id = s.variant_id;
    update public.products p set stock = p.stock + s.q
    from (select product_id, sum(qty) q from public.order_items where order_id = new.id and not is_custom and variant_id is null group by 1) s
    where p.id = s.product_id and p.stock is not null;
    new.stock_deducted := false;
  end if;
  return new;
end $$;

create function app_private.trg_product_stock() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.stock is not null and new.stock <= 5 and coalesce(old.stock, 999999) > 5 and not new.is_custom then
    perform app_private.wh_enqueue('stock.low', jsonb_build_object('product', new.name, 'variant', '', 'stock', new.stock));
  end if;
  return null;
end $$;
create trigger wh_product_stock after update of stock on public.products for each row execute function app_private.trg_product_stock();

-- 5) Reference photos for custom orders: private bucket, visitors may only CREATE small images under refs/,
--    nobody but staff can read or list them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('custom-refs', 'custom-refs', false, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy anon_upload_custom_refs on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'custom-refs' and name ~ '^refs/[0-9a-f-]{36}\.(webp|jpg|png)$');
create policy staff_read_custom_refs on storage.objects for select to authenticated using (bucket_id = 'custom-refs' and public.is_staff());
create policy staff_delete_custom_refs on storage.objects for delete to authenticated using (bucket_id = 'custom-refs' and public.is_staff());
