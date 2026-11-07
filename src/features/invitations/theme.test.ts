import { describe, expect, it } from 'vitest';
import type { WeddingTheme } from '@/types/database';
import { resolveInvitationTheme } from './theme';

function theme(overrides: Partial<WeddingTheme> = {}): WeddingTheme {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    key: 'royal-gold-burgundy',
    name: 'Royal Gold & Burgundy',
    palette: { primary: '#6d1f3a', accent: '#c8a24a', background: '#fbf6ef', text: '#2b1a20' },
    typography: { heading: 'Cormorant Garamond', body: 'Inter' },
    envelope_config: { color: '#6d1f3a', liner: '#c8a24a', waxSeal: 'gold-monogram' },
    card_config: { border: 'gold-foil', background: '#fbf6ef' },
    decor_elements: {},
    animation_variant: 'classic-reveal',
    background_url: null,
    wax_seal_styles: {},
    min_plan_tier: 'premium',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('resolveInvitationTheme', () => {
  it('returns elegant defaults when no theme is assigned', () => {
    const r = resolveInvitationTheme(null);
    expect(r.primary).toBe('#6d1f3a');
    expect(r.waxSeal).toBe('gold-monogram');
    expect(r.animation).toBe('classic-reveal');
  });

  it('applies overrides on top of the default theme', () => {
    const r = resolveInvitationTheme(null, { primaryColor: '#000000', animation: 'cinematic-zoom' });
    expect(r.primary).toBe('#000000');
    expect(r.animation).toBe('cinematic-zoom');
  });

  it('resolves palette, envelope, card and animation from a theme row', () => {
    const r = resolveInvitationTheme(theme());
    expect(r.primary).toBe('#6d1f3a');
    expect(r.envelopeLiner).toBe('#c8a24a');
    expect(r.cardBorder).toBe('gold-foil');
    expect(r.animation).toBe('classic-reveal');
    expect(r.headingFont).toBe('Cormorant Garamond');
  });

  it('detects Urdu typography', () => {
    const r = resolveInvitationTheme(theme({ typography: { heading: 'X', body: 'Y', urdu: true } }));
    expect(r.urdu).toBe(true);
  });

  it('falls back for an unknown animation variant', () => {
    const r = resolveInvitationTheme(theme({ animation_variant: 'bogus' }));
    expect(r.animation).toBe('classic-reveal');
  });

  it('falls back for an unknown wax seal style', () => {
    const r = resolveInvitationTheme(theme({ envelope_config: { waxSeal: 'bogus' } }));
    expect(r.waxSeal).toBe('gold-monogram');
  });

  it('lets per-wedding overrides win over the theme', () => {
    const r = resolveInvitationTheme(theme(), { envelopeColor: '#111111', waxSeal: 'geometric' });
    expect(r.envelopeColor).toBe('#111111');
    expect(r.waxSeal).toBe('geometric');
  });
});