'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { setLocale } from '@/app/actions/locale';
import { type Locale } from '@/i18n/request';
import { Button } from '@/components/ui/button';

const labels: Record<Locale, string> = { en: 'English', ur: 'اردو' };

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === 'en' ? 'ur' : 'en';

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => setLocale(next))}
      aria-label={`Switch language to ${labels[next]}`}
    >
      <Languages className="h-4 w-4" />
      <span className="hidden sm:inline">{labels[next]}</span>
    </Button>
  );
}