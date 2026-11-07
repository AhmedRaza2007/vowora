import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Invitation } from '@/types/database';

/**
 * All invitation tokens for a wedding, newest first. RLS scopes rows to wedding members;
 * tokens are capability credentials, so they are only ever read in the authenticated
 * dashboard — never exposed on public routes or to other guests.
 */
export async function getInvitations(weddingId: string): Promise<Invitation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Invitation[];
}