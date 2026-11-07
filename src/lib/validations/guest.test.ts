import { describe, expect, it } from 'vitest';
import { guestSchema, guestGroupSchema, guestEventsSchema, parseGuestCsv } from './guest';

const minimal = { name: 'Aisha Khan', category: 'family', maxAttendees: 2, isVip: false };

describe('guestSchema', () => {
  it('accepts a minimal valid guest', () => {
    expect(guestSchema.safeParse(minimal).success).toBe(true);
  });

  it('accepts a full guest with null optional fields', () => {
    const parsed = guestSchema.safeParse({
      ...minimal,
      email: 'aisha@example.com',
      phone: '+92 300 1234567',
      groupId: null,
      notes: null,
      dietaryPreferences: 'Vegetarian',
      isVip: true,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an empty name and invalid email', () => {
    expect(guestSchema.safeParse({ ...minimal, name: '' }).success).toBe(false);
    expect(guestSchema.safeParse({ ...minimal, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects an unknown category and out-of-range attendee count', () => {
    expect(guestSchema.safeParse({ ...minimal, category: 'stranger' }).success).toBe(false);
    expect(guestSchema.safeParse({ ...minimal, maxAttendees: 0 }).success).toBe(false);
    expect(guestSchema.safeParse({ ...minimal, maxAttendees: 1.5 }).success).toBe(false);
  });
});

describe('guestGroupSchema', () => {
  it('accepts a valid group', () => {
    expect(guestGroupSchema.safeParse({ name: 'Khan Family', maxAttendees: 6 }).success).toBe(true);
  });
  it('rejects an empty name', () => {
    expect(guestGroupSchema.safeParse({ name: '', maxAttendees: 6 }).success).toBe(false);
  });
});

describe('guestEventsSchema', () => {
  it('accepts event permissions with optional seat caps', () => {
    const parsed = guestEventsSchema.safeParse({
      permissions: [
        { eventId: '11111111-1111-1111-1111-111111111111', allowedAttendees: 2 },
        { eventId: '22222222-2222-2222-2222-222222222222', allowedAttendees: null },
      ],
    });
    expect(parsed.success).toBe(true);
  });
  it('rejects a non-uuid event id', () => {
    expect(guestEventsSchema.safeParse({ permissions: [{ eventId: 'bogus' }] }).success).toBe(false);
  });
});

describe('parseGuestCsv', () => {
  const groups = [{ id: '11111111-1111-1111-1111-111111111111', name: 'Khan Family' }];
  const header = 'name,email,phone,category,max_attendees,group,notes,dietary_preferences,is_vip';

  it('maps rows to validated guests and matches groups by name', () => {
    const csv = `${header}\nAisha,a@example.com,+92300,family,3,Khan Family,,Vegetarian,true`;
    const { guests, errors } = parseGuestCsv(csv, groups);
    expect(errors).toEqual([]);
    expect(guests).toHaveLength(1);
    expect(guests[0]).toMatchObject({
      name: 'Aisha',
      email: 'a@example.com',
      category: 'family',
      maxAttendees: 3,
      groupId: '11111111-1111-1111-1111-111111111111',
      isVip: true,
    });
  });

  it('defaults blank category to other and unmatched group to null', () => {
    const csv = `${header}\nOmar,,,,,, , ,`;
    const { guests } = parseGuestCsv(csv, groups);
    expect(guests[0]?.category).toBe('other');
    expect(guests[0]?.maxAttendees).toBe(1);
    expect(guests[0]?.groupId).toBeNull();
  });

  it('reports invalid rows without importing them', () => {
    const csv = `${header}\nValid,v@example.com,,friend,1,,,,\n,bad-email,,friend,1,,,,`;
    const { guests, errors } = parseGuestCsv(csv, groups);
    expect(guests).toHaveLength(1);
    expect(guests[0]?.name).toBe('Valid');
    expect(errors).toHaveLength(1);
    expect(errors[0]?.row).toBe(3);
  });

  it('returns nothing for a header-only or empty file', () => {
    expect(parseGuestCsv(header, groups).guests).toEqual([]);
    expect(parseGuestCsv('', groups).guests).toEqual([]);
  });
});