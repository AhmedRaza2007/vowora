import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import type { Profile } from '@/types/database';

/** Current authenticated user, or null. Never throws when Supabase is unconfigured. */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return (data as Profile) ?? null;
}

/** Require an authenticated user; redirect to login otherwise. */
export async function requireUser(redirectTo = '/dashboard') {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  return user;
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.platform_role === 'admin' || profile?.platform_role === 'super_admin';
}

/** Require a platform admin; redirect non-admins away. Server-side only — never trusted client-side. */
export async function requireAdmin() {
  const user = await requireUser('/admin');
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect('/dashboard');
  return { user, profile: profile as Profile };
}