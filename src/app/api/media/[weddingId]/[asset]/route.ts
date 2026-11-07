import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ASSET = /^[A-Za-z0-9._-]+$/;
const BUCKET = 'wedding-media';

const notFound = () => new NextResponse(null, { status: 404 });

/**
 * Serves private wedding-media objects without exposing the bucket publicly.
 * Authorized when the requester is a wedding member/admin (builder preview, even while
 * unpublished) OR when the wedding is published (public website). Everything else 404s,
 * so unpublished or foreign wedding media is never leaked by guessing a URL.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ weddingId: string; asset: string }> },
) {
  const { weddingId, asset } = await params;
  if (!isSupabaseConfigured()) return notFound();
  if (!UUID.test(weddingId) || !ASSET.test(asset) || asset.includes('..')) return notFound();

  const path = `${weddingId}/${asset}`;
  const supabase = await createClient();

  // RLS returns the row only for members/admins.
  const { data: memberWedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('id', weddingId)
    .is('deleted_at', null)
    .single();

  let blob: Blob | null = null;

  if (memberWedding) {
    const { data } = await supabase.storage.from(BUCKET).download(path);
    blob = data;
  } else {
    // Public path: only published weddings, read with the server-only admin client.
    try {
      const admin = createAdminClient();
      const { data: published } = await admin
        .from('weddings')
        .select('status')
        .eq('id', weddingId)
        .is('deleted_at', null)
        .single();
      if (published?.status === 'published') {
        const { data } = await admin.storage.from(BUCKET).download(path);
        blob = data;
      }
    } catch {
      // Admin client not configured; public media stays unavailable.
    }
  }

  if (!blob) return notFound();

  return new NextResponse(blob, {
    headers: {
      'Content-Type': blob.type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}