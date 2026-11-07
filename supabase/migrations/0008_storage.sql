-- 0008_storage.sql
-- Storage buckets + object policies. Path convention: {wedding_id}/{asset_id}.{ext}
-- (or {user_id}/... for avatars/documents) enables path-prefix authorization.
-- File type/size are validated server-side before issuing signed upload URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true,  10485760, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('wedding-media', 'wedding-media', false, 52428800, array['image/jpeg','image/png','image/webp','video/mp4','audio/mpeg','audio/mp4']),
  ('guest-uploads', 'guest-uploads', false, 20971520, array['image/jpeg','image/png','image/webp','video/mp4']),
  ('avatars',       'avatars',       false, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('documents',     'documents',     false, 20971520, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

-- public-assets: anyone reads; only admins write ----------------------------------
drop policy if exists public_assets_read on storage.objects;
create policy public_assets_read on storage.objects for select
  using (bucket_id = 'public-assets');

drop policy if exists public_assets_write on storage.objects;
create policy public_assets_write on storage.objects for all
  using (bucket_id = 'public-assets' and public.is_platform_admin())
  with check (bucket_id = 'public-assets' and public.is_platform_admin());

-- wedding-media: members of the wedding whose id prefixes the path ----------------
drop policy if exists wedding_media_read on storage.objects;
create policy wedding_media_read on storage.objects for select
  using (
    bucket_id = 'wedding-media'
    and (public.is_wedding_member(((storage.foldername(name))[1])::uuid) or public.is_platform_admin())
  );

drop policy if exists wedding_media_write on storage.objects;
create policy wedding_media_write on storage.objects for all
  using (
    bucket_id = 'wedding-media'
    and (public.wedding_permission(((storage.foldername(name))[1])::uuid, 'edit_website') or public.is_platform_admin())
  )
  with check (
    bucket_id = 'wedding-media'
    and (public.wedding_permission(((storage.foldername(name))[1])::uuid, 'edit_website') or public.is_platform_admin())
  );

-- guest-uploads: members read/moderate; guests insert only via signed upload URL --
drop policy if exists guest_uploads_read on storage.objects;
create policy guest_uploads_read on storage.objects for select
  using (
    bucket_id = 'guest-uploads'
    and (public.is_wedding_member(((storage.foldername(name))[1])::uuid) or public.is_platform_admin())
  );

drop policy if exists guest_uploads_member_write on storage.objects;
create policy guest_uploads_member_write on storage.objects for all
  using (
    bucket_id = 'guest-uploads'
    and (public.wedding_permission(((storage.foldername(name))[1])::uuid, 'manage_guests') or public.is_platform_admin())
  )
  with check (
    bucket_id = 'guest-uploads'
    and (public.wedding_permission(((storage.foldername(name))[1])::uuid, 'manage_guests') or public.is_platform_admin())
  );

-- avatars: owner manages their own {user_id}/ prefix ------------------------------
drop policy if exists avatars_owner on storage.objects;
create policy avatars_owner on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- documents: owner/admin read; writes server-side only ----------------------------
drop policy if exists documents_read on storage.objects;
create policy documents_read on storage.objects for select
  using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_platform_admin())
  );