import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import type { Json, WeddingEvent, WeddingSection, WeddingTheme } from '@/types/database';

/** Public projection returned by the get_published_wedding RPC (no guest/private data). */
export interface PublishedWedding {
  id: string;
  slug: string;
  title: string;
  partner_one_name: string;
  partner_two_name: string;
  couple_initials: string | null;
  wedding_date: string | null;
  timezone: string;
  locale: string;
  design_config: Json;
  seo_config: Json;
  invitation_config: Json;
  published_at: string | null;
  theme: WeddingTheme | null;
  sections: WeddingSection[];
  events: WeddingEvent[];
}

/** An event the invited guest is authorized for, with their per-event seat cap. */
export interface InvitationEvent extends WeddingEvent {
  allowed_attendees: number;
}

/**
 * Personalized projection returned by get_invitation: the public wedding plus this guest's
 * name, only the events they are authorized for, and the token expiry. No private contact
 * details of any guest are ever included.
 */
export interface PublishedInvitation extends Omit<PublishedWedding, 'events'> {
  guest: { name: string; max_attendees: number };
  events: InvitationEvent[];
  invitation: { expires_at: string | null };
}

/** Loads a published wedding website via the public RPC. Returns null if not published. */
export async function getPublishedWedding(slug: string): Promise<PublishedWedding | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_published_wedding', { p_slug: slug });
  if (error || !data) return null;
  return data as unknown as PublishedWedding;
}