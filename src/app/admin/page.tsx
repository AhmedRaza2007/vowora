import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Users, Heart, Globe, LayoutTemplate, CreditCard } from 'lucide-react';
import { getAdminOverview } from '@/features/admin/queries';
import { StatCard } from '@/components/dashboard/stat-card';

export const metadata: Metadata = { title: 'Admin Console' };

export default async function AdminPage() {
  const t = await getTranslations('admin');
  const stats = await getAdminOverview();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">Platform overview (live data).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title={t('customers')} value={stats.customers} icon={Users} />
        <StatCard title={t('weddings')} value={stats.weddings} icon={Heart} />
        <StatCard title="Published websites" value={stats.publishedWeddings} icon={Globe} />
        <StatCard title={t('templates')} value={stats.templates} icon={LayoutTemplate} />
        <StatCard title="Subscription plans" value={stats.plans} icon={CreditCard} />
      </div>
    </div>
  );
}