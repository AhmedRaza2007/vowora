import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { WeddingEvent } from '@/types/database';

/** Events for a wedding, ordered chronologically. RLS scopes rows to members. */
export async function getEvents(weddingId: string): Promise<WeddingEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('event_date', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WeddingEvent[];
}