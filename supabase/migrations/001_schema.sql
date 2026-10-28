-- Easy EYE schema. Run in Supabase SQL editor.
create extension if not exists "pgcrypto";

create type user_role as enum ('customer','admin');
create type payment_status as enum ('pending','paid','failed');
create type order_status as enum ('awaiting_payment','processing','shipped','delivered','cancelled');

-- profiles mirrors auth.users (spec's "Users" table)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role user_role not null default 'customer',
  saved_addresses jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  frame_shape text,   -- promoted from JSONB for simple filtering
  material text,
  color text,
  frame_details jsonb not null default '{}',  -- lens tech, dimensions, etc.
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index on products (frame_shape);
create index on products (material);
create index on products (color);
create index on products (price);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  total_amount numeric(10,2) not null,
  payment_status payment_status not null default 'pending',
  order_status order_status not null default 'awaiting_payment',
  shipping_address jsonb not null,
  stripe_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check (quantity > 0),
  price_at_purchase numeric(10,2) not null
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  unique (user_id, product_id)
);

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  unique (user_id, product_id)
);

-- Auto-create profile on signup
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Helper used by RLS
create function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Block role changes from anyone except service role / SQL editor
create function protect_role() returns trigger language plpgsql as $$
begin
  if new.role <> old.role and auth.uid() is not null and auth.role() <> 'service_role' then
    raise exception 'role can only be changed by the service role';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on profiles
  for each row execute function protect_role();

-- Atomic payment fulfilment: stock decrement + mark paid + clear cart
create function fulfill_order(p_order_id uuid, p_payment_intent text) returns void
language plpgsql security definer set search_path = public as $$
declare r record; o orders%rowtype;
begin
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if o.payment_status = 'paid' then return; end if;  -- idempotent for webhook retries
  for r in select product_id, quantity from order_items where order_id = p_order_id loop
    update products set stock_quantity = stock_quantity - r.quantity
      where id = r.product_id and stock_quantity >= r.quantity;
    if not found then raise exception 'insufficient stock for %', r.product_id; end if;
  end loop;
  update orders set payment_status = 'paid', order_status = 'processing',
    stripe_payment_intent_id = p_payment_intent where id = p_order_id;
  delete from cart_items where user_id = o.user_id;
end $$;
revoke all on function fulfill_order(uuid, text) from public, anon, authenticated;

-- Row Level Security
alter table profiles enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table cart_items enable row level security;
alter table wishlist_items enable row level security;

create policy "own profile read" on profiles for select using (id = auth.uid() or is_admin());
create policy "own profile update" on profiles for update using (id = auth.uid());

create policy "products public read" on products for select using (true);
create policy "products admin write" on products for all using (is_admin()) with check (is_admin());

-- Orders are created only by the backend (service role bypasses RLS)
create policy "own orders read" on orders for select using (user_id = auth.uid() or is_admin());
create policy "own order items read" on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin())));

create policy "own cart" on cart_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own wishlist" on wishlist_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Product images bucket (public read, admin write)
insert into storage.buckets (id, name, public) values ('product-images','product-images', true)
  on conflict do nothing;
create policy "images public read" on storage.objects for select using (bucket_id = 'product-images');
create policy "images admin write" on storage.objects for all
  using (bucket_id = 'product-images' and is_admin()) with check (bucket_id = 'product-images' and is_admin());
