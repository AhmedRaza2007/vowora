import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { appUrl } from '@/lib/env';
import { isEmailConfigured } from '@/lib/email';
import { getWeddingForBuilder } from '@/features/weddings/builder-queries';
import { getGuests } from '@/features/weddings/guest-queries';
import { getInvitations } from '@/features/invitations/invitation-manage-queries';
import { InvitationsManager } from '@/components/dashboard/invitations/invitations-manager';

export const metadata: Metadata = { title: 'Invitations' };

export default async function WeddingInvitationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/dashboard/weddings/${id}/invitations`);

  const wedding = await getWeddingForBuilder(id);
  if (!wedding) notFound();

  const [guests, invitations] = await Promise.all([getGuests(id), getInvitations(id)]);

  return (
    <InvitationsManager
      wedding={wedding}
      guests={guests}
      invitations={invitations}
      baseUrl={appUrl}
      emailConfigured={isEmailConfigured()}
    />
  );
}