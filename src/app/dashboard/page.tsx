import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Heart, Globe, FileEdit, Mail, ClipboardCheck, Wallet } from 'lucide-react';
import { getDashboardStats, getMyWeddings } from '@/features/weddings/queries';
import { getCurrentProfile } from '@/lib/auth';
import { StatCard } from '@/components/dashboard/stat-card';
import { WeddingCard } from '@/features/weddings/components/wedding-card';
import { CreateWeddingDialog } from '@/features/weddings/components/create-wedding-dialog';
import { EmptyState } from '@/components/shared/states';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Dashboard' };

const upcomingModules = [
  { icon: Mail, label: 'Invitations & guests', phase: 'Phase 4' },
  { icon: ClipboardCheck, label: 'RSVP analytics', phase: 'Phase 5' },
  { icon: Wallet, label: 'Budget planner', phase: 'Phase 7' },
];

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  const profile = await getCurrentProfile();
  const [stats, weddings] = await Promise.all([getDashboardStats(), getMyWeddings()]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t('welcome')}
            {profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">{t('overview')}</p>
        </div>
        <CreateWeddingDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title={t('activeWeddings')} value={stats.totalWeddings} icon={Heart} />
        <StatCard title={t('publicationStatus')} value={stats.publishedWeddings} icon={Globe} hint="published" />
        <StatCard title="Drafts" value={stats.draftWeddings} icon={FileEdit} hint="in progress" />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('myWeddings')}</h2>
          <Link href="/dashboard/weddings" className="text-sm text-primary hover:underline">
            {t('viewAll')}
          </Link>
        </div>
        {weddings.length === 0 ? (
          <EmptyState
            title={t('noWeddings')}
            description={t('noWeddingsCta')}
            action={<CreateWeddingDialog />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {weddings.slice(0, 3).map((w) => (
              <WeddingCard key={w.id} wedding={w} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Planning modules</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {upcomingModules.map((m) => (
            <Card key={m.label} className="border-dashed">
              <CardContent className="flex items-center gap-4 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <m.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium">{m.label}</p>
                  <Badge variant="outline" className="mt-1">
                    {m.phase}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          These modules are delivered in later phases. No sample data is shown.
        </p>
      </div>
    </div>
  );
}