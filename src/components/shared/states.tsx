'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Inbox, Settings2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LoadingState({ className }: { className?: string }) {
  const t = useTranslations('common');
  return (
    <div className={cn('flex items-center justify-center gap-2 py-16 text-muted-foreground', className)}>
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{t('loading')}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations('states');
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center',
        className,
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </span>
      <h3 className="text-base font-semibold">{title ?? t('emptyTitle')}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  const t = useTranslations('states');
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-16 text-center',
        className,
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </span>
      <h3 className="text-base font-semibold">{t('errorTitle')}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t('errorBody')}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          {t('retry')}
        </Button>
      ) : null}
    </div>
  );
}

export function SetupNotice({ className }: { className?: string }) {
  const t = useTranslations('states');
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-gold/40 bg-gold/10 p-4',
        className,
      )}
    >
      <Settings2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
      <div>
        <p className="text-sm font-semibold">{t('setupTitle')}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{t('setupBody')}</p>
      </div>
    </div>
  );
}