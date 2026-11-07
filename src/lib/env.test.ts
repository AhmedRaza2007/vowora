import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getIntegrationStatus } from './env';

const KEYS = [
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'PAYMENTS_PROVIDER',
  'STRIPE_SECRET_KEY',
  'AI_PROVIDER',
  'AI_API_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_KEY',
  'NEXT_PUBLIC_POSTHOG_KEY',
];

let snapshot: Record<string, string | undefined>;

beforeEach(() => {
  snapshot = {};
  for (const k of KEYS) {
    snapshot[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of KEYS) {
    if (snapshot[k] === undefined) delete process.env[k];
    else process.env[k] = snapshot[k];
  }
});

describe('getIntegrationStatus', () => {
  it('reports every integration pending when nothing is configured', () => {
    expect(getIntegrationStatus()).toEqual({
      supabase: false,
      email: false,
      payments: false,
      ai: false,
      maps: false,
      analytics: false,
    });
  });

  it('does not mark payments configured for the manual provider', () => {
    process.env.PAYMENTS_PROVIDER = 'manual';
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    expect(getIntegrationStatus().payments).toBe(false);
  });

  it('marks payments configured only with a non-manual provider and secret key', () => {
    process.env.PAYMENTS_PROVIDER = 'stripe';
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    expect(getIntegrationStatus().payments).toBe(true);
  });

  it('requires both AI provider and key', () => {
    process.env.AI_PROVIDER = 'openai';
    expect(getIntegrationStatus().ai).toBe(false);
    process.env.AI_API_KEY = 'dummy';
    expect(getIntegrationStatus().ai).toBe(true);
  });

  it('requires both email key and sender', () => {
    process.env.RESEND_API_KEY = 'dummy';
    expect(getIntegrationStatus().email).toBe(false);
    process.env.EMAIL_FROM = 'noreply@example.com';
    expect(getIntegrationStatus().email).toBe(true);
  });
});