-- 0012_events_guests.sql
-- Phase 4: events (ceremonies), guest groups, guests, the guest_events authorization
-- junction, and secure invitation capability tokens. RLS is default-deny; guests/anon
-- never read these tables directly — personalized access is only via get_invitation (0013).

-- Domain enums --------------------------------------------------------------------
do $$ begin
  create type guest_category as enum ('family','friend','colleague','vip','relative','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type invitation_status as enum ('active','revoked','expired');
exception when duplicate_object then null; end $$;

-- Events (ceremonies) -------------------------------------------------------------
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  wedding_id      uuid not null references public.weddings (id) on delete cascade,
  name            text not null,
  event_type      text not null default 'custom',
  description     text,
  event_date      date not null,
  start_time      time,
  end_time        time,
  timezone        text not null default 'UTC',
  venue_name      text,
  venue_id        uuid,                       -- FK to venues added in Phase 7 (discovery)
  address         text,
  maps_url        text,
  lat             double precision,
  lng             double precision,
  cover_image_url text,
  dress_code      text,
  instructions    text,
  artwork_config  jsonb not null default '{}',
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists events_wedding_date_idx on public.events (wedding_id, event_date);

-- Guest groups (families/parties) --------------------------------------------------
create table if not exists public.guest_groups (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid not null references public.weddings (id) on delete cascade,
  name          text not null,
  notes         text,
  max_attendees int not null default 1 check (max_attendees > 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists guest_groups_wedding_idx on public.guest_groups (wedding_id);

-- Guests --------------------------------------------------------------------------
create table if not exists public.guests (
  id                  uuid primary key default gen_random_uuid(),
  wedding_id          uuid not null references public.weddings (id) on delete cascade,
  group_id            uuid references public.guest_groups (id) on delete set null,
  name                text not null,
  email               text,
  phone               text,
  category            guest_category not null default 'other',
  max_attendees       int not null default 1 check (max_attendees > 0),
  notes               text,
  dietary_preferences text,
  is_vip              boolean not null default false,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists guests_wedding_idx on public.guests (wedding_id);
create index if not exists guests_group_idx on public.guests (group_id);
create index if not exists guests_wedding_name_idx on public.guests (wedding_id, name);

-- guest_events: exactly which events a guest may see/RSVP --------------------------
create table if not exists public.guest_events (
  id                uuid primary key default gen_random_uuid(),
  guest_id          uuid not null references public.guests (id) on delete cascade,
  event_id          uuid not null references public.events (id) on delete cascade,
  wedding_id        uuid not null references public.weddings (id) on delete cascade,
  allowed_attendees int check (allowed_attendees > 0),
  created_at        timestamptz not null default now(),
  unique (guest_id, event_id)
);
create index if not exists guest_events_event_idx on public.guest_events (event_id);
create index if not exists guest_events_guest_idx on public.guest_events (guest_id);
create index if not exists guest_events_wedding_idx on public.guest_events (wedding_id);

-- invitations: secure capability tokens -------------------------------------------
create table if not exists public.invitations (
  id             uuid primary key default gen_random_uuid(),
  wedding_id     uuid not null references public.weddings (id) on delete cascade,
  guest_id       uuid not null references public.guests (id) on delete cascade,
  token          text unique not null,
  status         invitation_status not null default 'active',
  expires_at     timestamptz,
  max_uses       int check (max_uses > 0),
  use_count      int not null default 0,
  delivered_via  text,
  delivered_at   timestamptz,
  last_opened_at timestamptz,
  revoked_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists invitations_guest_idx on public.invitations (guest_id);
create index if not exists invitations_wedding_status_idx on public.invitations (wedding_id, status);

-- updated_at triggers -------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['events','guest_groups','guests','invitations'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Resolve a wedding's plan feature limit (active/trialing subscription, else free). --
create or replace function public.feature_limit(w uuid, feature text) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select pfl.limit_value
       from public.weddings wd
       join public.subscriptions s on s.id = wd.subscription_id and s.status in ('active','trialing')
       join public.plan_feature_limits pfl on pfl.plan_id = s.plan_id and pfl.feature_key = feature
      where wd.id = w),
    (select pfl.limit_value
       from public.subscription_plans sp
       join public.plan_feature_limits pfl on pfl.plan_id = sp.id and pfl.feature_key = feature
      where sp.key = 'free')
  );
$$;

-- Server-side guest/event limit enforcement (defense in depth; actions also check). --
create or replace function public.enforce_guest_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare lim text; cnt int;
begin
  lim := public.feature_limit(new.wedding_id, 'max_guests');
  if lim ~ '^[0-9]+$' then
    select count(*) into cnt from public.guests
      where wedding_id = new.wedding_id and deleted_at is null;
    if cnt >= lim::int then
      raise exception 'guest limit reached' using errcode = '42501';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists enforce_guest_limit on public.guests;
create trigger enforce_guest_limit before insert on public.guests
  for each row execute function public.enforce_guest_limit();

create or replace function public.enforce_event_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare lim text; cnt int;
begin
  lim := public.feature_limit(new.wedding_id, 'max_events');
  if lim ~ '^[0-9]+$' then
    select count(*) into cnt from public.events where wedding_id = new.wedding_id;
    if cnt >= lim::int then
      raise exception 'event limit reached' using errcode = '42501';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists enforce_event_limit on public.events;
create trigger enforce_event_limit before insert on public.events
  for each row execute function public.enforce_event_limit();

-- Keep guest_events consistent: guest, event and row must share one wedding. --------
create or replace function public.validate_guest_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare gw uuid; ew uuid;
begin
  select wedding_id into gw from public.guests where id = new.guest_id;
  select wedding_id into ew from public.events where id = new.event_id;
  if gw is null or ew is null or gw <> ew or new.wedding_id <> gw then
    raise exception 'guest/event wedding mismatch' using errcode = '42501';
  end if;
  return new;
end; $$;

drop trigger if exists validate_guest_event on public.guest_events;
create trigger validate_guest_event before insert or update on public.guest_events
  for each row execute function public.validate_guest_event();

-- Row Level Security --------------------------------------------------------------
alter table public.events enable row level security;
drop policy if exists events_select on public.events;
create policy events_select on public.events for select
  using (public.is_wedding_member(wedding_id) or public.is_platform_admin());
drop policy if exists events_write on public.events;
create policy events_write on public.events for all
  using (public.wedding_permission(wedding_id, 'manage_events') or public.is_platform_admin())
  with check (public.wedding_permission(wedding_id, 'manage_events') or public.is_platform_admin());

alter table public.guest_groups enable row level security;
drop policy if exists guest_groups_select on public.guest_groups;
create policy guest_groups_select on public.guest_groups for select
  using (public.is_wedding_member(wedding_id) or public.is_platform_admin());
drop policy if exists guest_groups_write on public.guest_groups;
create policy guest_groups_write on public.guest_groups for all
  using (public.wedding_permission(wedding_id, 'manage_guests') or public.is_platform_admin())
  with check (public.wedding_permission(wedding_id, 'manage_guests') or public.is_platform_admin());

alter table public.guests enable row level security;
drop policy if exists guests_select on public.guests;
create policy guests_select on public.guests for select
  using (public.is_wedding_member(wedding_id) or public.is_platform_admin());
drop policy if exists guests_write on public.guests;
create policy guests_write on public.guests for all
  using (public.wedding_permission(wedding_id, 'manage_guests') or public.is_platform_admin())
  with check (public.wedding_permission(wedding_id, 'manage_guests') or public.is_platform_admin());

alter table public.guest_events enable row level security;
drop policy if exists guest_events_select on public.guest_events;
create policy guest_events_select on public.guest_events for select
  using (public.is_wedding_member(wedding_id) or public.is_platform_admin());
drop policy if exists guest_events_write on public.guest_events;
create policy guest_events_write on public.guest_events for all
  using (public.wedding_permission(wedding_id, 'manage_guests') or public.is_platform_admin())
  with check (public.wedding_permission(wedding_id, 'manage_guests') or public.is_platform_admin());

alter table public.invitations enable row level security;
drop policy if exists invitations_select on public.invitations;
create policy invitations_select on public.invitations for select
  using (public.is_wedding_member(wedding_id) or public.is_platform_admin());
drop policy if exists invitations_write on public.invitations;
create policy invitations_write on public.invitations for all
  using (public.wedding_permission(wedding_id, 'manage_invitations') or public.is_platform_admin())
  with check (public.wedding_permission(wedding_id, 'manage_invitations') or public.is_platform_admin());
-- anon has no policy on any of these tables: direct reads/writes are denied.

comment on table public.invitations is 'Secure per-guest capability tokens; anon access only via get_invitation RPC.';