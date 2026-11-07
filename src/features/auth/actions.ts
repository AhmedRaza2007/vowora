'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured, appUrl } from '@/lib/env';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations/auth';

export type ActionResult = { error: string | null };

function notConfigured(): ActionResult {
  return { error: 'Supabase is not configured. Add your project credentials to continue.' };
}

export async function signInAction(_: unknown, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'errors.invalidCredentials' };

  const redirectTo = formData.get('redirect');
  redirect(typeof redirectTo === 'string' && redirectTo.startsWith('/') ? redirectTo : '/dashboard');
}

export async function signUpAction(_: unknown, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();

  const parsed = registerSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.generic' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message.toLowerCase().includes('already') ? 'errors.emailTaken' : 'errors.generic' };
  }

  // If email confirmation is disabled, a session exists immediately.
  if (data.session) redirect('/dashboard');
  redirect('/check-email');
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect('/login');
}

export async function forgotPasswordAction(_: unknown, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { error: 'errors.invalidEmail' };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: 'errors.generic' };
  redirect('/check-email');
}

export async function resetPasswordAction(_: unknown, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: 'errors.generic' };
  redirect('/dashboard');
}