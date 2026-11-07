import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Template, Wedding, WeddingSection, WeddingTheme } from '@/types/database';

/** Wedding readable by the current user (RLS filters to memberships), or null. */
export async function getWeddingForBuilder(id: string): Promise<Wedding | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('weddings').select('*').eq('id', id).is('deleted_at', null).single();
  return (data as Wedding) ?? null;
}

export async function getSections(weddingId: string): Promise<WeddingSection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wedding_sections')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WeddingSection[];
}

export async function getTemplates(): Promise<Template[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return (data ?? []) as Template[];
}

export async function getThemes(): Promise<WeddingTheme[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('wedding_themes')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  return (data ?? []) as WeddingTheme[];
}