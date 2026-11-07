import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import { isValidInvitationToken } from '@/lib/invitations/token';
import type { PublishedInvitation } from '@/features/weddings/public-queries';

/**
 * Resolve a personalized, unguessable invitation token to its published wedding plus the
 * invited guest's authorized slice. Backed by the `get_invitation` SECURITY DEFINER RPC,
 * which returns NULL for any invalid/revoked/expired/exhausted token or unpublished wedding
 * (generic failure — no enumeration). The token shape is validated first to reject trivial
 * probing. `cache` memoizes per request so the RPC's open-count increment happens once even
 * if metadata and the page both resolve the same token.
 */
export const getInvitationByToken = cache(async (token: string): Promise<PublishedInvitation | null> => {
  if (!isSupabaseConfigured()) return null;
  if (!isValidInvitationToken(token)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_invitation', { p_token: token });
  if (error || !data) return null;
  return data as unknown as PublishedInvitation;
});