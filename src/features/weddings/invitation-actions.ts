'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { invitationConfigSchema, updateCoupleSchema } from '@/lib/validations/invitation';

export type InvitationResult = { error: string | null };

const idSchema = z.string().uuid();

function readId(formData: FormData, key: string): string | null {
  const parsed = idSchema.safeParse(formData.get(key));
  return parsed.success ? parsed.data : null;
}

function revalidate(weddingId: string) {
  revalidatePath(`/dashboard/weddings/${weddingId}`, 'layout');
  revalidatePath('/w/[slug]', 'page');
  revalidatePath('/i/[token]', 'page');
}

/** Persist per-wedding invitation customization. RLS scopes the update to members. */
export async function updateInvitationAction(_: unknown, formData: FormData): Promise<InvitationResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  if (!weddingId) return { error: 'errors.generic' };

  const parsed = invitationConfigSchema.safeParse({
    primaryColor: formData.get('primaryColor') || undefined,
    accentColor: formData.get('accentColor') || undefined,
    backgroundColor: formData.get('backgroundColor') || undefined,
    textColor: formData.get('textColor') || undefined,
    envelopeColor: formData.get('envelopeColor') || undefined,
    envelopeLiner: formData.get('envelopeLiner') || undefined,
    headingFont: formData.get('headingFont') || undefined,
    bodyFont: formData.get('bodyFont') || undefined,
    waxSeal: formData.get('waxSeal') || undefined,
    cardBorder: formData.get('cardBorder') || undefined,
    animation: formData.get('animation') || undefined,
    introMessage: formData.get('introMessage') || undefined,
    musicUrl: formData.get('musicUrl') || undefined,
  });
  if (!parsed.success) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('weddings')
    .update({ invitation_config: parsed.data })
    .eq('id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

/** Assign an active invitation theme. Plan-tier gating arrives with subscriptions (Phase 6). */
export async function selectThemeAction(_: unknown, formData: FormData): Promise<InvitationResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const themeId = readId(formData, 'themeId');
  if (!weddingId || !themeId) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { data: theme } = await supabase
    .from('wedding_themes')
    .select('id')
    .eq('id', themeId)
    .eq('is_active', true)
    .single();
  if (!theme) return { error: 'errors.generic' };

  const { error } = await supabase.from('weddings').update({ theme_id: themeId }).eq('id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

/** Update the couple names + monogram shown on the envelope and card. */
export async function updateCoupleAction(_: unknown, formData: FormData): Promise<InvitationResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  if (!weddingId) return { error: 'errors.generic' };

  const parsed = updateCoupleSchema.safeParse({
    partnerOneName: formData.get('partnerOneName'),
    partnerTwoName: formData.get('partnerTwoName'),
    coupleInitials: formData.get('coupleInitials') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('weddings')
    .update({
      partner_one_name: parsed.data.partnerOneName,
      partner_two_name: parsed.data.partnerTwoName,
      couple_initials: parsed.data.coupleInitials ?? null,
    })
    .eq('id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}