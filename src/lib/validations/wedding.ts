import { z } from 'zod';

export const createWeddingSchema = z.object({
  title: z.string().min(2, 'errors.required').max(160),
  partnerOneName: z.string().min(1, 'errors.required').max(120),
  partnerTwoName: z.string().min(1, 'errors.required').max(120),
  weddingDate: z.string().optional(),
  timezone: z.string().min(1).default('UTC'),
  currency: z.string().length(3).default('USD'),
  locale: z.enum(['en', 'ur']).default('en'),
});
export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;

export const updateWeddingSchema = createWeddingSchema.partial();
export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;

/** Generate a URL-safe slug from couple names + a short random suffix (collision-resistant). */
export function buildWeddingSlug(one: string, two: string): string {
  const base = `${one} ${two}`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'wedding'}-${suffix}`;
}