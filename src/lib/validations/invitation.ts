import { z } from 'zod';
import { animationVariants, cardBorderStyles, waxSealStyles } from '@/features/invitations/theme';

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'errors.generic')
  .optional();
const font = z.string().max(80).optional();

/** Per-wedding invitation customization stored in weddings.invitation_config. */
export const invitationConfigSchema = z.object({
  primaryColor: hexColor,
  accentColor: hexColor,
  backgroundColor: hexColor,
  textColor: hexColor,
  envelopeColor: hexColor,
  envelopeLiner: hexColor,
  headingFont: font,
  bodyFont: font,
  waxSeal: z.enum(waxSealStyles).optional(),
  cardBorder: z.enum(cardBorderStyles).optional(),
  animation: z.enum(animationVariants).optional(),
  introMessage: z.string().max(2000).optional(),
  musicUrl: z.string().max(2048).optional(),
});
export type InvitationConfigInput = z.infer<typeof invitationConfigSchema>;

/** Couple names + monogram shown on the envelope and invitation card. */
export const updateCoupleSchema = z.object({
  partnerOneName: z.string().min(1, 'errors.required').max(120),
  partnerTwoName: z.string().min(1, 'errors.required').max(120),
  coupleInitials: z.string().max(8).optional(),
});
export type UpdateCoupleInput = z.infer<typeof updateCoupleSchema>;