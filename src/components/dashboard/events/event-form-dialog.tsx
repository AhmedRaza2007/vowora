'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { createEventAction, updateEventAction } from '@/features/weddings/event-actions';
import { eventTypeLabels, eventTypes } from '@/lib/validations/event';
import type { Wedding, WeddingEvent } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type FormState = {
  name: string;
  eventType: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  venueName: string;
  address: string;
  mapsUrl: string;
  lat: string;
  lng: string;
  coverImageUrl: string;
  dressCode: string;
  instructions: string;
};

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function emptyForm(wedding: Wedding): FormState {
  return {
    name: '',
    eventType: 'custom',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    timezone: wedding.timezone,
    venueName: '',
    address: '',
    mapsUrl: '',
    lat: '',
    lng: '',
    coverImageUrl: '',
    dressCode: '',
    instructions: '',
  };
}

function toForm(event: WeddingEvent): FormState {
  return {
    name: event.name,
    eventType: event.event_type,
    description: event.description ?? '',
    eventDate: event.event_date,
    startTime: (event.start_time ?? '').slice(0, 5),
    endTime: (event.end_time ?? '').slice(0, 5),
    timezone: event.timezone,
    venueName: event.venue_name ?? '',
    address: event.address ?? '',
    mapsUrl: event.maps_url ?? '',
    lat: event.lat?.toString() ?? '',
    lng: event.lng?.toString() ?? '',
    coverImageUrl: event.cover_image_url ?? '',
    dressCode: event.dress_code ?? '',
    instructions: event.instructions ?? '',
  };
}

export function EventFormDialog({
  wedding,
  event,
  trigger,
}: {
  wedding: Wedding;
  event?: WeddingEvent;
  trigger: ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => (event ? toForm(event) : emptyForm(wedding)));

  function setField<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = new FormData();
    data.set('weddingId', wedding.id);
    if (event) data.set('eventId', event.id);
    for (const [key, value] of Object.entries(form)) data.set(key, value);
    startTransition(async () => {
      const res = await (event ? updateEventAction : createEventAction)(null, data);
      if (res.error) setError(res.error.startsWith('errors.') ? t(res.error) : res.error);
      else {
        setError(null);
        setOpen(false);
        router.refresh();
      }
    });
  }

  const canSubmit = form.name.trim().length > 0 && form.eventDate.length > 0 && !pending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit event' : 'Add event'}</DialogTitle>
          <DialogDescription>
            Ceremonies appear on your wedding website in date order. Guests only see the events
            you invite them to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event name</Label>
              <Input
                id="event-name"
                value={form.name}
                placeholder="Nikah Ceremony"
                onChange={(e) => setField('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-type">Type</Label>
              <select
                id="event-type"
                className={selectClass}
                value={form.eventType}
                onChange={(e) => setField('eventType', e.target.value)}
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {eventTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                value={form.eventDate}
                onChange={(e) => setField('eventDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-timezone">Timezone</Label>
              <Input
                id="event-timezone"
                value={form.timezone}
                placeholder="Asia/Karachi"
                onChange={(e) => setField('timezone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-start">Start time</Label>
              <Input
                id="event-start"
                type="time"
                value={form.startTime}
                onChange={(e) => setField('startTime', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">End time</Label>
              <Input
                id="event-end"
                type="time"
                value={form.endTime}
                onChange={(e) => setField('endTime', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-venue">Venue name</Label>
              <Input
                id="event-venue"
                value={form.venueName}
                placeholder="Grand Ballroom"
                onChange={(e) => setField('venueName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-dress">Dress code</Label>
              <Input
                id="event-dress"
                value={form.dressCode}
                placeholder="Formal / Traditional"
                onChange={(e) => setField('dressCode', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-address">Address</Label>
            <Input
              id="event-address"
              value={form.address}
              placeholder="Street, city"
              onChange={(e) => setField('address', e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-maps">Maps URL</Label>
              <Input
                id="event-maps"
                value={form.mapsUrl}
                placeholder="https://maps.google.com/…"
                onChange={(e) => setField('mapsUrl', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-cover">Cover image URL</Label>
              <Input
                id="event-cover"
                value={form.coverImageUrl}
                placeholder="https://… or /api/media/…"
                onChange={(e) => setField('coverImageUrl', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-lat">Latitude (optional)</Label>
              <Input
                id="event-lat"
                type="number"
                step="any"
                value={form.lat}
                placeholder="24.8607"
                onChange={(e) => setField('lat', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-lng">Longitude (optional)</Label>
              <Input
                id="event-lng"
                type="number"
                step="any"
                value={form.lng}
                placeholder="67.0011"
                onChange={(e) => setField('lng', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              rows={2}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-instructions">Guest instructions</Label>
            <Textarea
              id="event-instructions"
              rows={2}
              value={form.instructions}
              placeholder="Arrival time, parking, seating…"
              onChange={(e) => setField('instructions', e.target.value)}
            />
          </div>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {event ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}