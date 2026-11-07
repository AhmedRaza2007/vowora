-- 0013_guest_access.sql
-- Phase 4: public events on the published wedding RPC, and the secure personalized
-- invitation RPC. get_invitation is a capability check: a valid, active, unexpired,
-- non-exhausted token reveals only that guest's name and the events they are authorized
-- for (guest_events). Every failure returns NULL (generic — no enumeration). Tokens are
-- unguessable CSPRNG capabilities, so changing a URL/identifier cannot reveal another guest.

-- Internal helper: public-facing JSON for a published, non-deleted wedding (else NULL). --
create or replace function public.wedding_public_json(wid uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'id', w.id,
    'slug', w.slug,
    'title', w.title,
    'partner_one_name', w.partner_one_name,
    'partner_two_name', w.partner_two_name,
    'couple_initials', w.couple_initials,
    'wedding_date', w.wedding_date,
    'timezone', w.timezone,
    'locale', w.locale,
    'design_config', w.design_config,
    'seo_config', w.seo_config,
    'invitation_config', w.invitation_config,
    'published_at', w.published_at,
    'theme', (select to_jsonb(t) from wedding_themes t where t.id = w.theme_id),
    'sections', (
      select coalesce(jsonb_agg(to_jsonb(s) order by s.sort_order), '[]'::jsonb)
      from wedding_sections s where s.wedding_id = w.id and s.is_enabled
    ),
    'events', (
      select coalesce(jsonb_agg(to_jsonb(e) order by e.event_date, e.sort_order), '[]'::jsonb)
      from events e where e.wedding_id = w.id
    )
  )
  from weddings w
  where w.id = wid and w.status = 'published' and w.deleted_at is null;
$$;

revoke all on function public.wedding_public_json(uuid) from public, anon, authenticated;
grant execute on function public.wedding_public_json(uuid) to service_role;

-- Public wedding website (now includes public events). ------------------------------
create or replace function public.get_published_wedding(p_slug text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select public.wedding_public_json(w.id)
  from weddings w
  where w.slug = p_slug;
$$;

revoke all on function public.get_published_wedding(text) from public;
grant execute on function public.get_published_wedding(text) to anon, authenticated;

comment on function public.get_published_wedding(text) is
  'Public published wedding website (public fields + events). NULL if not published.';

-- Personalized invitation via secure capability token. -----------------------------
create or replace function public.get_invitation(p_token text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  inv public.invitations;
  g public.guests;
  base jsonb;
  ev jsonb;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{16,128}$' then
    return null;
  end if;

  select * into inv
  from invitations
  where token = p_token
    and status = 'active'
    and (expires_at is null or expires_at > now())
    and (max_uses is null or use_count < max_uses);
  if not found then
    return null;
  end if;

  select * into g from guests where id = inv.guest_id and deleted_at is null;
  if not found then
    return null;
  end if;

  base := public.wedding_public_json(inv.wedding_id);
  if base is null then
    return null;                       -- wedding unpublished or deleted
  end if;

  select coalesce(jsonb_agg(
    to_jsonb(e) || jsonb_build_object(
      'allowed_attendees', coalesce(ge.allowed_attendees, g.max_attendees)
    ) order by e.event_date, e.sort_order
  ), '[]'::jsonb)
  into ev
  from guest_events ge
  join events e on e.id = ge.event_id
  where ge.guest_id = g.id and ge.wedding_id = inv.wedding_id;

  update invitations
    set use_count = use_count + 1, last_opened_at = now()
    where id = inv.id;

  return base || jsonb_build_object(
    'guest', jsonb_build_object('name', g.name, 'max_attendees', g.max_attendees),
    'events', ev,
    'invitation', jsonb_build_object('expires_at', inv.expires_at)
  );
end;
$$;

revoke all on function public.get_invitation(text) from public;
grant execute on function public.get_invitation(text) to anon, authenticated;

comment on function public.get_invitation(text) is
  'Secure personalized invitation. NULL for invalid/revoked/expired/exhausted tokens or unpublished weddings.';