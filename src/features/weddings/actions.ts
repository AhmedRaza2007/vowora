'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { createWeddingSchema, buildWeddingSlug } from '@/lib/validations/wedding';
import { DEFAULT_SECTIONS } from './section-defaults';

export type CreateWeddingResult = { error: string | null };

export async function createWeddingAction(
  _: unknown,
  formData: FormData,
): Promise<CreateWeddingResult> {
  const user = await requireUser('/dashboard/weddings');

  const parsed = createWeddingSchema.safeParse({
    title: formData.get('title'),
    partnerOneName: formData.get('partnerOneName'),
    partnerTwoName: formData.get('partnerTwoName'),
    weddingDate: formData.get('weddingDate') || undefined,
    timezone: formData.get('timezone') || 'UTC',
    currency: formData.get('currency') || 'USD',
    locale: formData.get('locale') || 'en',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'errors.generic' };
  }

  const supabase = await createClient();
  const input = parsed.data;
  const slug = buildWeddingSlug(input.partnerOneName, input.partnerTwoName);

  const { data, error } = await supabase
    .from('weddings')
    .insert({
      created_by: user.id,
      slug,
      title: input.title,
      partner_one_name: input.partnerOneName,
      partner_two_name: input.partnerTwoName,
      wedding_date: input.weddingDate ?? null,
      timezone: input.timezone,
      currency: input.currency,
      locale: input.locale,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) return { error: 'errors.generic' };

  await supabase.from('wedding_sections').insert(
    DEFAULT_SECTIONS.map((s, index) => ({
      wedding_id: data.id,
      type: s.type,
      title: s.title,
      content: s.content,
      is_enabled: s.is_enabled,
      sort_order: index,
    })),
  );

  revalidatePath('/dashboard', 'layout');
  redirect(`/dashboard/weddings/${data.id}`);
}