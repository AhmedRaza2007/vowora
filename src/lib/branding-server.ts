import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import { defaultBranding, type Branding } from '@/lib/branding';
import type { Json } from '@/types/database';

/**
 * Reads runtime branding from platform_settings. Falls back to defaults when Supabase is
 * not configured or a key is absent, so the app renders before setup completes.
 */
export async function getBranding(): Promise<Branding> {
  if (!isSupabaseConfigured()) return defaultBranding;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['brand_name', 'brand_tagline', 'brand_logo_url', 'support_email', 'primary_color']);

    const map = new Map<string, Json>((data ?? []).map((row) => [row.key, row.value]));
    const str = (key: string, fallback: string) => {
      const v = map.get(key);
      return typeof v === 'string' && v.length > 0 ? v : fallback;
    };

    return {
      name: str('brand_name', defaultBranding.name),
      tagline: str('brand_tagline', defaultBranding.tagline),
      logoUrl: (map.get('brand_logo_url') as string) ?? defaultBranding.logoUrl,
      supportEmail: str('support_email', defaultBranding.supportEmail),
      primaryColor: (map.get('primary_color') as string) ?? defaultBranding.primaryColor,
    };
  } catch {
    return defaultBranding;
  }
}