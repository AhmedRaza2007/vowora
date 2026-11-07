'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { signUpAction } from '@/features/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RegisterForm() {
  const t = useTranslations();
  const ta = useTranslations('auth');
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (values: RegisterInput) => {
    setServerError(null);
    const fd = new FormData();
    fd.set('fullName', values.fullName);
    fd.set('email', values.email);
    fd.set('password', values.password);
    fd.set('confirmPassword', values.confirmPassword);
    startTransition(async () => {
      const result = await signUpAction(null, fd);
      if (result?.error) {
        setServerError(result.error.startsWith('errors.') ? t(result.error) : result.error);
      }
    });
  };

  const fieldError = (message?: string) =>
    message ? <p className="text-xs text-destructive">{t(message)}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="fullName">{ta('fullName')}</Label>
        <Input id="fullName" autoComplete="name" {...register('fullName')} />
        {fieldError(errors.fullName?.message)}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{ta('email')}</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {fieldError(errors.email?.message)}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{ta('password')}</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
        {fieldError(errors.password?.message)}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{ta('confirmPassword')}</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        {fieldError(errors.confirmPassword?.message)}
      </div>

      {serverError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {ta('registerButton')}
      </Button>
    </form>
  );
}