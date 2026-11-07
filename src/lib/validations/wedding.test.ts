import { describe, expect, it } from 'vitest';
import { buildWeddingSlug, createWeddingSchema } from './wedding';

describe('createWeddingSchema', () => {
  const valid = {
    title: 'Ahmed & Ayesha',
    partnerOneName: 'Ahmed',
    partnerTwoName: 'Ayesha',
    timezone: 'Asia/Karachi',
    currency: 'PKR',
    locale: 'en',
  };

  it('accepts valid input and applies defaults', () => {
    const parsed = createWeddingSchema.parse({
      title: 'Our Wedding',
      partnerOneName: 'A',
      partnerTwoName: 'B',
    });
    expect(parsed.timezone).toBe('UTC');
    expect(parsed.currency).toBe('USD');
    expect(parsed.locale).toBe('en');
  });

  it('rejects a too-short title', () => {
    expect(createWeddingSchema.safeParse({ ...valid, title: 'A' }).success).toBe(false);
  });

  it('rejects an empty partner name', () => {
    expect(createWeddingSchema.safeParse({ ...valid, partnerOneName: '' }).success).toBe(false);
  });

  it('rejects a non-3-letter currency', () => {
    expect(createWeddingSchema.safeParse({ ...valid, currency: 'US' }).success).toBe(false);
  });

  it('rejects an unsupported locale', () => {
    expect(createWeddingSchema.safeParse({ ...valid, locale: 'fr' }).success).toBe(false);
  });
});

describe('buildWeddingSlug', () => {
  it('produces a lowercase url-safe slug with a random suffix', () => {
    const slug = buildWeddingSlug('Ahmed', 'Ayesha');
    expect(slug).toMatch(/^ahmed-ayesha-[a-z0-9]{1,6}$/);
  });

  it('strips diacritics and punctuation', () => {
    const slug = buildWeddingSlug('José', 'Ann-Marie!');
    expect(slug.startsWith('jose-ann-marie-')).toBe(true);
  });

  it('falls back to "wedding" when names yield no base', () => {
    const slug = buildWeddingSlug('!!', '??');
    expect(slug.startsWith('wedding-')).toBe(true);
  });

  it('is collision-resistant across calls', () => {
    const a = buildWeddingSlug('Ahmed', 'Ayesha');
    const b = buildWeddingSlug('Ahmed', 'Ayesha');
    expect(a).not.toBe(b);
  });
});