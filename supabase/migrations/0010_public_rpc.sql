-- 0010_public_rpc.sql
-- Public read access to PUBLISHED wedding websites via a SECURITY DEFINER RPC.
-- Anon/authenticated never read the weddings table directly (RLS denies); this function
-- returns only public-facing fields and returns NULL for unpublished/missing/deleted slugs
-- (generic failure — no enumeration of draft weddings). Events are added in Phase 4.

create or replace function public.get_published_wedding(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.weddings;
  result jsonb;
begin
  select * into w
  from weddings
  where slug = p_slug
    and status = 'published'
    and deleted_at is null;

  if not found then
    return null;
  end if;

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
    'theme', (select to_jsonb(t) from wedding_themes t where t.id = w.theme_id),
    'sections', (
      select coalesce(jsonb_agg(to_jsonb(s) order by s.sort_order), '[]'::jsonb)
      from wedding_sections s
      where s.wedding_id = w.id and s.is_enabled
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_published_wedding(text) from public;
grant execute on function public.get_published_wedding(text) to anon, authenticated;

comment on function public.get_published_wedding(text) is
  'Public published wedding website (public fields only). Returns NULL if not published.';