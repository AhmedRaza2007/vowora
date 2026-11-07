import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Guest, GuestEvent, GuestGroup } from '@/types/database';

/** Non-deleted guests for a wedding, alphabetical. RLS scopes rows to members. */
export async function getGuests(weddingId: string): Promise<Guest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('wedding_id', weddingId)
    .is('deleted_at', null)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Guest[];
}

export async function getGuestGroups(weddingId: string): Promise<GuestGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('guest_groups')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as GuestGroup[];
}

/** All guest→event authorizations for a wedding (used to show each guest's event access). */
export async function getGuestEvents(weddingId: string): Promise<GuestEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('guest_events').select('*').eq('wedding_id', weddingId);
  if (error) throw new Error(error.message);
  return (data ?? []) as GuestEvent[];
}