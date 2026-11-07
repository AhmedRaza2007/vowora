import { describe, expect, it } from 'vitest';
import { buildInvitationShare, normalizeWhatsAppPhone } from './share';

describe('buildInvitationShare', () => {
  it('builds a wa.me link with an encoded default message from couple data', () => {
    const { text, whatsappUrl } = buildInvitationShare({
      coupleOne: 'Ayesha',
      coupleTwo: 'Bilal',
      date: '2026-12-01',
      url: 'https://vowora.app/w/ayesha-bilal',
    });
    expect(text).toContain('Ayesha & Bilal');
    expect(text).toContain('2026-12-01');
    expect(text).toContain('https://vowora.app/w/ayesha-bilal');
    expect(whatsappUrl.startsWith('https://wa.me/?text=')).toBe(true);
    expect(whatsappUrl).toContain(encodeURIComponent('Ayesha & Bilal'));
  });

  it('uses a custom message when provided', () => {
    const { text } = buildInvitationShare({
      coupleOne: 'A',
      coupleTwo: 'B',
      url: 'https://x.test/w/ab',
      message: 'Join us!',
    });
    expect(text).toBe('Join us! https://x.test/w/ab');
  });

  it('omits the date when absent', () => {
    const { text } = buildInvitationShare({ coupleOne: 'A', coupleTwo: 'B', url: 'https://x.test' });
    expect(text).not.toContain(' on ');
  });

  it('personalizes the greeting with the guest name', () => {
    const { text } = buildInvitationShare({
      coupleOne: 'A',
      coupleTwo: 'B',
      url: 'https://x.test/i/tok',
      guestName: 'Omar',
    });
    expect(text).toContain('Dear Omar,');
    expect(text).toContain('https://x.test/i/tok');
  });

  it('targets a specific WhatsApp chat when a valid phone is given', () => {
    const { whatsappUrl } = buildInvitationShare({
      coupleOne: 'A',
      coupleTwo: 'B',
      url: 'https://x.test/i/tok',
      phone: '+92 300 1234567',
    });
    expect(whatsappUrl.startsWith('https://wa.me/923001234567?text=')).toBe(true);
  });

  it('falls back to the generic share link for an invalid phone', () => {
    const { whatsappUrl } = buildInvitationShare({
      coupleOne: 'A',
      coupleTwo: 'B',
      url: 'https://x.test/i/tok',
      phone: '123',
    });
    expect(whatsappUrl.startsWith('https://wa.me/?text=')).toBe(true);
  });
});

describe('normalizeWhatsAppPhone', () => {
  it('strips formatting to digits-only international form', () => {
    expect(normalizeWhatsAppPhone('+92 (300) 123-4567')).toBe('923001234567');
    expect(normalizeWhatsAppPhone('0044 7700 900123')).toBe('00447700900123');
  });

  it('returns null for empty or too-short/too-long input', () => {
    expect(normalizeWhatsAppPhone(null)).toBeNull();
    expect(normalizeWhatsAppPhone('')).toBeNull();
    expect(normalizeWhatsAppPhone('12345')).toBeNull();
    expect(normalizeWhatsAppPhone('1'.repeat(16))).toBeNull();
  });
});