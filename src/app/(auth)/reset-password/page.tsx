import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ResetPasswordForm } from '@/features/auth/components/password-forms';

export const metadata: Metadata = { title: 'Reset password' };

export default async function ResetPasswordPage() {
  const t = await getTranslations('auth');
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">{t('resetTitle')}</h1>
      <div className="mt-8">
        <ResetPasswordForm />
      </div>
    </div>
  );
}