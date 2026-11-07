'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import {
  guestSchema,
  guestGroupSchema,
  guestEventsSchema,
  parseGuestCsv,
  type GuestInput,
  type GuestEventPermission,
} from '@/lib/validations/guest';

export type GuestResult = { error: string | null };
export type ImportResult = { error: string | null; imported: number; skipped: number };

type Client = Awaited<ReturnType<typeof createClient>>;

const idSchema = z.string().uuid();

function readId(formData: FormData, key: string): string | null {
  const parsed = idSchema.safeParse(formData.get(key));
  return parsed.success ? parsed.data : null;
}

function revalidate(weddingId: string) {
  revalidatePath(`/dashboard/weddings/${weddingId}`, 'layout');
  revalidatePath('/i/[token]', 'page');
}

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function num(formData: FormData, key: string): number | null {
  const value = text(formData, key);
  return value === null ? null : Number(value);
}

/** The DB enforce_guest_limit trigger raises 42501 when the plan's guest cap is reached. */
function dbError(code: string | undefined): string {
  return code === '42501' ? 'errors.limitReached' : 'errors.generic';
}

function readGuest(formData: FormData) {
  return {
    name: text(formData, 'name') ?? '',
    email: text(formData, 'email'),
    phone: text(formData, 'phone'),
    category: text(formData, 'category') ?? 'other',
    maxAttendees: num(formData, 'maxAttendees') ?? 1,
    groupId: text(formData, 'groupId'),
    notes: text(formData, 'notes'),
    dietaryPreferences: text(formData, 'dietaryPreferences'),
    isVip: formData.get('isVip') === 'true',
  };
}

function readPermissions(formData: FormData): GuestEventPermission[] | null {
  const raw = formData.get('permissions');
  if (typeof raw !== 'string' || raw.length === 0) return [];
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = guestEventsSchema.safeParse(json);
  return parsed.success ? parsed.data.permissions : null;
}

function toGuestRow(parsed: GuestInput) {
  return {
    name: parsed.name,
    email: parsed.email ?? null,
    phone: parsed.phone ?? null,
    category: parsed.category,
    max_attendees: parsed.maxAttendees,
    group_id: parsed.groupId ?? null,
    notes: parsed.notes ?? null,
    dietary_preferences: parsed.dietaryPreferences ?? null,
    is_vip: parsed.isVip,
  };
}

/** Ensure a group belongs to this wedding before linking a guest to it. */
async function groupBelongsTo(supabase: Client, weddingId: string, groupId: string): Promise<boolean> {
  const { data } = await supabase
    .from('guest_groups')
    .select('id')
    .eq('id', groupId)
    .eq('wedding_id', weddingId)
    .maybeSingle();
  return Boolean(data);
}

/** Replace a guest's event authorizations. Validates events belong to the wedding first. */
async function applyGuestEvents(
  supabase: Client,
  weddingId: string,
  guestId: string,
  permissions: GuestEventPermission[],
): Promise<string | null> {
  const ids = permissions.map((p) => p.eventId);
  if (new Set(ids).size !== ids.length) return 'errors.generic';
  if (ids.length > 0) {
    const { data: events, error } = await supabase
      .from('events')
      .select('id')
      .eq('wedding_id', weddingId)
      .in('id', ids);
    if (error || (events?.length ?? 0) !== ids.length) return 'errors.generic';
  }
  const { error: deleteError } = await supabase
    .from('guest_events')
    .delete()
    .eq('guest_id', guestId)
    .eq('wedding_id', weddingId);
  if (deleteError) return 'errors.generic';
  if (permissions.length > 0) {
    const { error: insertError } = await supabase.from('guest_events').insert(
      permissions.map((p) => ({
        guest_id: guestId,
        event_id: p.eventId,
        wedding_id: weddingId,
        allowed_attendees: p.allowedAttendees ?? null,
      })),
    );
    if (insertError) return 'errors.generic';
  }
  return null;
}

