import { describe, expect, it } from 'vitest';
import { invitationConfigSchema, updateCoupleSchema } from './invitation';

describe('invitationConfigSchema', () => {
  it('accepts an empty config (all fields optional)', () => {
    expect(invitationConfigSchema.safeParse({}).success).toBe(true);
  });

  it('accepts valid hex colors, enums and text', () => {
    const parsed = invitationConfigSchema.safeParse({
      primaryColor: '#6d1f3a',
      accentColor: '#c8a24a',
      envelopeColor: '#abc',
      waxSeal: 'geometric',
      cardBorder: 'mughal-arch',
      animation: 'cinematic-zoom',
      introMessage: 'Join us',
      musicUrl: '/api/media/x/y.mp3',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a non-hex color', () => {
    expect(invitationConfigSchema.safeParse({ primaryColor: 'red; background:url(x)' }).success).toBe(false);
    expect(invitationConfigSchema.safeParse({ accentColor: 'javascript:alert(1)' }).success).toBe(false);
  });

  it('rejects an unknown wax seal style', () => {
    expect(invitationConfigSchema.safeParse({ waxSeal: 'bogus' }).success).toBe(false);
  });

  it('rejects an unknown animation variant', () => {
    expect(invitationConfigSchema.safeParse({ animation: 'explode' }).success).toBe(false);
  });

  it('rejects an over-long intro message', () => {
    expect(invitationConfigSchema.safeParse({ introMessage: 'x'.repeat(2001) }).success).toBe(false);
  });
});

describe('updateCoupleSchema', () => {
  it('accepts names and optional initials', () => {
    expect(updateCoupleSchema.safeParse({ partnerOneName: 'Aisha', partnerTwoName: 'Omar', coupleInitials: 'A&O' }).success).toBe(true);
    expect(updateCoupleSchema.safeParse({ partnerOneName: 'Aisha', partnerTwoName: 'Omar' }).success).toBe(true);
  });

  it('rejects an empty name', () => {
    expect(updateCoupleSchema.safeParse({ partnerOneName: '', partnerTwoName: 'Omar' }).success).toBe(false);
  });

  it('rejects over-long initials', () => {
    expect(updateCoupleSchema.safeParse({ partnerOneName: 'A', partnerTwoName: 'B', coupleInitials: 'x'.repeat(9) }).success).toBe(false);
  });
});