import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getMyWeddings } from '@/features/weddings/queries';
import { WeddingCard } from '@/features/weddings/components/wedding-card';
import { CreateWeddingDialog } from '@/features/weddings/components/create-wedding-dialog';
import { EmptyState } from '@/components/shared/states';

export const metadata: Metadata = { title: 'My Weddings' };

export default async function WeddingsPage() {
  const t = await getTranslations('dashboard');
  const weddings = await getMyWeddings();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t('myWeddings')}</h1>
        <CreateWeddingDialog />
      </div>

      {weddings.length === 0 ? (
        <EmptyState
          title={t('noWeddings')}
          description={t('noWeddingsCta')}
          action={<CreateWeddingDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weddings.map((w) => (
            <WeddingCard key={w.id} wedding={w} />
          ))}
        </div>
      )}
    </div>
  );
}