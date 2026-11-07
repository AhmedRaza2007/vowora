import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getSections, getTemplates, getWeddingForBuilder } from '@/features/weddings/builder-queries';
import { Builder } from '@/components/dashboard/builder/builder';

export const metadata: Metadata = { title: 'Website Builder' };

export default async function WeddingBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/dashboard/weddings/${id}/builder`);

  const wedding = await getWeddingForBuilder(id);
  if (!wedding) notFound();

  const [sections, templates] = await Promise.all([getSections(id), getTemplates()]);

  return <Builder wedding={wedding} sections={sections} templates={templates} />;
}