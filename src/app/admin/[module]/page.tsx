import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hammer, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Admin Module' };

const adminModules: Record<string, { title: string; phase: string; description: string }> = {
  payments: { title: 'Payment Records', phase: 'Phase 6', description: 'Verified payment records, webhook-confirmed statuses, refunds and invoice history.' },
  'custom-orders': { title: 'Custom Design Orders', phase: 'Phase 6', description: 'Manage professionally designed wedding website orders: briefs, quotes, assignment and delivery.' },
  vendors: { title: 'Vendor Approvals', phase: 'Phase 7', description: 'Review and approve vendor profiles, portfolios and packages. No fake profiles or reviews.' },
  venues: { title: 'Venue Management', phase: 'Phase 7', description: 'Manage venue listings with clearly labeled estimated vs verified information.' },
  support: { title: 'Support Requests', phase: 'Phase 1+', description: 'Customer support and account-deletion requests are recorded now; full ticketing matures across phases.' },
  reports: { title: 'Reports & Analytics', phase: 'Phase 8', description: 'Platform reports and analytics across customers, weddings, subscriptions and revenue.' },
  settings: { title: 'Platform Settings', phase: 'Phase 1+', description: 'Configurable branding, plans, feature limits and platform configuration.' },
};

export default async function AdminModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: slug } = await params;
  const info = adminModules[slug];
  if (!info) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin">
          <ArrowLeft className="h-4 w-4" />
          Back to console
        </Link>
      </Button>
      <Card>
        <CardContent className="p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Hammer className="h-7 w-7" />
          </span>
          <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">{info.title}</h1>
          <Badge variant="gold" className="mt-3">
            {info.phase}
          </Badge>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">{info.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}