import { z } from 'zod';

/** Standard ceremony presets. event_type is free text so unlimited custom ceremonies work. */
export const eventTypes = [
  'mehndi',
  'nikah',
  'baraat',
  'walima',
  'reception',
  'engagement',
  'ceremony',
  'custom',
] as const;
export type EventType = (typeof eventTypes)[number];

export const eventTypeLabels: Record<EventType, string> = {
  mehndi: 'Mehndi',
  nikah: 'Nikah',
  baraat: 'Baraat',
  walima: 'Walima',
  reception: 'Reception',
  engagement: 'Engagement',
  ceremony: 'Ceremony',
  custom: 'Custom',
};

/** Only http(s) absolute URLs or same-origin root-relative paths (media proxy). */
function isSafeUrl(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'errors.required')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, 'errors.generic');

const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'errors.generic');
const safeUrl = z.string().max(2048).refine(isSafeUrl, 'errors.generic');

/** Full event payload. Optional fields accept null so a form save can clear them. */
export const eventSchema = z.object({
  name: z.string().min(1, 'errors.required').max(160),
  eventType: z.string().max(80).nullish(),
  description: z.string().max(2000).nullish(),
  eventDate: dateStr,
  startTime: timeStr.nullish(),
  endTime: timeStr.nullish(),
  timezone: z.string().min(1).max(80),
  venueName: z.string().max(200).nullish(),
  address: z.string().max(500).nullish(),
  mapsUrl: safeUrl.nullish(),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  coverImageUrl: safeUrl.nullish(),
  dressCode: z.string().max(200).nullish(),
  instructions: z.string().max(2000).nullish(),
});
export type EventInput = z.infer<typeof eventSchema>;