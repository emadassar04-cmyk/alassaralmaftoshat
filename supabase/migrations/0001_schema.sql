-- Al-Assar: core schema (phase 1 + role/audit foundations)
create extension if not exists pgcrypto with schema extensions;
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table app_private.secrets (name text primary key, hash text not null);
create table app_private.rate_limits (key text not null, bucket timestamptz not null, n int not null default 1, primary key (key, bucket));

create type public.order_status as enum ('new','confirmed','ready','received','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','supervisor')),
  full_name text, is_active boolean not null default true, created_at timestamptz not null default now()
);
create function public.is_staff() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.profiles where id = auth.uid() and is_active) $$;
create function public.is_owner() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.profiles where id = auth.uid() and is_active and role = 'owner') $$;

create table public.store_settings (key text primary key, value jsonb not null, is_public boolean not null default true, updated_at timestamptz not null default now());
create table public.branches (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null,
  address text, whatsapp text, phone text, hours text, map_url text, sort int not null default 0, is_active boolean not null default true
);
create table public.categories (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, description text, image_url text, sort int not null default 0);
create table public.products (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, description text,
  category_id uuid references public.categories(id) on delete set null,
  base_price numeric(10,2) not null check (base_price >= 0), sale_price numeric(10,2) check (sale_price >= 0),
  is_custom boolean not null default false, is_bestseller boolean not null default false,
  status text not null default 'visible' check (status in ('visible','hidden')),
  measurement_schema jsonb, sort int not null default 0, created_at timestamptz not null default now()
);
create table public.product_variants (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  label text not null, color text, size text, fabric text,
  price numeric(10,2) check (price >= 0), stock int not null default 0 check (stock >= 0),
  sort int not null default 0, is_active boolean not null default true
);
create table public.product_images (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, url text not null, alt text, sort int not null default 0);
create index on public.products (category_id); create index on public.product_variants (product_id); create index on public.product_images (product_id);

create table public.customers (id uuid primary key default gen_random_uuid(), phone text unique not null, name text, created_at timestamptz not null default now());
create table public.coupons (
  id uuid primary key default gen_random_uuid(), code text unique not null, kind text not null check (kind in ('percent','fixed')),
  value numeric(10,2) not null check (value > 0), min_order numeric(10,2) not null default 0,
  max_uses int, used_count int not null default 0, expires_at timestamptz, is_active boolean not null default true,
  lead_phone text, created_at timestamptz not null default now()
);
create table public.leads (id uuid primary key default gen_random_uuid(), phone text unique not null, coupon_id uuid references public.coupons(id) on delete set null, source text, created_at timestamptz not null default now());

create sequence public.order_seq start 1001;
create table public.orders (
  id uuid primary key default gen_random_uuid(), seq bigint not null default nextval('public.order_seq') unique,
  number text generated always as ('AS-' || seq::text) stored,
  token text unique not null default encode(extensions.gen_random_bytes(24), 'hex'),
  customer_id uuid references public.customers(id), customer_name text not null, phone text not null,
  branch_id uuid references public.branches(id), fulfillment text not null check (fulfillment in ('pickup','delivery')), address text,
  payment_method text not null check (payment_method in ('in_store','cod','palpay','jawwal_pay','bank_palestine')),
  status public.order_status not null default 'new',
  subtotal numeric(10,2) not null, discount numeric(10,2) not null default 0, total numeric(10,2) not null,
  coupon_id uuid references public.coupons(id), coupon_code text, notes text,
  stock_deducted boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.orders (status, created_at desc); create index on public.orders (phone);
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null, variant_id uuid references public.product_variants(id) on delete set null,
  name text not null, variant_label text, qty int not null check (qty > 0), unit_price numeric(10,2) not null, custom_price numeric(10,2),
  measurements jsonb, is_custom boolean not null default false
);
create index on public.order_items (order_id);
create table public.reviews (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null, author_name text not null,
  rating int not null check (rating between 1 and 5), body text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')), created_at timestamptz not null default now()
);
create table public.posts (id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, excerpt text, body text not null, cover_url text, published boolean not null default false, published_at timestamptz default now());
create table public.audit_log (id bigint generated always as identity primary key, actor uuid, action text not null, entity text, entity_id text, details jsonb, created_at timestamptz not null default now());

-- RLS
alter table public.profiles enable row level security; alter table public.store_settings enable row level security;
alter table public.branches enable row level security; alter table public.categories enable row level security;
alter table public.products enable row level security; alter table public.product_variants enable row level security;
alter table public.product_images enable row level security; alter table public.customers enable row level security;
alter table public.coupons enable row level security; alter table public.leads enable row level security;
alter table public.orders enable row level security; alter table public.order_items enable row level security;
alter table public.reviews enable row level security; alter table public.posts enable row level security;
alter table public.audit_log enable row level security;

-- public (storefront) reads
create policy pub_branches on public.branches for select using (is_active);
create policy pub_categories on public.categories for select using (true);
create policy pub_products on public.products for select using (status = 'visible');
create policy pub_variants on public.product_variants for select using (is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'visible'));
create policy pub_images on public.product_images for select using (exists (select 1 from public.products p where p.id = product_id and p.status = 'visible'));
create policy pub_posts on public.posts for select using (published);
create policy pub_reviews on public.reviews for select using (status = 'approved');
create policy pub_settings on public.store_settings for select using (is_public);

-- staff (owner + supervisor)
create policy staff_all_branches on public.branches for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all_categories on public.categories for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all_products on public.products for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all_variants on public.product_variants for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all_images on public.product_images for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all_coupons on public.coupons for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all_orders on public.orders for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all_items on public.order_items for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all_reviews on public.reviews for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all_posts on public.posts for all to authenticated using (public.is_staff()) with check (public.is_staff());
-- owner only
create policy owner_all_settings on public.store_settings for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy owner_all_customers on public.customers for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy owner_all_leads on public.leads for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy owner_read_audit on public.audit_log for select to authenticated using (public.is_owner());
create policy own_profile on public.profiles for select to authenticated using (id = auth.uid() or public.is_owner());
create policy owner_manage_profiles on public.profiles for all to authenticated using (public.is_owner()) with check (public.is_owner());
-- orders / customers / leads / coupons have NO anon policies: the storefront writes only through the SECURITY DEFINER RPCs in 0002.
