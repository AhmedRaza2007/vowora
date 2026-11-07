import type { WeddingEvent } from '@/types/database';
import { eventTypeLabels, type EventType } from '@/lib/validations/event';

function typeLabel(type: string): string {
  return eventTypeLabels[type as EventType] ?? type;
}

function formatDate(event: WeddingEvent, locale: string): string {
  return new Date(`${event.event_date}T00:00:00Z`).toLocaleDateString(locale, {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function timeRange(event: WeddingEvent): string | null {
  const start = event.start_time?.slice(0, 5);
  const end = event.end_time?.slice(0, 5);
  if (start && end) return `${start} – ${end}`;
  return start ?? end ?? null;
}

/** Public event cards for the wedding website Events section (chronological order). */
export function PublicEventList({ events, locale }: { events: WeddingEvent[]; locale: string }) {
  const tag = locale === 'ur' ? 'ur-PK' : 'en-US';
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {events.map((event) => {
        const time = timeRange(event);
        return (
          <article
            key={event.id}
            className="overflow-hidden rounded-2xl border border-black/10 bg-white/70 text-start shadow-sm backdrop-blur-sm"
          >
            {event.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element -- same-origin media proxy streams the original asset
              <img
                src={event.cover_image_url}
                alt={event.name}
                loading="lazy"
                className="h-44 w-full object-cover"
              />
            )}
            <div className="space-y-3 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--wedding-primary)] opacity-80">
                {typeLabel(event.event_type)}
              </p>
              <h3 className="font-display text-xl font-semibold tracking-tight">{event.name}</h3>
              <div className="space-y-1 text-sm opacity-90">
                <p className="font-medium">{formatDate(event, tag)}</p>
                {time && (
                  <p>
                    {time} · {event.timezone}
                  </p>
                )}
              </div>
              {event.venue_name && <p className="font-medium">{event.venue_name}</p>}
              {event.address && <p className="text-sm opacity-80">{event.address}</p>}
              {event.dress_code && (
                <p className="text-sm">
                  <span className="font-medium">Dress code:</span> {event.dress_code}
                </p>
              )}
              {event.description && (
                <p className="whitespace-pre-line text-sm leading-relaxed opacity-90">{event.description}</p>
              )}
              {event.instructions && (
                <p className="whitespace-pre-line text-sm leading-relaxed opacity-75">{event.instructions}</p>
              )}
              {event.maps_url && (
                <a
                  href={event.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--wedding-primary)] underline-offset-4 hover:underline"
                >
                  View map →
                </a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}