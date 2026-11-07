import { z } from 'zod';
import { parseCsv } from '@/lib/csv';

/** Mirrors the guest_category DB enum (0012). */
export const guestCategories = ['family', 'friend', 'colleague', 'vip', 'relative', 'other'] as const;
export type GuestCategory = (typeof guestCategories)[number];

export const guestCategoryLabels: Record<GuestCategory, string> = {
  family: 'Family',
  friend: 'Friend',
  colleague: 'Colleague',
  vip: 'VIP',
  relative: 'Relative',
  other: 'Other',
};

export const guestSchema = z.object({
  name: z.string().min(1, 'errors.required').max(160),
  email: z.string().email('errors.invalidEmail').max(254).nullish(),
  phone: z.string().max(40).nullish(),
  category: z.enum(guestCategories),
  maxAttendees: z.number().int().min(1).max(100),
  groupId: z.string().uuid().nullish(),
  notes: z.string().max(2000).nullish(),
  dietaryPreferences: z.string().max(500).nullish(),
  isVip: z.boolean(),
});
export type GuestInput = z.infer<typeof guestSchema>;

export const guestGroupSchema = z.object({
  name: z.string().min(1, 'errors.required').max(160),
  notes: z.string().max(2000).nullish(),
  maxAttendees: z.number().int().min(1).max(1000),
});
export type GuestGroupInput = z.infer<typeof guestGroupSchema>;

export const guestEventPermissionSchema = z.object({
  eventId: z.string().uuid(),
  allowedAttendees: z.number().int().min(1).max(100).nullish(),
});
export const guestEventsSchema = z.object({
  permissions: z.array(guestEventPermissionSchema).max(100),
});
export type GuestEventPermission = z.infer<typeof guestEventPermissionSchema>;

/** CSV column order used for guest import and export. First row must be these headers. */
export const guestCsvHeaders = [
  'name',
  'email',
  'phone',
  'category',
  'max_attendees',
  'group',
  'notes',
  'dietary_preferences',
  'is_vip',
] as const;

export type GuestCsvGroup = { id: string; name: string };
export type GuestCsvError = { row: number; message: string };

/**
 * Map CSV text to validated guest inputs. The first row is treated as headers. Unknown or
 * blank categories fall back to 'other'; the group column matches an existing group by name
 * (case-insensitive) and is left null when unmatched. Invalid rows are reported, not imported.
 */
export function parseGuestCsv(
  text: string,
  groups: GuestCsvGroup[],
): { guests: GuestInput[]; errors: GuestCsvError[] } {
  const rows = parseCsv(text);
  const guests: GuestInput[] = [];
  const errors: GuestCsvError[] = [];
  if (rows.length < 2) return { guests, errors };

  const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const groupByName = new Map(groups.map((g) => [g.name.trim().toLowerCase(), g.id]));

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const cell = (name: string): string => {
      const i = header.indexOf(name);
      return i >= 0 ? (row[i] ?? '').trim() : '';
    };
    const rawCategory = cell('category').toLowerCase();
    const category = (guestCategories as readonly string[]).includes(rawCategory)
      ? (rawCategory as GuestCategory)
      : 'other';
    const maxRaw = cell('max_attendees');
    const groupName = cell('group').toLowerCase();
    const vipRaw = cell('is_vip').toLowerCase();

    const parsed = guestSchema.safeParse({
      name: cell('name'),
      email: cell('email') || null,
      phone: cell('phone') || null,
      category,
      maxAttendees: maxRaw ? Number(maxRaw) : 1,
      groupId: groupName ? (groupByName.get(groupName) ?? null) : null,
      notes: cell('notes') || null,
      dietaryPreferences: cell('dietary_preferences') || null,
      isVip: vipRaw === 'true' || vipRaw === '1' || vipRaw === 'yes',
    });
    if (!parsed.success) {
      errors.push({ row: r + 1, message: parsed.error.issues[0]?.message ?? 'errors.generic' });
      continue;
    }
    guests.push(parsed.data);
  }
  return { guests, errors };
}