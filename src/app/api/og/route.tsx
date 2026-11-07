import { ImageResponse } from 'next/og';
import { getPublishedWedding } from '@/features/weddings/public-queries';
import { resolveInvitationTheme } from '@/features/invitations/theme';
import { getBranding } from '@/lib/branding-server';

export const runtime = 'nodejs';

const size = { width: 1200, height: 630 };

/**
 * Dynamic Open Graph cover for WhatsApp/social sharing. Reflects the real published
 * wedding (couple names, date, theme palette). When no published wedding resolves, renders
 * an honest brand card — never fabricated couple data. Append `?v=<published_at>` to bust
 * caches after a design change.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const wedding = slug ? await getPublishedWedding(slug) : null;

  if (wedding) {
    const theme = resolveInvitationTheme(wedding.theme, {
      primaryColor: str(wedding.design_config, 'primaryColor'),
      accentColor: str(wedding.design_config, 'accentColor'),
      backgroundColor: str(wedding.design_config, 'backgroundColor'),
      textColor: str(wedding.design_config, 'textColor'),
    });
    const initials = wedding.couple_initials || `${wedding.partner_one_name[0] ?? ''}${wedding.partner_two_name[0] ?? ''}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.background,
            color: theme.text,
            padding: 48,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              border: `2px solid ${theme.accent}`,
              borderRadius: 24,
              padding: 40,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 96,
                height: 96,
                borderRadius: 48,
                border: `2px solid ${theme.accent}`,
                color: theme.primary,
                fontSize: 36,
                fontWeight: 600,
                marginBottom: 28,
              }}
            >
              {initials}
            </div>
            <div style={{ display: 'flex', fontSize: 24, letterSpacing: 6, opacity: 0.7, marginBottom: 20 }}>
              YOU ARE CORDIALLY INVITED
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 72,
                fontWeight: 600,
                color: theme.primary,
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              {wedding.partner_one_name} & {wedding.partner_two_name}
            </div>
            {wedding.wedding_date && (
              <div style={{ display: 'flex', fontSize: 30, marginTop: 24, opacity: 0.8 }}>
                {wedding.wedding_date}
              </div>
            )}
          </div>
        </div>
      ),
      { ...size },
    );
  }

  const branding = await getBranding();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fbf6ef',
          color: '#2b1a20',
          padding: 48,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            border: '2px solid #c8a24a',
            borderRadius: 24,
          }}
        >
          <div style={{ display: 'flex', fontSize: 80, fontWeight: 600, color: '#6d1f3a' }}>
            {branding.name}
          </div>
          <div style={{ display: 'flex', fontSize: 30, marginTop: 20, opacity: 0.75, textAlign: 'center', padding: '0 60px' }}>
            {branding.tagline}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function str(config: unknown, key: string): string | undefined {
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    const v = (config as Record<string, unknown>)[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}