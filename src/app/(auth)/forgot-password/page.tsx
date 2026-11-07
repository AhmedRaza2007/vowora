import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ForgotPasswordForm } from '@/features/auth/components/password-forms';

export const metadata: Metadata = { title: 'Forgot password' };

export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth');
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">{t('resetTitle')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('checkEmailBody')}</p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}