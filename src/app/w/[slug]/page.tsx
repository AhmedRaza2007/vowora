import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedWedding } from '@/features/weddings/public-queries';
import { PublicWeddingView } from '@/components/invitations/public-wedding-view';
import { appUrl } from '@/lib/env';
import type { Json } from '@/types/database';

type Params = { params: Promise<{ slug: string }> };

function color(config: Json, key: string): string | undefined {
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    const v = (config as Record<string, Json>)[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const wedding = await getPublishedWedding(slug);
  if (!wedding) return { title: 'Wedding not found', robots: { index: false, follow: false } };

  const seo = wedding.seo_config;
  const names = `${wedding.partner_one_name} & ${wedding.partner_two_name}`;
  const title = color(seo, 'title') ?? `${names} — Wedding`;
  const description =
    color(seo, 'description') ??
    `You are cordially invited to celebrate the wedding of ${names}. Open the invitation to discover the celebrations.`;

  const ogImage = `${appUrl}/api/og?slug=${encodeURIComponent(slug)}${
    wedding.published_at ? `&v=${encodeURIComponent(wedding.published_at)}` : ''
  }`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: names,
      images: [{ url: ogImage, width: 1200, height: 630, alt: names }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function PublicWeddingPage({ params }: Params) {
  const { slug } = await params;
  const wedding = await getPublishedWedding(slug);
  if (!wedding) notFound();
  return <PublicWeddingView wedding={wedding} />;
}