'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { appUrl } from '@/lib/env';
import { generateInvitationToken } from '@/lib/invitations/token';
import { sendEmail } from '@/lib/email';
import { buildInvitationEmail } from '@/features/invitations/email-template';
import {
  issueInvitationSchema,
  expiryToTimestamp,
  effectiveInvitationStatus,
  deliveryChannels,
} from '@/lib/validations/invitation-delivery';
import type { Guest, Invitation, Wedding } from '@/types/database';

export type InvitationResult = { error: string | null };
export type IssueResult = { error: string | null; token: string | null };
export type SendEmailResult = { error: string | null };

type Client = Awaited<ReturnType<typeof createClient>>;

const idSchema = z.string().uuid();

function readId(formData: FormData, key: string): string | null {
  const parsed = idSchema.safeParse(formData.get(key));
  return parsed.success ? parsed.data : null;
}

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function revalidate(weddingId: string) {
  revalidatePath(`/dashboard/weddings/${weddingId}`, 'layout');
  revalidatePath('/i/[token]', 'page');
}

/** Absolute, origin-safe invitation URL for a token. */
function invitationUrl(token: string): string {
  const base = appUrl.replace(/\/+$/, '');
  return `${base}/i/${token}`;
}

async function getActiveInvitation(
  supabase: Client,
  weddingId: string,
  guestId: string,
): Promise<Invitation | null> {
  const { data } = await supabase
    .from('invitations')
    .select('*')
    .eq('wedding_id', weddingId)
    .eq('guest_id', guestId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  const rows = (data ?? []) as Invitation[];
  return rows.find((i) => effectiveInvitationStatus(i) === 'active') ?? null;
}

/**
 * Issue (or reuse) a secure invitation for a guest. Idempotent: an existing active token is
 * returned unchanged so re-opening the share dialog never mints duplicates. `regenerate`
 * revokes the current active token first and mints a fresh capability (e.g. after a leak).
 */
export async function issueInvitationAction(_: unknown, formData: FormData): Promise<IssueResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const guestId = readId(formData, 'guestId');
  if (!weddingId || !guestId) return { error: 'errors.generic', token: null };
  const regenerate = formData.get('regenerate') === 'true';

  const parsed = issueInvitationSchema.safeParse({
    expiresAt: text(formData, 'expiresAt'),
    maxUses: formData.get('maxUses') ? Number(formData.get('maxUses')) : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.generic', token: null };

  const supabase = await createClient();

  const { data: guest } = await supabase
    .from('guests')
    .select('id')
    .eq('id', guestId)
    .eq('wedding_id', weddingId)
    .is('deleted_at', null)
    .maybeSingle();
  if (!guest) return { error: 'errors.generic', token: null };

  const existing = await getActiveInvitation(supabase, weddingId, guestId);
  if (existing && !regenerate) return { error: null, token: existing.token };

  if (existing && regenerate) {
    const { error: revokeError } = await supabase
      .from('invitations')
      .update({ status: 'revoked', revoked_at: new Date().toISOString() })
      .eq('id', existing.id)
      .eq('wedding_id', weddingId);
    if (revokeError) return { error: 'errors.generic', token: null };
  }

  const token = generateInvitationToken();
  const { error } = await supabase.from('invitations').insert({
    wedding_id: weddingId,
    guest_id: guestId,
    token,
    status: 'active',
    expires_at: expiryToTimestamp(parsed.data.expiresAt),
    max_uses: parsed.data.maxUses ?? null,
  });
  if (error) return { error: 'errors.generic', token: null };

  revalidate(weddingId);
  return { error: null, token };
}

/** Revoke a token: it immediately stops resolving via get_invitation (generic 404). */
export async function revokeInvitationAction(_: unknown, formData: FormData): Promise<InvitationResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const invitationId = readId(formData, 'invitationId');
  if (!weddingId || !invitationId) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('wedding_id', weddingId)
    .eq('status', 'active');
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

/** Record that the host delivered a token via a channel (WhatsApp/copy/QR/email). */
export async function markDeliveredAction(_: unknown, formData: FormData): Promise<InvitationResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const invitationId = readId(formData, 'invitationId');
  const channel = text(formData, 'channel');
  if (!weddingId || !invitationId || !channel) return { error: 'errors.generic' };
  if (!(deliveryChannels as readonly string[]).includes(channel)) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('invitations')
    .update({ delivered_via: channel, delivered_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('wedding_id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

/**
 * Email a secure invitation via Resend. Honest PENDING when email is unconfigured; only
 * sends to the invited guest's own stored address. Marks delivered on success.
 */
export async function sendInvitationEmailAction(_: unknown, formData: FormData): Promise<SendEmailResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const invitationId = readId(formData, 'invitationId');
  if (!weddingId || !invitationId) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('wedding_id', weddingId)
    .maybeSingle();
  const inv = invitation as Invitation | null;
  if (!inv || effectiveInvitationStatus(inv) !== 'active') return { error: 'errors.generic' };

  const { data: guestData } = await supabase
    .from('guests')
    .select('*')
    .eq('id', inv.guest_id)
    .eq('wedding_id', weddingId)
    .is('deleted_at', null)
    .maybeSingle();
  const guest = guestData as Guest | null;
  if (!guest?.email) return { error: 'errors.noGuestEmail' };

  const { data: weddingData } = await supabase
    .from('weddings')
    .select('*')
    .eq('id', weddingId)
    .maybeSingle();
  const wedding = weddingData as Wedding | null;
  if (!wedding) return { error: 'errors.generic' };

  const url = invitationUrl(inv.token);
  const email = buildInvitationEmail({
    guestName: guest.name,
    coupleOne: wedding.partner_one_name,
    coupleTwo: wedding.partner_two_name,
    date: wedding.wedding_date,
    url,
  });

  const result = await sendEmail({ to: guest.email, subject: email.subject, html: email.html, text: email.text });
  if (!result.ok) return { error: result.reason === 'pending' ? 'errors.emailNotConfigured' : 'errors.generic' };

  const { error } = await supabase
    .from('invitations')
    .update({ delivered_via: 'email', delivered_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('wedding_id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}