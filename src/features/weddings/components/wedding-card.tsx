import Link from 'next/link';
import { CalendarDays, ArrowRight } from 'lucide-react';
import type { Wedding } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { coupleInitials } from '@/lib/utils';

const statusVariant: Record<Wedding['status'], 'success' | 'secondary' | 'gold' | 'outline'> = {
  published: 'success',
  draft: 'secondary',
  unpublished: 'gold',
  archived: 'outline',
};

export function WeddingCard({ wedding }: { wedding: Wedding }) {
  return (
    <Link href={`/dashboard/weddings/${wedding.id}`} className="group block">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
              {coupleInitials(wedding.partner_one_name, wedding.partner_two_name)}
            </span>
            <Badge variant={statusVariant[wedding.status]}>{wedding.status}</Badge>
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold">{wedding.title}</h3>
          <p className="text-sm text-muted-foreground">
            {wedding.partner_one_name} & {wedding.partner_two_name}
          </p>
          {wedding.wedding_date ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {wedding.wedding_date}
            </p>
          ) : null}
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
            Manage
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}