import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getWeddingForBuilder } from '@/features/weddings/builder-queries';
import { getEvents } from '@/features/weddings/event-queries';
import { getGuests, getGuestGroups, getGuestEvents } from '@/features/weddings/guest-queries';
import { GuestsManager } from '@/components/dashboard/guests/guests-manager';

export const metadata: Metadata = { title: 'Guests' };

export default async function WeddingGuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/dashboard/weddings/${id}/guests`);

  const wedding = await getWeddingForBuilder(id);
  if (!wedding) notFound();

  const [guests, groups, guestEvents, events] = await Promise.all([
    getGuests(id),
    getGuestGroups(id),
    getGuestEvents(id),
    getEvents(id),
  ]);

  return (
    <GuestsManager wedding={wedding} guests={guests} groups={groups} guestEvents={guestEvents} events={events} />
  );
}