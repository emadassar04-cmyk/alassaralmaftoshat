-- Measurement-based pricing for made-to-measure products.
-- products.measurement_schema may carry  "pricing": {"type": "area", "length": "<field key>", "width": "<field key>", "unit": "m"|"cm"}
-- => unit price = (variant price | sale price | base price) x length x width  (in square metres), rounded to 2 decimals.
-- Without "pricing" (or for normal products) the unit price stays the variant/sale/base price, exactly as before.
-- The server always recomputes this from the DB; the price sent by the browser is ignored.

create or replace function app_private.item_price(prod public.products, var public.product_variants, meas jsonb) returns numeric
language plpgsql stable set search_path = '' as $$
declare
  rate numeric := coalesce(var.price, prod.sale_price, prod.base_price);
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


-- Batana: priced per square metre (base price = rate), measured in metres.
update public.products
   set measurement_schema = jsonb_build_object(
         'diagram', 'batana',
         'fields', jsonb_build_array(
           jsonb_build_object('key', 'length_m', 'label', 'الطول (متر)', 'type', 'number', 'hint', 'مثال: 4 أو 1.5'),
           jsonb_build_object('key', 'width_m', 'label', 'العرض (متر)', 'type', 'number', 'hint', 'مثال: 4 أو 0.9')),
         'pricing', jsonb_build_object('type', 'area', 'length', 'length_m', 'width', 'width_m', 'unit', 'm'))
 where slug = 'batana-mufassala';
