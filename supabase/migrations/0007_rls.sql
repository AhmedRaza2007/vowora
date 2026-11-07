-- 0007_rls.sql
-- Row Level Security for the Phase 1 foundation. Default deny on every table.
-- Guests/anon NEVER read wedding/guest tables directly — only via SECURITY DEFINER RPCs.
-- Service-role (server-only) bypasses RLS for trusted writes (triggers, webhooks, audit).

-- Helper: support staff (support + admins) ----------------------------------------
create or replace function public.is_support_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and platform_role in ('support','admin','super_admin')
  );
$$;

-- profiles ------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_platform_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_platform_admin())
  with check (id = auth.uid() or public.is_platform_admin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete
  using (public.is_platform_admin());
-- INSERT is performed only by the handle_new_user trigger (SECURITY DEFINER).

-- Prevent self-service privilege escalation. Supabase grants table-level UPDATE to
-- authenticated, so a column-level REVOKE is ineffective; a BEFORE UPDATE guard is
-- required. SECURITY INVOKER keeps current_user = the acting role. Only privileged
-- server roles or an existing platform admin may change platform_role.
create or replace function public.guard_profile_role() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.platform_role is distinct from old.platform_role then
    if current_user in ('service_role','supabase_admin','postgres') or public.is_platform_admin() then
      return new;
    end if;
    raise exception 'cannot change platform_role' using errcode = '42501';
  end if;
  return new;
end; $$;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- platform_settings ---------------------------------------------------------------
alter table public.platform_settings enable row level security;

drop policy if exists platform_settings_select on public.platform_settings;
create policy platform_settings_select on public.platform_settings for select
  using (key !~ '^secret_' or public.is_platform_admin());

drop policy if exists platform_settings_write on public.platform_settings;
create policy platform_settings_write on public.platform_settings for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- admin_activity_logs -------------------------------------------------------------
alter table public.admin_activity_logs enable row level security;

drop policy if exists admin_activity_logs_select on public.admin_activity_logs;
create policy admin_activity_logs_select on public.admin_activity_logs for select
  using (public.is_platform_admin());
-- INSERT only via service role / privileged server code (no policy = deny to clients).

-- notifications -------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete
  using (user_id = auth.uid());
-- INSERT server-side only.

-- support_requests ----------------------------------------------------------------
alter table public.support_requests enable row level security;

drop policy if exists support_requests_select on public.support_requests;
create policy support_requests_select on public.support_requests for select
  using (user_id = auth.uid() or public.is_support_staff());

drop policy if exists support_requests_insert on public.support_requests;
create policy support_requests_insert on public.support_requests for insert
  with check (user_id = auth.uid());

drop policy if exists support_requests_update on public.support_requests;
create policy support_requests_update on public.support_requests for update
  using (public.is_support_staff())
  with check (public.is_support_staff());

drop policy if exists support_requests_delete on public.support_requests;
create policy support_requests_delete on public.support_requests for delete
  using (public.is_platform_admin());

-- weddings ------------------------------------------------------------------------
alter table public.weddings enable row level security;

drop policy if exists weddings_select on public.weddings;
create policy weddings_select on public.weddings for select
  using (public.is_wedding_member(id) or public.is_platform_admin());

drop policy if exists weddings_insert on public.weddings;
create policy weddings_insert on public.weddings for insert
  with check (created_by = auth.uid());

drop policy if exists weddings_update on public.weddings;
create policy weddings_update on public.weddings for update
  using (public.wedding_permission(id, 'edit_website') or public.is_platform_admin())
  with check (public.wedding_permission(id, 'edit_website') or public.is_platform_admin());

drop policy if exists weddings_delete on public.weddings;
create policy weddings_delete on public.weddings for delete
  using (public.has_wedding_role(id, array['owner']) or public.is_platform_admin());

-- wedding_members -----------------------------------------------------------------
alter table public.wedding_members enable row level security;

drop policy if exists wedding_members_select on public.wedding_members;
create policy wedding_members_select on public.wedding_members for select
  using (public.is_wedding_member(wedding_id) or public.is_platform_admin());

drop policy if exists wedding_members_write on public.wedding_members;
create policy wedding_members_write on public.wedding_members for all
  using (public.has_wedding_role(wedding_id, array['owner','partner']) or public.is_platform_admin())
  with check (public.has_wedding_role(wedding_id, array['owner','partner']) or public.is_platform_admin());

-- templates -----------------------------------------------------------------------
alter table public.templates enable row level security;

drop policy if exists templates_select on public.templates;
create policy templates_select on public.templates for select
  using (is_active or public.is_platform_admin());

drop policy if exists templates_write on public.templates;
create policy templates_write on public.templates for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- wedding_themes ------------------------------------------------------------------
alter table public.wedding_themes enable row level security;

drop policy if exists wedding_themes_select on public.wedding_themes;
create policy wedding_themes_select on public.wedding_themes for select
  using (is_active or public.is_platform_admin());

drop policy if exists wedding_themes_write on public.wedding_themes;
create policy wedding_themes_write on public.wedding_themes for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- wedding_sections ----------------------------------------------------------------
alter table public.wedding_sections enable row level security;

drop policy if exists wedding_sections_select on public.wedding_sections;
create policy wedding_sections_select on public.wedding_sections for select
  using (public.is_wedding_member(wedding_id) or public.is_platform_admin());

drop policy if exists wedding_sections_write on public.wedding_sections;
create policy wedding_sections_write on public.wedding_sections for all
  using (public.wedding_permission(wedding_id, 'edit_website') or public.is_platform_admin())
  with check (public.wedding_permission(wedding_id, 'edit_website') or public.is_platform_admin());

-- media_assets --------------------------------------------------------------------
alter table public.media_assets enable row level security;

drop policy if exists media_assets_select on public.media_assets;
create policy media_assets_select on public.media_assets for select
  using (public.is_wedding_member(wedding_id) or public.is_platform_admin());

drop policy if exists media_assets_write on public.media_assets;
create policy media_assets_write on public.media_assets for all
  using (public.is_wedding_member(wedding_id) or public.is_platform_admin())
  with check (public.is_wedding_member(wedding_id) or public.is_platform_admin());

-- subscription_plans --------------------------------------------------------------
alter table public.subscription_plans enable row level security;

drop policy if exists subscription_plans_select on public.subscription_plans;
create policy subscription_plans_select on public.subscription_plans for select
  using (is_active or public.is_platform_admin());

drop policy if exists subscription_plans_write on public.subscription_plans;
create policy subscription_plans_write on public.subscription_plans for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- plan_feature_limits -------------------------------------------------------------
alter table public.plan_feature_limits enable row level security;

drop policy if exists plan_feature_limits_select on public.plan_feature_limits;
create policy plan_feature_limits_select on public.plan_feature_limits for select
  using (true);

drop policy if exists plan_feature_limits_write on public.plan_feature_limits;
create policy plan_feature_limits_write on public.plan_feature_limits for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- subscriptions -------------------------------------------------------------------
alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions for select
  using (user_id = auth.uid() or public.is_platform_admin());

drop policy if exists subscriptions_delete on public.subscriptions;
create policy subscriptions_delete on public.subscriptions for delete
  using (public.is_platform_admin());
-- INSERT/UPDATE only via verified webhook / server logic (service role).

-- payments ------------------------------------------------------------------------
alter table public.payments enable row level security;

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select
  using (user_id = auth.uid() or public.is_platform_admin());
-- INSERT/UPDATE server-side only; no client delete.

-- invoices ------------------------------------------------------------------------
alter table public.invoices enable row level security;

drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select
  using (user_id = auth.uid() or public.is_platform_admin());
-- Generated server-side only.

-- custom_orders -------------------------------------------------------------------
alter table public.custom_orders enable row level security;

drop policy if exists custom_orders_select on public.custom_orders;
create policy custom_orders_select on public.custom_orders for select
  using (user_id = auth.uid() or public.is_platform_admin());

drop policy if exists custom_orders_insert on public.custom_orders;
create policy custom_orders_insert on public.custom_orders for insert
  with check (user_id = auth.uid());

drop policy if exists custom_orders_update on public.custom_orders;
create policy custom_orders_update on public.custom_orders for update
  using (public.is_platform_admin() or assigned_to = auth.uid())
  with check (public.is_platform_admin() or assigned_to = auth.uid());

drop policy if exists custom_orders_delete on public.custom_orders;
create policy custom_orders_delete on public.custom_orders for delete
  using (public.is_platform_admin());