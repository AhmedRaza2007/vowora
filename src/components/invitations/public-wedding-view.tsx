import type { Json } from '@/types/database';
import type { PublishedInvitation, PublishedWedding } from '@/features/weddings/public-queries';
import { WeddingSectionView } from '@/components/invitations/wedding-section';
import { InvitationGate } from '@/components/invitations/invitation-gate';
import { resolveInvitationTheme, type InvitationConfig } from '@/features/invitations/theme';

function color(config: Json, key: string): string | undefined {
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    const v = (config as Record<string, Json>)[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

function isPersonalized(wedding: PublishedWedding | PublishedInvitation): wedding is PublishedInvitation {
  return 'guest' in wedding;
}

/**
 * Public wedding website wrapped in the signature envelope-opening experience. Shared by
 * the slug route (/w/[slug]) and the personalized invitation route (/i/[token]). Personalized
 * invitations greet the invited guest by name and show only their authorized events.
 */
export function PublicWeddingView({ wedding }: { wedding: PublishedWedding | PublishedInvitation }) {
  const palette = wedding.theme?.palette ?? null;
  const design = wedding.design_config;
  const background = color(design, 'backgroundColor') ?? color(palette, 'background') ?? '#fffaf3';
  const text = color(design, 'textColor') ?? color(palette, 'text') ?? '#2b1a20';
  const primary = color(design, 'primaryColor') ?? color(palette, 'primary') ?? '#6d1f3a';

  const couple = {
    one: wedding.partner_one_name,
    two: wedding.partner_two_name,
    date: wedding.wedding_date,
    initials: wedding.couple_initials,
    guestName: isPersonalized(wedding) ? wedding.guest.name : null,
  };

  const dir = wedding.locale === 'ur' ? 'rtl' : 'ltr';
  const invitation = (wedding.invitation_config ?? {}) as InvitationConfig;
  const resolvedTheme = resolveInvitationTheme(wedding.theme, {
    primaryColor: color(design, 'primaryColor'),
    accentColor: color(design, 'accentColor'),
    backgroundColor: color(design, 'backgroundColor'),
    textColor: color(design, 'textColor'),
    ...invitation,
  });
  const introMessage = invitation.introMessage ?? color(design, 'invitationMessage');
  const musicUrl = invitation.musicUrl ?? color(design, 'musicUrl');

  return (
    <InvitationGate
      couple={couple}
      theme={resolvedTheme}
      introMessage={introMessage}
      musicUrl={musicUrl}
      dir={dir}
    >
      <main dir={dir} style={{ backgroundColor: background, color: text }}>
        <div style={{ ['--wedding-primary' as string]: primary }}>
          {wedding.sections.map((section) => (
            <WeddingSectionView
              key={section.id}
              section={section}
              couple={couple}
              events={wedding.events}
              locale={wedding.locale}
            />
          ))}
          <footer className="px-6 py-10 text-center text-sm opacity-70">
            <p className="font-display text-lg">
              {wedding.partner_one_name} &amp; {wedding.partner_two_name}
            </p>
            {wedding.wedding_date && <p className="mt-1">{wedding.wedding_date}</p>}
          </footer>
        </div>
      </main>
    </InvitationGate>
  );
}