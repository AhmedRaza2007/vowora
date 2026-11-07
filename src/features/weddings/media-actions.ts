'use server';

import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/env';
import {
  extensionFor,
  mediaUrl,
  uploadMediaSchema,
  validateMediaFile,
} from '@/lib/validations/media';

export type UploadResult = { error: string | null; url?: string; path?: string };

const BUCKET = 'wedding-media';

/**
 * Upload a wedding website media file (image/video/audio) to the private wedding-media
 * bucket and record it in media_assets. Storage + table RLS enforce wedding membership;
 * we additionally verify access before writing. Returns a stable proxy URL that serves
 * the object only to members or to the public once the wedding is published.
 */
export async function uploadMediaAction(_: unknown, formData: FormData): Promise<UploadResult> {
  const user = await requireUser('/dashboard');

  if (!isSupabaseConfigured()) {
    return { error: 'Media storage is not configured yet. Connect Supabase to enable uploads.' };
  }

  const parsed = uploadMediaSchema.safeParse({
    weddingId: formData.get('weddingId'),
    kind: formData.get('kind'),
  });
  if (!parsed.success) return { error: 'errors.generic' };
  const { weddingId, kind } = parsed.data;

  const file = formData.get('file');
  if (!(file instanceof File)) return { error: 'Please choose a file to upload.' };
  const fileError = validateMediaFile(kind, { type: file.type, size: file.size });
  if (fileError) return { error: fileError };

  const supabase = await createClient();

  // RLS returns the row only for members/admins; null means no access.
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('id', weddingId)
    .is('deleted_at', null)
    .single();
  if (!wedding) return { error: 'You do not have access to this wedding.' };

  const assetId = randomUUID();
  const path = `${weddingId}/${assetId}.${extensionFor(file.type)}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: 'Upload failed. Please try again.' };

  const { error: insertError } = await supabase.from('media_assets').insert({
    id: assetId,
    wedding_id: weddingId,
    uploaded_by: user.id,
    bucket: BUCKET,
    path,
    kind,
    mime_type: file.type,
    size_bytes: file.size,
    visibility: 'public',
    moderation_status: 'approved',
  });
  if (insertError) {
    // Best-effort cleanup so an orphaned object is not left behind.
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: 'Could not save the media record. Please try again.' };
  }

  return { error: null, url: mediaUrl(path), path };
}