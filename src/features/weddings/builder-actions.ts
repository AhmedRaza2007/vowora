'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import {
  createSectionSchema,
  designConfigSchema,
  reorderSectionsSchema,
  seoConfigSchema,
  updateSectionSchema,
} from '@/lib/validations/builder';

export type BuilderResult = { error: string | null };

const idSchema = z.string().uuid();

function readId(formData: FormData, key: string): string | null {
  const parsed = idSchema.safeParse(formData.get(key));
  return parsed.success ? parsed.data : null;
}

function revalidate(weddingId: string) {
  revalidatePath(`/dashboard/weddings/${weddingId}`, 'layout');
  revalidatePath('/w/[slug]', 'page');
}

export async function updateDesignAction(_: unknown, formData: FormData): Promise<BuilderResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  if (!weddingId) return { error: 'errors.generic' };

  const parsed = designConfigSchema.safeParse({
    primaryColor: formData.get('primaryColor') || undefined,
    accentColor: formData.get('accentColor') || undefined,
    backgroundColor: formData.get('backgroundColor') || undefined,
    textColor: formData.get('textColor') || undefined,
    headingFont: formData.get('headingFont') || undefined,
    bodyFont: formData.get('bodyFont') || undefined,
    invitationMessage: formData.get('invitationMessage') || undefined,
    musicUrl: formData.get('musicUrl') || undefined,
  });
  if (!parsed.success) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('weddings')
    .update({ design_config: parsed.data })
    .eq('id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

export async function updateSeoAction(_: unknown, formData: FormData): Promise<BuilderResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  if (!weddingId) return { error: 'errors.generic' };

  const parsed = seoConfigSchema.safeParse({
    title: formData.get('title') || undefined,
    description: formData.get('description') || undefined,
  });
  if (!parsed.success) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase.from('weddings').update({ seo_config: parsed.data }).eq('id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

export async function selectTemplateAction(_: unknown, formData: FormData): Promise<BuilderResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const templateId = readId(formData, 'templateId');
  if (!weddingId || !templateId) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { data: template } = await supabase
    .from('templates')
    .select('id')
    .eq('id', templateId)
    .eq('is_active', true)
    .single();
  if (!template) return { error: 'errors.generic' };

  const { error } = await supabase.from('weddings').update({ template_id: templateId }).eq('id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

export async function addSectionAction(_: unknown, formData: FormData): Promise<BuilderResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  if (!weddingId) return { error: 'errors.generic' };

  const parsed = createSectionSchema.safeParse({ type: formData.get('type') });
  if (!parsed.success) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { data: last } = await supabase
    .from('wedding_sections')
    .select('sort_order')
    .eq('wedding_id', weddingId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('wedding_sections').insert({
    wedding_id: weddingId,
    type: parsed.data.type,
    title: null,
    content: {},
    is_enabled: true,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

export async function updateSectionAction(_: unknown, formData: FormData): Promise<BuilderResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const sectionId = readId(formData, 'sectionId');
  if (!weddingId || !sectionId) return { error: 'errors.generic' };

  let content: unknown = undefined;
  const rawContent = formData.get('content');
  if (typeof rawContent === 'string' && rawContent.length > 0) {
    try {
      content = JSON.parse(rawContent);
    } catch {
      return { error: 'errors.generic' };
    }
  }

  const parsed = updateSectionSchema.safeParse({
    title: formData.get('title') ?? undefined,
    content,
    is_enabled: formData.get('is_enabled') === null ? undefined : formData.get('is_enabled') === 'true',
  });
  if (!parsed.success) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('wedding_sections')
    .update(parsed.data)
    .eq('id', sectionId)
    .eq('wedding_id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

export async function deleteSectionAction(_: unknown, formData: FormData): Promise<BuilderResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const sectionId = readId(formData, 'sectionId');
  if (!weddingId || !sectionId) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('wedding_sections')
    .delete()
    .eq('id', sectionId)
    .eq('wedding_id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

export async function reorderSectionsAction(_: unknown, formData: FormData): Promise<BuilderResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  if (!weddingId) return { error: 'errors.generic' };

  let ids: unknown;
  try {
    ids = JSON.parse(String(formData.get('ids') ?? '[]'));
  } catch {
    return { error: 'errors.generic' };
  }
  const parsed = reorderSectionsSchema.safeParse({ ids });
  if (!parsed.success) return { error: 'errors.generic' };

  const supabase = await createClient();
  for (let index = 0; index < parsed.data.ids.length; index++) {
    const { error } = await supabase
      .from('wedding_sections')
      .update({ sort_order: index })
      .eq('id', parsed.data.ids[index])
      .eq('wedding_id', weddingId);
    if (error) return { error: 'errors.generic' };
  }
  revalidate(weddingId);
  return { error: null };
}

export async function publishWeddingAction(_: unknown, formData: FormData): Promise<BuilderResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  if (!weddingId) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('weddings')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

export async function unpublishWeddingAction(_: unknown, formData: FormData): Promise<BuilderResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  if (!weddingId) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase.from('weddings').update({ status: 'unpublished' }).eq('id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}