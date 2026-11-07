import { describe, expect, it } from 'vitest';
import { eventSchema } from './event';

const minimal = { name: 'Nikah', eventDate: '2026-12-01', timezone: 'Asia/Karachi' };

describe('eventSchema', () => {
  it('accepts a minimal valid event', () => {
    expect(eventSchema.safeParse(minimal).success).toBe(true);
  });

  it('accepts a fully populated event with null optional fields', () => {
    const parsed = eventSchema.safeParse({
      ...minimal,
      eventType: 'nikah',
      description: 'The ceremony',
      startTime: '11:00',
      endTime: '13:30:00',
      venueName: 'Grand Hall',
      address: '123 Main St',
      mapsUrl: 'https://maps.google.com/?q=hall',
      lat: 24.8607,
      lng: 67.0011,
      coverImageUrl: '/api/media/weddings/x/cover.jpg',
      dressCode: 'Formal',
      instructions: 'Arrive early',
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts explicit nulls for clearable fields', () => {
    const parsed = eventSchema.safeParse({
      ...minimal,
      venueName: null,
      mapsUrl: null,
      lat: null,
      lng: null,
      startTime: null,
      coverImageUrl: null,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an empty name', () => {
    expect(eventSchema.safeParse({ ...minimal, name: '' }).success).toBe(false);
  });

  it('rejects a missing or malformed date', () => {
    expect(eventSchema.safeParse({ ...minimal, eventDate: '' }).success).toBe(false);
    expect(eventSchema.safeParse({ ...minimal, eventDate: '12/01/2026' }).success).toBe(false);
  });

  it('rejects an impossible calendar date', () => {
    expect(eventSchema.safeParse({ ...minimal, eventDate: '2026-02-30' }).success).toBe(false);
    expect(eventSchema.safeParse({ ...minimal, eventDate: '2026-13-01' }).success).toBe(false);
  });

  it('rejects an invalid time', () => {
    expect(eventSchema.safeParse({ ...minimal, startTime: '25:00' }).success).toBe(false);
    expect(eventSchema.safeParse({ ...minimal, endTime: '11:60' }).success).toBe(false);
  });

  it('rejects unsafe URL schemes for maps and cover image', () => {
    expect(eventSchema.safeParse({ ...minimal, mapsUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(eventSchema.safeParse({ ...minimal, coverImageUrl: 'data:text/html,x' }).success).toBe(false);
    expect(eventSchema.safeParse({ ...minimal, mapsUrl: '//evil.example' }).success).toBe(false);
  });

  it('rejects out-of-range coordinates', () => {
    expect(eventSchema.safeParse({ ...minimal, lat: 91 }).success).toBe(false);
    expect(eventSchema.safeParse({ ...minimal, lng: -181 }).success).toBe(false);
    expect(eventSchema.safeParse({ ...minimal, lat: Number.NaN }).success).toBe(false);
  });

  it('allows free-text custom event types', () => {
    expect(eventSchema.safeParse({ ...minimal, eventType: 'Haldi Ceremony' }).success).toBe(true);
  });

  it('rejects an over-long name', () => {
    expect(eventSchema.safeParse({ ...minimal, name: 'x'.repeat(161) }).success).toBe(false);
  });
});