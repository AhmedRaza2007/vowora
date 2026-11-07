-- 0003_identity.sql
-- Profiles (1:1 with auth.users), configurable platform settings, and admin audit log.

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '',
  avatar_url    text,
  platform_role platform_role not null default 'customer',
  phone         text,
  locale        text not null default 'en',
  country       text,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'Application profile per auth user; platform role governs admin/vendor access.';

-- Configurable branding + platform configuration (key/value). Non-secret keys are public-read.
create table if not exists public.platform_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.platform_settings is 'Runtime branding/config so the brand can change without code changes.';

-- Admin audit trail. Writes happen via privileged server code only.
create table if not exists public.admin_activity_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb not null default '{}',
  ip_address  inet,
  created_at  timestamptz not null default now()
);

create index if not exists admin_activity_logs_actor_idx on public.admin_activity_logs (actor_id, created_at desc);
create index if not exists admin_activity_logs_entity_idx on public.admin_activity_logs (entity_type, entity_id);