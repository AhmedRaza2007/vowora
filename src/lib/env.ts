/**
 * Centralized environment access. Public values are safe for the browser; secret values
 * are only read in server contexts. Integration "configured" flags drive honest PENDING
 * states in the UI — we never pretend an unconfigured provider works.
 */

export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export type IntegrationStatus = {
  supabase: boolean;
  email: boolean;
  payments: boolean;
  ai: boolean;
  maps: boolean;
  analytics: boolean;
};

/** Server-side integration status. Secret keys are never sent to the client. */
export function getIntegrationStatus(): IntegrationStatus {
  return {
    supabase: isSupabaseConfigured(),
    email: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
    payments:
      (process.env.PAYMENTS_PROVIDER ?? 'manual') !== 'manual' &&
      Boolean(process.env.STRIPE_SECRET_KEY),
    ai: Boolean(process.env.AI_PROVIDER && process.env.AI_API_KEY),
    maps: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY),
    analytics: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY),
  };
}