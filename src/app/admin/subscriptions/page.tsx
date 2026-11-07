import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getPlans } from '@/features/admin/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/states';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = { title: 'Subscriptions · Admin' };

export default async function AdminSubscriptionsPage() {
  const t = await getTranslations('admin');
  const plans = await getPlans();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t('subscriptions')}</h1>
        <p className="text-sm text-muted-foreground">
          Configurable plans. Pricing and feature limits are admin-editable (Phase 6).
        </p>
      </div>
      {plans.length === 0 ? (
        <EmptyState description="No plans configured. Run the config seed migration." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  <Badge variant={p.is_active ? 'success' : 'outline'}>
                    {p.is_active ? 'active' : 'inactive'}
                  </Badge>
                </div>
                <p className="mt-3 font-display text-2xl font-semibold">
                  {p.price_monthly != null ? formatCurrency(p.price_monthly, p.currency) : 'Custom'}
                  {p.price_monthly != null ? (
                    <span className="text-sm font-normal text-muted-foreground"> /mo</span>
                  ) : null}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                <Badge variant="secondary" className="mt-4">
                  tier {p.tier}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}