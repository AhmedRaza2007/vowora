import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getThemes, getWeddingForBuilder } from '@/features/weddings/builder-queries';
import { InvitationDesigner } from '@/components/dashboard/invitation/invitation-designer';

export const metadata: Metadata = { title: 'Invitation Designer' };

export default async function WeddingInvitationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/dashboard/weddings/${id}/invitation`);

  const wedding = await getWeddingForBuilder(id);
  if (!wedding) notFound();

  const themes = await getThemes();

  return <InvitationDesigner wedding={wedding} themes={themes} />;
}