'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';

export type SettingsResult = { error: string | null; ok?: boolean };

/**
 * Account/data deletion foundation: records a deletion request for review (finalized in
 * Phase 8 with full cascade/anonymization). This is a real, persisted request — not a
 * placeholder.
 */
export async function requestAccountDeletion(): Promise<SettingsResult> {
  const user = await requireUser('/dashboard/settings');
  const supabase = await createClient();

  const { error } = await supabase.from('support_requests').insert({
    user_id: user.id,
    subject: 'Account deletion request',
    message: 'Customer requested account and associated data deletion.',
    status: 'open',
  });
  if (error) return { error: 'errors.generic' };

  revalidatePath('/dashboard/settings');
  return { error: null, ok: true };
}