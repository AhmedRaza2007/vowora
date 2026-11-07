import { describe, expect, it } from 'vitest';
import {
  issueInvitationSchema,
  effectiveInvitationStatus,
  expiryToTimestamp,
} from './invitation-delivery';

const now = new Date('2026-11-07T12:00:00Z');

describe('issueInvitationSchema', () => {
  it('accepts empty options (no expiry, no cap)', () => {
    const parsed = issueInvitationSchema.safeParse({ expiresAt: null, maxUses: null });
    expect(parsed.success).toBe(true);
  });

  it('accepts a valid expiry date and open cap', () => {
    const parsed = issueInvitationSchema.safeParse({ expiresAt: '2026-12-31', maxUses: 5 });
    expect(parsed.success).toBe(true);
  });

  it('rejects impossible calendar dates', () => {
    expect(issueInvitationSchema.safeParse({ expiresAt: '2026-02-30' }).success).toBe(false);
    expect(issueInvitationSchema.safeParse({ expiresAt: '2026-13-01' }).success).toBe(false);
  });

  it('rejects malformed date strings', () => {
    expect(issueInvitationSchema.safeParse({ expiresAt: '12/31/2026' }).success).toBe(false);
    expect(issueInvitationSchema.safeParse({ expiresAt: 'tomorrow' }).success).toBe(false);
  });

  it('rejects non-positive or non-integer open caps', () => {
    expect(issueInvitationSchema.safeParse({ maxUses: 0 }).success).toBe(false);
    expect(issueInvitationSchema.safeParse({ maxUses: -1 }).success).toBe(false);
    expect(issueInvitationSchema.safeParse({ maxUses: 1.5 }).success).toBe(false);
  });
});

describe('effectiveInvitationStatus', () => {
  const base = { status: 'active', expires_at: null, max_uses: null, use_count: 0 };

  it('reports active for a fresh token', () => {
    expect(effectiveInvitationStatus(base, now)).toBe('active');
  });

  it('reports revoked regardless of other fields', () => {
    expect(effectiveInvitationStatus({ ...base, status: 'revoked' }, now)).toBe('revoked');
  });

  it('reports expired once the expiry has passed', () => {
    expect(effectiveInvitationStatus({ ...base, expires_at: '2026-11-07T11:59:59Z' }, now)).toBe('expired');
  });

  it('stays active up to the expiry instant', () => {
    expect(effectiveInvitationStatus({ ...base, expires_at: '2026-11-07T12:00:01Z' }, now)).toBe('active');
  });

  it('reports exhausted when the open cap is reached', () => {
    expect(effectiveInvitationStatus({ ...base, max_uses: 3, use_count: 3 }, now)).toBe('exhausted');
    expect(effectiveInvitationStatus({ ...base, max_uses: 3, use_count: 2 }, now)).toBe('active');
  });

  it('prefers revoked over expired/exhausted', () => {
    expect(
      effectiveInvitationStatus(
        { status: 'revoked', expires_at: '2020-01-01T00:00:00Z', max_uses: 1, use_count: 5 },
        now,
      ),
    ).toBe('revoked');
  });
});

describe('expiryToTimestamp', () => {
  it('returns null for empty input', () => {
    expect(expiryToTimestamp(null)).toBeNull();
    expect(expiryToTimestamp(undefined)).toBeNull();
    expect(expiryToTimestamp('')).toBeNull();
  });

  it('maps a date to end-of-day UTC', () => {
    expect(expiryToTimestamp('2026-12-31')).toBe('2026-12-31T23:59:59.999Z');
  });
});