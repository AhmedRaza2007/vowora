import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Profile, Wedding, Template, SubscriptionPlan, AdminActivityLog } from '@/types/database';

export type AdminOverview = {
  customers: number;
  weddings: number;
  publishedWeddings: number;
  templates: number;
  plans: number;
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createClient();
  const [profiles, weddings, templates, plans] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('weddings').select('id, status', { count: 'exact' }).is('deleted_at', null),
    supabase.from('templates').select('id', { count: 'exact', head: true }),
    supabase.from('subscription_plans').select('id', { count: 'exact', head: true }),
  ]);

  const weddingRows = (weddings.data ?? []) as Pick<Wedding, 'id' | 'status'>[];
  return {
    customers: profiles.count ?? 0,
    weddings: weddings.count ?? weddingRows.length,
    publishedWeddings: weddingRows.filter((w) => w.status === 'published').length,
    templates: templates.count ?? 0,
    plans: plans.count ?? 0,
  };
}

export async function getCustomers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  return (data ?? []) as Profile[];
}

export async function getAdminWeddings(): Promise<Wedding[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('weddings')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  return (data ?? []) as Wedding[];
}

export async function getTemplates(): Promise<Template[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('templates').select('*').order('sort_order');
  return (data ?? []) as Template[];
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('subscription_plans').select('*').order('tier');
  return (data ?? []) as SubscriptionPlan[];
}

export async function getActivityLogs(): Promise<AdminActivityLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('admin_activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  return (data ?? []) as AdminActivityLog[];
}