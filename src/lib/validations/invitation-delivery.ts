import { z } from 'zod';

/** Channels we record when a host marks an invitation delivered. */
export const deliveryChannels = ['whatsapp', 'copy', 'qr', 'email'] as const;
export type DeliveryChannel = (typeof deliveryChannels)[number];

/** Optional expiry (YYYY-MM-DD, stored end-of-day UTC) and optional open cap. */
export const issueInvitationSchema = z.object({
  expiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'errors.generic')
    .refine((s) => {
      const d = new Date(`${s}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
    }, 'errors.generic')
    .nullish(),
  maxUses: z.number().int().min(1).max(100000).nullish(),
});

export type InvitationEffectiveStatus = 'active' | 'revoked' | 'expired' | 'exhausted';

/**
 * Derive the effective status from stored state + clock. Mirrors the get_invitation RPC's
 * validity rules so the dashboard shows exactly what a guest would experience. `now` is
 * injected for deterministic tests.
 */
export function effectiveInvitationStatus(
  invitation: {
    status: string;
    expires_at: string | null;
    max_uses: number | null;
    use_count: number;
  },
  now: Date = new Date(),
): InvitationEffectiveStatus {
  if (invitation.status === 'revoked') return 'revoked';
  if (invitation.expires_at && new Date(invitation.expires_at).getTime() <= now.getTime()) {
    return 'expired';
  }
  if (invitation.max_uses !== null && invitation.use_count >= invitation.max_uses) {
    return 'exhausted';
  }
  return 'active';
}

/** Convert an optional YYYY-MM-DD expiry to an end-of-day UTC ISO timestamp (or null). */
export function expiryToTimestamp(date: string | null | undefined): string | null {
  if (!date) return null;
  return new Date(`${date}T23:59:59.999Z`).toISOString();
}