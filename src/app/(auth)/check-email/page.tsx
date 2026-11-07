import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { MailCheck } from 'lucide-react';

export const metadata: Metadata = { title: 'Check your email' };

export default async function CheckEmailPage() {
  const t = await getTranslations('auth');
  return (
    <div className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MailCheck className="h-7 w-7" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">{t('checkEmail')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('checkEmailBody')}</p>
    </div>
  );
}