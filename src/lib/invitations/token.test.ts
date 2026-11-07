import { describe, expect, it, vi } from 'vitest';

// The server-only marker throws outside a React Server environment; stub it like Next does.
vi.mock('server-only', () => ({}));

import { generateInvitationToken, isValidInvitationToken } from './token';

describe('generateInvitationToken', () => {
  it('produces a 43-char base64url token (256-bit entropy)', () => {
    const token = generateInvitationToken();
    expect(token).toHaveLength(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('passes the get_invitation RPC shape check', () => {
    expect(isValidInvitationToken(generateInvitationToken())).toBe(true);
  });

  it('produces unique tokens across calls', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateInvitationToken()));
    expect(tokens.size).toBe(200);
  });

  it('never contains base64 padding or non-url-safe characters', () => {
    for (let i = 0; i < 50; i++) {
      const token = generateInvitationToken();
      expect(token).not.toMatch(/[+/=]/);
    }
  });
});

describe('isValidInvitationToken', () => {
  it('rejects empty, short and over-long tokens', () => {
    expect(isValidInvitationToken('')).toBe(false);
    expect(isValidInvitationToken('abc')).toBe(false);
    expect(isValidInvitationToken('a'.repeat(15))).toBe(false);
    expect(isValidInvitationToken('a'.repeat(129))).toBe(false);
  });

  it('rejects tokens with illegal characters (probing / injection)', () => {
    expect(isValidInvitationToken('a'.repeat(20) + '!')).toBe(false);
    expect(isValidInvitationToken("a' OR '1'='1")).toBe(false);
    expect(isValidInvitationToken('../etc/passwd')).toBe(false);
    expect(isValidInvitationToken('a'.repeat(20) + ' ')).toBe(false);
  });

  it('accepts well-formed url-safe tokens of valid length', () => {
    expect(isValidInvitationToken('a'.repeat(16))).toBe(true);
    expect(isValidInvitationToken('a'.repeat(128))).toBe(true);
    expect(isValidInvitationToken('Ab_-09' + 'x'.repeat(40))).toBe(true);
  });
});