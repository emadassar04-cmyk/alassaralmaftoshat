-- Server-only RPCs. The Next.js server proves itself with a shared secret (hash stored in app_private.secrets).
create function app_private.check_secret(p text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if p is null or encode(extensions.digest(p, 'sha256'), 'hex') is distinct from (select hash from app_private.secrets where name = 'server') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;

create function app_private.rl(p_key text, p_max int, p_window int) returns void language plpgsql security definer set search_path = '' as $$
declare b timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window) * p_window); c int;
begin
  insert into app_private.rate_limits (key, bucket, n) values (p_key, b, 1)
  on conflict (key, bucket) do update set n = app_private.rate_limits.n + 1 returning n into c;
  if c > p_max then raise exception 'rate_limited' using errcode = 'P0001'; end if;
  if random() < 0.02 then delete from app_private.rate_limits where bucket < now() - interval '1 day'; end if;
end $$;

create function public.normalize_phone(p text) returns text language plpgsql immutable set search_path = '' as $$
declare d text := regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g');
begin
  if d ~ '^00' then d := substr(d, 3); end if;
  if d ~ '^0[0-9]{9}$' then return '+970' || substr(d, 2); end if;
  if d ~ '^(970|972)[0-9]{9}$' then return '+' || d; end if;
  if d ~ '^5[0-9]{8}$' then return '+970' || d; end if;
  return null;
end $$;

-- returns {valid, discount, coupon_id, message}
create function app_private.eval_coupon(p_code text, p_phone text, p_subtotal numeric) returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.coupons; d numeric;
begin
  select * into c from public.coupons where upper(code) = upper(trim(p_code)) and is_active;
  if not found then return jsonb_build_object('valid', false, 'message', 'كود الخصم غير صحيح'); end if;
  if c.expires_at is not null and c.expires_at < now() then return jsonb_build_object('valid', false, 'message', 'انتهت صلاحية الكود'); end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then return jsonb_build_object('valid', false, 'message', 'تم استخدام هذا الكود'); end if;
  if c.lead_phone is not null and c.lead_phone is distinct from p_phone then return jsonb_build_object('valid', false, 'message', 'هذا الكود مرتبط برقم آخر'); end if;
  if p_subtotal < c.min_order then return jsonb_build_object('valid', false, 'message', 'الحد الأدنى للطلب ' || c.min_order::text || ' ₪'); end if;
  d := case c.kind when 'percent' then round(p_subtotal * c.value / 100, 2) else least(c.value, p_subtotal) end;
  return jsonb_build_object('valid', true, 'discount', d, 'coupon_id', c.id, 'message', 'تم تطبيق الخصم');
end $$;

create function public.validate_coupon(p_secret text, p_ip text, p_code text, p_phone text, p_subtotal numeric) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare ph text := public.normalize_phone(p_phone); r jsonb;
begin
  perform app_private.check_secret(p_secret); perform app_private.rl('cpn:' || coalesce(p_ip, '-'), 30, 3600);
  r := app_private.eval_coupon(p_code, ph, p_subtotal);
  return r - 'coupon_id';
end $$;

create function public.create_order(p_secret text, p_ip text, p_payload jsonb) returns jsonb
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
    unit := coalesce(var.price, prod.sale_price, prod.base_price);
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
    values (o.id, prod.id, var.id, prod.name, var.label, q, coalesce(var.price, prod.sale_price, prod.base_price),
            case when jsonb_typeof(it->'measurements') = 'object' then it->'measurements' end, prod.is_custom);
  end loop;

  return jsonb_build_object('number', o.number, 'token', o.token, 'subtotal', o.subtotal, 'discount', o.discount, 'total', o.total);
end $$;

create function public.create_lead(p_secret text, p_ip text, p_phone text, p_source text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare ph text := public.normalize_phone(p_phone); l public.leads; c public.coupons; code text;
begin
  perform app_private.check_secret(p_secret); perform app_private.rl('lead:' || coalesce(p_ip, '-'), 5, 3600);
  if ph is null then raise exception 'invalid_phone'; end if;
  select * into l from public.leads where phone = ph;
  if found then
    select * into c from public.coupons where id = l.coupon_id;
    return jsonb_build_object('code', c.code, 'percent', c.value, 'existing', true);
  end if;
  code := 'ASSAR-' || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6));
  insert into public.coupons (code, kind, value, max_uses, expires_at, lead_phone) values (code, 'percent', 10, 1, now() + interval '30 days', ph) returning * into c;
  insert into public.leads (phone, coupon_id, source) values (ph, c.id, left(p_source, 40));
  return jsonb_build_object('code', c.code, 'percent', c.value, 'existing', false);
end $$;

-- customer tracking: the unguessable token is the credential
create function public.get_order_by_token(p_token text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare o public.orders; b public.branches;
begin
  select * into o from public.orders where token = p_token;
  if not found then return null; end if;
  select * into b from public.branches where id = o.branch_id;
  return jsonb_build_object('number', o.number, 'status', o.status, 'created_at', o.created_at, 'fulfillment', o.fulfillment,
    'payment_method', o.payment_method, 'subtotal', o.subtotal, 'discount', o.discount, 'total', o.total, 'address', o.address,
    'branch', jsonb_build_object('name', b.name, 'whatsapp', b.whatsapp),
    'items', coalesce((select jsonb_agg(jsonb_build_object('product_id', product_id, 'name', name, 'variant', variant_label, 'qty', qty,
        'price', coalesce(custom_price, unit_price), 'measurements', measurements, 'is_custom', is_custom) order by name) from public.order_items where order_id = o.id), '[]'::jsonb));
end $$;

create function public.submit_review(p_secret text, p_ip text, p_token text, p_product uuid, p_rating int, p_name text, p_body text) returns void
language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  perform app_private.check_secret(p_secret); perform app_private.rl('rev:' || coalesce(p_ip, '-'), 10, 3600);
  select * into o from public.orders where token = p_token and status = 'received';
  if not found then raise exception 'not_eligible'; end if;
  if not exists (select 1 from public.order_items where order_id = o.id and product_id = p_product) then raise exception 'not_eligible'; end if;
  if exists (select 1 from public.reviews where order_id = o.id and product_id = p_product) then raise exception 'already_reviewed'; end if;
  insert into public.reviews (product_id, order_id, author_name, rating, body) values (p_product, o.id, left(btrim(p_name), 60), p_rating, left(p_body, 1000));
end $$;

-- stock: deducted when an order becomes "confirmed", restored if cancelled afterwards. Custom items are never tracked.
create function app_private.orders_stock() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if new.status = 'confirmed' and not new.stock_deducted then
    update public.product_variants v set stock = v.stock - s.q
    from (select variant_id, sum(qty) q from public.order_items where order_id = new.id and not is_custom and variant_id is not null group by 1) s
    where v.id = s.variant_id;
    new.stock_deducted := true;
  elsif new.status = 'cancelled' and new.stock_deducted then
    update public.product_variants v set stock = v.stock + s.q
    from (select variant_id, sum(qty) q from public.order_items where order_id = new.id and not is_custom and variant_id is not null group by 1) s
    where v.id = s.variant_id;
    new.stock_deducted := false;
  end if;
  return new;
end $$;
create trigger trg_orders_stock before update on public.orders for each row execute function app_private.orders_stock();

-- Only the storefront RPCs are callable by anon/authenticated; internal helpers are not.
revoke execute on all functions in schema app_private from public, anon, authenticated;
