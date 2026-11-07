-- 0005_billing_config.sql
-- Subscription plans + feature limits (admin-configurable), subscriptions, payments,
-- invoices and custom design orders. Payment status is only ever written by verified
-- server/webhook logic — never trusted from the browser.

create table if not exists public.subscription_plans (
  id            uuid primary key default gen_random_uuid(),
  key           text unique not null,
  name          text not null,
  description   text,
  tier          int not null,
  price_monthly numeric(12,2),
  price_yearly  numeric(12,2),
  currency      text not null default 'USD',
  is_active     boolean not null default true,
  is_custom     boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.subscription_plans is 'Pricing tiers; editable from admin. No hardcoded market prices.';

create table if not exists public.plan_feature_limits (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.subscription_plans (id) on delete cascade,
  feature_key text not null,
  limit_value text not null,
  unique (plan_id, feature_key)
);

create index if not exists plan_feature_limits_plan_idx on public.plan_feature_limits (plan_id);

comment on table public.plan_feature_limits is 'Server-enforced per-plan limits (max_guests, premium_themes, etc.).';

create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles (id) on delete cascade,
  plan_id                  uuid not null references public.subscription_plans (id) on delete restrict,
  status                   subscription_status not null default 'active',
  provider                 text,
  provider_subscription_id text unique,
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  canceled_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

-- Now that subscriptions exists, link weddings.subscription_id.
do $$ begin
  alter table public.weddings
    add constraint weddings_subscription_fk
    foreign key (subscription_id) references public.subscriptions (id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  subscription_id     uuid references public.subscriptions (id) on delete set null,
  amount              numeric(12,2) not null,
  currency            text not null,
  status              payment_status not null default 'pending',
  provider            text not null,
  provider_payment_id text unique,
  idempotency_key     text unique,
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists payments_user_idx on public.payments (user_id);

create table if not exists public.invoices (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  number     text unique not null,
  amount     numeric(12,2) not null,
  currency   text not null,
  status     text not null default 'paid',
  pdf_url    text,
  issued_at  timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists invoices_user_idx on public.invoices (user_id);

create table if not exists public.custom_orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  wedding_id    uuid references public.weddings (id) on delete set null,
  brief         text not null,
  requirements  jsonb not null default '{}',
  budget        numeric(12,2),
  currency      text,
  status        order_status not null default 'requested',
  assigned_to   uuid references public.profiles (id) on delete set null,
  quote_amount  numeric(12,2),
  delivered_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists custom_orders_user_idx on public.custom_orders (user_id);
create index if not exists custom_orders_status_idx on public.custom_orders (status);