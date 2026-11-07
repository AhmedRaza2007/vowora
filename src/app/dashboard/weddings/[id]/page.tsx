import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, Globe, MapPin, LayoutTemplate, Mail, Users, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Wedding } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Wedding' };

export default async function WeddingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('weddings').select('*').eq('id', id).single();
  if (!data) notFound();
  const wedding = data as Wedding;

  const nextSteps = [
    { icon: LayoutTemplate, title: 'Website Builder', body: 'Design your wedding website.', phase: 'Ready', href: `/dashboard/weddings/${id}/builder` },
    { icon: Mail, title: 'Invitation Designer', body: 'Craft the cinematic envelope invitation.', phase: 'Ready', href: `/dashboard/weddings/${id}/invitation` },
    { icon: CalendarDays, title: 'Events', body: 'Add ceremonies, venues and schedules.', phase: 'Ready', href: `/dashboard/weddings/${id}/events` },
    { icon: Users, title: 'Guests', body: 'Manage guests, groups and event access.', phase: 'Ready', href: `/dashboard/weddings/${id}/guests` },
    { icon: Send, title: 'Invitations', body: 'Send secure personal links to each guest.', phase: 'Ready', href: `/dashboard/weddings/${id}/invitations` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{wedding.title}</h1>
            <Badge variant={wedding.status === 'published' ? 'success' : 'secondary'}>
              {wedding.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {wedding.partner_one_name} & {wedding.partner_two_name}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/weddings">Back to weddings</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {wedding.wedding_date ?? 'Date not set'}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {wedding.timezone} · {wedding.currency}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">/w/{wedding.slug}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next steps</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nextSteps.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <s.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">{s.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.body}</p>
              <Badge variant="outline" className="mt-3">
                {s.phase}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}