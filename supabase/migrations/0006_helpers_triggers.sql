-- 0006_helpers_triggers.sql
-- Authorization helpers used inside RLS policies, plus maintenance triggers.
-- All SECURITY DEFINER functions pin search_path = public to prevent hijacking.

create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and platform_role in ('admin','super_admin')
  );
$$;

create or replace function public.is_wedding_member(w uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from wedding_members
    where wedding_id = w and user_id = auth.uid()
  );
$$;

create or replace function public.has_wedding_role(w uuid, roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from wedding_members
    where wedding_id = w and user_id = auth.uid() and role::text = any(roles)
  );
$$;

create or replace function public.wedding_permission(w uuid, perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from wedding_members m
    where m.wedding_id = w and m.user_id = auth.uid()
      and (
        m.role in ('owner','partner')
        or (m.role = 'planner' and perm <> 'delete_wedding')
        or (perm = any (m.permissions))
      )
  );
$$;

-- updated_at maintenance ----------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- Auto-create a profile when an auth user signs up ----------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, platform_role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    'customer'
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-add the creator as the wedding owner ---------------------------------------
create or replace function public.handle_new_wedding() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.wedding_members (wedding_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end; $$;

drop trigger if exists on_wedding_created on public.weddings;
create trigger on_wedding_created
  after insert on public.weddings
  for each row execute function public.handle_new_wedding();

-- Attach updated_at triggers to every table that carries updated_at ----------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','platform_settings','weddings','wedding_members','templates',
    'wedding_themes','wedding_sections','media_assets','support_requests',
    'subscription_plans','subscriptions','payments','custom_orders'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t);
  end loop;
end $$;