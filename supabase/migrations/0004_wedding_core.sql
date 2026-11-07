-- 0004_wedding_core.sql
-- Wedding aggregate root, membership, design configuration (templates/themes),
-- website sections, media assets, notifications and support requests.
-- Public/guest access to wedding data is only ever via SECURITY DEFINER RPCs (0007/0008),
-- never via anon table policies.

-- Configuration: website templates -------------------------------------------------
create table if not exists public.templates (
  id                uuid primary key default gen_random_uuid(),
  key               text unique not null,
  name              text not null,
  description       text,
  category          text,
  preview_image_url text,
  default_config    jsonb not null default '{}',
  min_plan_tier     text not null default 'free',
  is_active         boolean not null default true,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.templates is 'Admin-configurable website templates; public reads active rows.';

-- Configuration: cinematic invitation themes (10 designs) -------------------------
create table if not exists public.wedding_themes (
  id                uuid primary key default gen_random_uuid(),
  key               text unique not null,
  name              text not null,
  palette           jsonb not null,
  typography        jsonb not null,
  envelope_config   jsonb not null,
  card_config       jsonb not null,
  decor_elements    jsonb not null default '[]',
  animation_variant text not null,
  background_url    text,
  wax_seal_styles   jsonb not null default '[]',
  min_plan_tier     text not null default 'free',
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.wedding_themes is 'Invitation design themes: palette, typography, envelope/card, animation, wax seal.';

-- Wedding aggregate root ----------------------------------------------------------
create table if not exists public.weddings (
  id               uuid primary key default gen_random_uuid(),
  created_by       uuid not null references public.profiles (id) on delete restrict,
  slug             text unique not null,
  title            text not null,
  partner_one_name text not null,
  partner_two_name text not null,
  couple_initials  text,
  wedding_date     date,
  timezone         text not null default 'UTC',
  currency         text not null default 'USD',
  locale           text not null default 'en',
  status           wedding_status not null default 'draft',
  template_id      uuid references public.templates (id) on delete set null,
  theme_id         uuid references public.wedding_themes (id) on delete set null,
  design_config    jsonb not null default '{}',
  seo_config       jsonb not null default '{}',
  custom_domain    text unique,
  subscription_id  uuid,
  published_at     timestamptz,
  deleted_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.weddings is 'A wedding project; slug is the public URL. subscription_id FK added in 0005.';

create index if not exists weddings_created_by_idx on public.weddings (created_by);
create index if not exists weddings_status_idx on public.weddings (status);

-- Wedding membership / collaboration ----------------------------------------------
create table if not exists public.wedding_members (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        wedding_role not null default 'viewer',
  permissions text[] not null default '{}',
  invited_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (wedding_id, user_id)
);

create index if not exists wedding_members_user_idx on public.wedding_members (user_id);
create index if not exists wedding_members_wedding_idx on public.wedding_members (wedding_id);

comment on table public.wedding_members is 'Per-wedding roles + fine-grained permission overrides; RLS anchor.';

-- Website sections (builder) ------------------------------------------------------
create table if not exists public.wedding_sections (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  type       section_type not null,
  title      text,
  content    jsonb not null default '{}',
  is_enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wedding_sections_order_idx on public.wedding_sections (wedding_id, sort_order);

-- Media assets (storage metadata) -------------------------------------------------
create table if not exists public.media_assets (
  id                uuid primary key default gen_random_uuid(),
  wedding_id        uuid references public.weddings (id) on delete cascade,
  uploaded_by       uuid references public.profiles (id) on delete set null,
  bucket            text not null,
  path              text not null,
  kind              media_kind not null,
  mime_type         text not null,
  size_bytes        bigint not null,
  width             int,
  height            int,
  alt_text          text,
  moderation_status moderation_status not null default 'approved',
  visibility        visibility not null default 'private',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (bucket, path)
);

create index if not exists media_assets_wedding_idx on public.media_assets (wedding_id);
create index if not exists media_assets_moderation_idx on public.media_assets (moderation_status);

-- Notifications -------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete cascade,
  wedding_id uuid references public.weddings (id) on delete cascade,
  kind       notification_kind not null default 'system',
  title      text not null,
  body       text,
  data       jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, read_at, created_at desc);

-- Support requests ----------------------------------------------------------------
create table if not exists public.support_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  wedding_id  uuid references public.weddings (id) on delete set null,
  subject     text not null,
  message     text not null,
  status      text not null default 'open' check (status in ('open','in_progress','resolved')),
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists support_requests_user_idx on public.support_requests (user_id);
create index if not exists support_requests_status_idx on public.support_requests (status);