import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = { title: 'Create account' };

export default async function RegisterPage() {
  const t = await getTranslations('auth');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">{t('registerTitle')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('registerSubtitle')}</p>
      <div className="mt-8">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('haveAccount')}{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t('loginButton')}
        </Link>
      </p>
    </div>
  );
}