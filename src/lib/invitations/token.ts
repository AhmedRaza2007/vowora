import 'server-only';
import { randomBytes } from 'node:crypto';

/**
 * Generate an unguessable invitation capability token: 32 CSPRNG bytes (256 bits of entropy)
 * encoded as base64url (43 chars, no padding). Matches the `get_invitation` RPC's
 * `^[A-Za-z0-9_-]{16,128}$` shape check. Possession of the token is the only credential a
 * guest needs; changing a URL or identifier cannot reveal another guest's invitation.
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Shape of a token we mint — used to reject trivial probing before hitting the database. */
export const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export function isValidInvitationToken(token: string): boolean {
  return INVITATION_TOKEN_PATTERN.test(token);
}