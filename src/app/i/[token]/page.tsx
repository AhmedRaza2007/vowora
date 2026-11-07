import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getInvitationByToken } from '@/features/invitations/invitation-queries';
import { PublicWeddingView } from '@/components/invitations/public-wedding-view';
import { appUrl } from '@/lib/env';

type Params = { params: Promise<{ token: string }> };

/**
 * Personalized invitation metadata. The OG image is keyed by the public slug (never the
 * token), so social previews show the couple's themed card without leaking the capability
 * token or the guest's name. The route stays noindex — these are private capability URLs.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const wedding = await getInvitationByToken(token);
  if (!wedding) return { title: 'Invitation not found', robots: { index: false, follow: false } };

  const names = `${wedding.partner_one_name} & ${wedding.partner_two_name}`;
  const title = `${names} — Wedding Invitation`;
  const description = `You are cordially invited to celebrate the wedding of ${names}. Open your personal invitation.`;
  const ogImage = `${appUrl}/api/og?slug=${encodeURIComponent(wedding.slug)}${
    wedding.published_at ? `&v=${encodeURIComponent(wedding.published_at)}` : ''
  }`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
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

/**
 * Personalized secure invitation entry point. The `get_invitation` RPC resolves the token to
 * the published wedding plus this guest's authorized events; any invalid/revoked/expired/
 * exhausted token or unpublished wedding resolves to null and the route returns a true 404.
 */
export default async function InvitationPage({ params }: Params) {
  const { token } = await params;
  const wedding = await getInvitationByToken(token);
  if (!wedding) notFound();
  return <PublicWeddingView wedding={wedding} />;
}