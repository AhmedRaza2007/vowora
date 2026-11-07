'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { eventSchema, type EventInput } from '@/lib/validations/event';

export type EventResult = { error: string | null };

const idSchema = z.string().uuid();

function readId(formData: FormData, key: string): string | null {
  const parsed = idSchema.safeParse(formData.get(key));
  return parsed.success ? parsed.data : null;
}

function revalidate(weddingId: string) {
  revalidatePath(`/dashboard/weddings/${weddingId}`, 'layout');
  revalidatePath('/w/[slug]', 'page');
  revalidatePath('/i/[token]', 'page');
}

/** Trimmed text, or null when absent/empty so a full-form save can clear optional fields. */
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

function readEvent(formData: FormData): EventInput {
  return {
    name: text(formData, 'name') ?? '',
    eventType: text(formData, 'eventType'),
    description: text(formData, 'description'),
    eventDate: text(formData, 'eventDate') ?? '',
    startTime: text(formData, 'startTime'),
    endTime: text(formData, 'endTime'),
    timezone: text(formData, 'timezone') ?? 'UTC',
    venueName: text(formData, 'venueName'),
    address: text(formData, 'address'),
    mapsUrl: text(formData, 'mapsUrl'),
    lat: num(formData, 'lat'),
    lng: num(formData, 'lng'),
    coverImageUrl: text(formData, 'coverImageUrl'),
    dressCode: text(formData, 'dressCode'),
    instructions: text(formData, 'instructions'),
  };
}

/** Map a parsed event to the events row columns (null clears optional fields). */
function toRow(parsed: EventInput) {
  return {
    name: parsed.name,
    event_type: parsed.eventType ?? 'custom',
    description: parsed.description ?? null,
    event_date: parsed.eventDate,
    start_time: parsed.startTime ?? null,
    end_time: parsed.endTime ?? null,
    timezone: parsed.timezone,
    venue_name: parsed.venueName ?? null,
    address: parsed.address ?? null,
    maps_url: parsed.mapsUrl ?? null,
    lat: parsed.lat ?? null,
    lng: parsed.lng ?? null,
    cover_image_url: parsed.coverImageUrl ?? null,
    dress_code: parsed.dressCode ?? null,
    instructions: parsed.instructions ?? null,
  };
}

/** The DB enforce_event_limit trigger raises 42501 when the plan's event cap is reached. */
function dbError(code: string | undefined): string {
  return code === '42501' ? 'errors.limitReached' : 'errors.generic';
}

export async function createEventAction(_: unknown, formData: FormData): Promise<EventResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  if (!weddingId) return { error: 'errors.generic' };

  const parsed = eventSchema.safeParse(readEvent(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.generic' };

  const supabase = await createClient();
  const { data: last } = await supabase
    .from('events')
    .select('sort_order')
    .eq('wedding_id', weddingId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('events').insert({
    ...toRow(parsed.data),
    wedding_id: weddingId,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) return { error: dbError(error.code) };
  revalidate(weddingId);
  return { error: null };
}

export async function updateEventAction(_: unknown, formData: FormData): Promise<EventResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const eventId = readId(formData, 'eventId');
  if (!weddingId || !eventId) return { error: 'errors.generic' };

  const parsed = eventSchema.safeParse(readEvent(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('events')
    .update(toRow(parsed.data))
    .eq('id', eventId)
    .eq('wedding_id', weddingId);
  if (error) return { error: dbError(error.code) };
  revalidate(weddingId);
  return { error: null };
}

export async function deleteEventAction(_: unknown, formData: FormData): Promise<EventResult> {
  await requireUser('/dashboard');
  const weddingId = readId(formData, 'weddingId');
  const eventId = readId(formData, 'eventId');
  if (!weddingId || !eventId) return { error: 'errors.generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('wedding_id', weddingId);
  if (error) return { error: 'errors.generic' };
  revalidate(weddingId);
  return { error: null };
}