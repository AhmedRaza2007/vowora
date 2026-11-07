'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { forgotPasswordAction, resetPasswordAction } from '@/features/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const t = useTranslations();
  const ta = useTranslations('auth');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await forgotPasswordAction(null, fd);
          if (res?.error) setError(res.error.startsWith('errors.') ? t(res.error) : res.error);
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">{ta('email')}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {ta('resetTitle')}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations();
  const ta = useTranslations('auth');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await resetPasswordAction(null, fd);
          if (res?.error) setError(res.error.startsWith('errors.') ? t(res.error) : res.error);
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="password">{ta('password')}</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{ta('confirmPassword')}</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {ta('resetTitle')}
      </Button>
    </form>
  );
}