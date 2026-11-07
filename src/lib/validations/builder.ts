import { z } from 'zod';

export const sectionTypes = [
  'hero',
  'couple_intro',
  'family_intro',
  'story',
  'events',
  'countdown',
  'venue',
  'photo_gallery',
  'video_gallery',
  'dress_code',
  'invitation_message',
  'rsvp',
  'gift_registry',
  'wishes',
  'contact',
] as const;

export const sectionTypeSchema = z.enum(sectionTypes);

const color = z.string().max(32).optional();
const font = z.string().max(80).optional();

/** Website design configuration stored in weddings.design_config (public-facing). */
export const designConfigSchema = z.object({
  primaryColor: color,
  accentColor: color,
  backgroundColor: color,
  textColor: color,
  headingFont: font,
  bodyFont: font,
  invitationMessage: z.string().max(2000).optional(),
  musicUrl: z.string().max(2048).optional(),
});
export type DesignConfigInput = z.infer<typeof designConfigSchema>;

export const updateSectionSchema = z.object({
  title: z.string().max(160).nullable().optional(),
  content: z.record(z.string(), z.union([z.string().max(5000), z.number(), z.boolean()])).optional(),
  is_enabled: z.boolean().optional(),
});

export const createSectionSchema = z.object({
  type: sectionTypeSchema,
});

export const reorderSectionsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
});

export const seoConfigSchema = z.object({
  title: z.string().max(160).optional(),
  description: z.string().max(320).optional(),
});