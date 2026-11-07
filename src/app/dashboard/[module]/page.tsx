import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hammer, ArrowLeft } from 'lucide-react';
import { moduleCatalog } from '@/lib/modules';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Module' };

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: slug } = await params;
  const info = moduleCatalog[slug];
  if (!info) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
      </Button>

      <Card>
        <CardContent className="p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Hammer className="h-7 w-7" />
          </span>
          <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">{info.title}</h1>
          <Badge variant="gold" className="mt-3">
            Arriving in {info.phase}
          </Badge>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">{info.description}</p>
          <p className="mt-6 text-xs text-muted-foreground">
            This module is part of the phased roadmap and is not yet available. No sample data
            is shown here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}