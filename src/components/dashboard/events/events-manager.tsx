'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CalendarDays, Clock, ExternalLink, MapPin, Pencil, Plus, Shirt, Trash2 } from 'lucide-react';
import { deleteEventAction } from '@/features/weddings/event-actions';
import { eventTypeLabels, type EventType } from '@/lib/validations/event';
import type { Wedding, WeddingEvent } from '@/types/database';
import { EventFormDialog } from './event-form-dialog';
import { EmptyState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function typeLabel(type: string): string {
  return eventTypeLabels[type as EventType] ?? type;
}

function formatDate(event: WeddingEvent, locale: string): string {
  return new Date(`${event.event_date}T00:00:00Z`).toLocaleDateString(locale, {
    timeZone: 'UTC',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function timeRange(event: WeddingEvent): string | null {
  const start = event.start_time?.slice(0, 5);
  const end = event.end_time?.slice(0, 5);
  if (start && end) return `${start} – ${end}`;
  return start ?? end ?? null;
}

function DeleteEventButton({ wedding, event }: { wedding: Wedding; event: WeddingEvent }) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    const data = new FormData();
    data.set('weddingId', wedding.id);
    data.set('eventId', event.id);
    startTransition(async () => {
      const res = await deleteEventAction(null, data);
      if (res.error) setError(res.error.startsWith('errors.') ? t(res.error) : res.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Delete ${event.name}`}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {event.name}?</DialogTitle>
          <DialogDescription>
            This permanently removes the event and any guest access to it. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? 'Deleting…' : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EventsManager({ wedding, events }: { wedding: Wedding; events: WeddingEvent[] }) {
  const locale = wedding.locale === 'ur' ? 'ur-PK' : 'en-US';
  const publicUrl = `/w/${wedding.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight">Events</h1>
            <Badge variant={wedding.status === 'published' ? 'success' : 'secondary'}>{wedding.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{wedding.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/weddings/${wedding.id}`}>Back</Link>
          </Button>
          {wedding.status === 'published' && (
            <Button asChild variant="outline" size="sm">
              <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> View live
              </Link>
            </Button>
          )}
          <EventFormDialog
            wedding={wedding}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" /> Add event
              </Button>
            }
          />
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add your ceremonies — Mehndi, Nikah, Walima or any custom event — with dates, venues and details."
          action={
            <EventFormDialog
              wedding={wedding}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" /> Add your first event
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => {
            const time = timeRange(event);
            return (
              <Card key={event.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Badge variant="gold" className="mb-2">
                        {typeLabel(event.event_type)}
                      </Badge>
                      <p className="truncate font-display text-lg font-semibold">{event.name}</p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <EventFormDialog
                        key={`${event.id}-${event.updated_at}`}
                        wedding={wedding}
                        event={event}
                        trigger={
                          <Button variant="ghost" size="sm" aria-label={`Edit ${event.name}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DeleteEventButton wedding={wedding} event={event} />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 shrink-0" />
                      {formatDate(event, locale)}
                    </p>
                    {time && (
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0" />
                        {time} · {event.timezone}
                      </p>
                    )}
                    {(event.venue_name || event.address) && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {[event.venue_name, event.address].filter(Boolean).join(' · ')}
                        </span>
                      </p>
                    )}
                    {event.dress_code && (
                      <p className="flex items-center gap-2">
                        <Shirt className="h-4 w-4 shrink-0" />
                        {event.dress_code}
                      </p>
                    )}
                  </div>

                  {event.maps_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={event.maps_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" /> Open map
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}