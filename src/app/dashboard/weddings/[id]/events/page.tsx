import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getWeddingForBuilder } from '@/features/weddings/builder-queries';
import { getEvents } from '@/features/weddings/event-queries';
import { EventsManager } from '@/components/dashboard/events/events-manager';

export const metadata: Metadata = { title: 'Events' };

export default async function WeddingEventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/dashboard/weddings/${id}/events`);

  const wedding = await getWeddingForBuilder(id);
  if (!wedding) notFound();

  const events = await getEvents(id);

  return <EventsManager wedding={wedding} events={events} />;
}