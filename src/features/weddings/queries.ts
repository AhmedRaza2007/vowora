import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Wedding } from '@/types/database';

/** Weddings visible to the current user (RLS filters to memberships). */
export async function getMyWeddings(): Promise<Wedding[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('weddings')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Wedding[];
}

export type DashboardStats = {
  totalWeddings: number;
  publishedWeddings: number;
  draftWeddings: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const weddings = await getMyWeddings();
  return {
    totalWeddings: weddings.length,
    publishedWeddings: weddings.filter((w) => w.status === 'published').length,
    draftWeddings: weddings.filter((w) => w.status === 'draft').length,
  };
}