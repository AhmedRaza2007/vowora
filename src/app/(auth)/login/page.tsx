import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = { title: 'Log in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const t = await getTranslations('auth');
  const { redirect } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">{t('loginTitle')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('loginSubtitle')}</p>
      <div className="mt-8">
        <LoginForm redirect={redirect} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t('registerButton')}
        </Link>
      </p>
    </div>
  );
}