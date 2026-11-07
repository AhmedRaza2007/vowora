import { describe, expect, it } from 'vitest';
import { buildInvitationEmail } from './email-template';

const base = {
  guestName: 'Omar',
  coupleOne: 'Aisha',
  coupleTwo: 'Bilal',
  date: '2026-12-12',
  url: 'https://vowora.app/i/securetoken',
};

describe('buildInvitationEmail', () => {
  it('includes guest, couple, date and the secure link in text and html', () => {
    const { subject, html, text } = buildInvitationEmail(base);
    expect(subject).toContain('Aisha & Bilal');
    expect(text).toContain('Dear Omar');
    expect(text).toContain('https://vowora.app/i/securetoken');
    expect(html).toContain('Omar');
    expect(html).toContain('https://vowora.app/i/securetoken');
    expect(html).toContain('2026-12-12');
  });

  it('escapes HTML in guest names and custom messages (no markup injection)', () => {
    const { html } = buildInvitationEmail({
      ...base,
      guestName: '<script>alert(1)</script>',
      message: 'Join us <img src=x onerror=alert(1)>',
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  it('omits the link for non-http(s) URLs (unsafe scheme guard)', () => {
    const { html, text } = buildInvitationEmail({ ...base, url: 'javascript:alert(1)' });
    expect(html).not.toContain('javascript:');
    expect(text).not.toContain('javascript:');
  });

  it('uses a custom message when provided', () => {
    const { text } = buildInvitationEmail({ ...base, message: 'We cannot wait to celebrate with you!' });
    expect(text).toContain('We cannot wait to celebrate with you!');
  });
});