export async function createGuestAction(_: unknown, formData: FormData): Promise<GuestResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  if (!weddingId) return { error: 'errors.generic' };

  const parsed = guestSchema.safeParse(readGuest(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.generic' };
  const permissions = readPermissions(formData);
  if (permissions === null) return { error: 'errors.generic' };

  const supabase = await createClient();
  if (parsed.data.groupId && !(await groupBelongsTo(supabase, weddingId, parsed.data.groupId))) {
    return { error: 'errors.generic' };
  }

  const { data: guest, error } = await supabase
    .from('guests')
    .insert({ ...toGuestRow(parsed.data), wedding_id: weddingId })
    .select('id')
    .single();
  if (error || !guest) return { error: dbError(error?.code) };

  const permissionError = await applyGuestEvents(supabase, weddingId, guest.id, permissions);
  if (permissionError) return { error: permissionError };
  revalidate(weddingId);
  return { error: null };
}

export async function updateGuestAction(_: unknown, formData: FormData): Promise<GuestResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const guestId = readId(formData, 'guestId');
  if (!weddingId || !guestId) return { error: 'errors.generic' };

  const parsed = guestSchema.safeParse(readGuest(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.generic' };
  const permissions = readPermissions(formData);
  if (permissions === null) return { error: 'errors.generic' };

  const supabase = await createClient();
  if (parsed.data.groupId && !(await groupBelongsTo(supabase, weddingId, parsed.data.groupId))) {
    return { error: 'errors.generic' };
  }

  const { data: guest, error } = await supabase
    .from('guests')
    .update(toGuestRow(parsed.data))
    .eq('id', guestId)
    .eq('wedding_id', weddingId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (error) return { error: dbError(error.code) };
  if (!guest) return { error: 'errors.generic' };

  const permissionError = await applyGuestEvents(supabase, weddingId, guestId, permissions);
  if (permissionError) return { error: permissionError };
  revalidate(weddingId);
  return { error: null };
}

/** Soft delete: the get_invitation RPC returns null for deleted guests, invalidating links. */
export async function deleteGuestAction(_: unknown, formData: FormData): Promise<GuestResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const guestId = readId(formData, 'guestId');
  if (!weddingId || !guestId) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('guests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', guestId)
    .eq('wedding_id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

export async function createGroupAction(_: unknown, formData: FormData): Promise<GuestResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  if (!weddingId) return { error: 'errors.generic' };

  const parsed = guestGroupSchema.safeParse({
    name: text(formData, 'name') ?? '',
    notes: text(formData, 'notes'),
    maxAttendees: num(formData, 'maxAttendees') ?? 1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase.from('guest_groups').insert({
    wedding_id: weddingId,
    name: parsed.data.name,
    notes: parsed.data.notes ?? null,
    max_attendees: parsed.data.maxAttendees,
  });
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

export async function updateGroupAction(_: unknown, formData: FormData): Promise<GuestResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const groupId = readId(formData, 'groupId');
  if (!weddingId || !groupId) return { error: 'errors.generic' };

  const parsed = guestGroupSchema.safeParse({
    name: text(formData, 'name') ?? '',
    notes: text(formData, 'notes'),
    maxAttendees: num(formData, 'maxAttendees') ?? 1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('guest_groups')
    .update({
      name: parsed.data.name,
      notes: parsed.data.notes ?? null,
      max_attendees: parsed.data.maxAttendees,
    })
    .eq('id', groupId)
    .eq('wedding_id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

export async function deleteGroupAction(_: unknown, formData: FormData): Promise<GuestResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const groupId = readId(formData, 'groupId');
  if (!weddingId || !groupId) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('guest_groups')
    .delete()
    .eq('id', groupId)
    .eq('wedding_id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}

/** Bulk import from CSV. Pre-checks the plan guest cap for clean all-or-nothing semantics. */
export async function importGuestsAction(_: unknown, formData: FormData): Promise<ImportResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const csv = formData.get('csv');
  if (!weddingId || typeof csv !== 'string' || csv.trim().length === 0) {
    return { error: 'errors.generic', imported: 0, skipped: 0 };
  }

  const supabase = await createClient();
  const { data: groups } = await supabase
    .from('guest_groups')
    .select('id, name')
    .eq('wedding_id', weddingId);
  const { guests, errors } = parseGuestCsv(csv, (groups ?? []) as { id: string; name: string }[]);
  if (guests.length === 0) {
    return { error: errors.length > 0 ? 'errors.generic' : null, imported: 0, skipped: errors.length };
  }

  const { data: limitData } = await supabase.rpc('feature_limit', { w: weddingId, feature: 'max_guests' });
  const limit = typeof limitData === 'string' && /^\d+$/.test(limitData) ? Number(limitData) : null;
  if (limit !== null) {
    const { count } = await supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('wedding_id', weddingId)
      .is('deleted_at', null);
    if ((count ?? 0) + guests.length > limit) {
      return { error: 'errors.limitReached', imported: 0, skipped: guests.length + errors.length };
    }
  }

  const { error } = await supabase
    .from('guests')
    .insert(guests.map((g) => ({ ...toGuestRow(g), wedding_id: weddingId })));
  if (error) return { error: dbError(error.code), imported: 0, skipped: guests.length + errors.length };
  revalidate(weddingId);
  return { error: null, imported: guests.length, skipped: errors.length };
}