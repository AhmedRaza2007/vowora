'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { createGuestAction, updateGuestAction } from '@/features/weddings/guest-actions';
import { guestCategories, guestCategoryLabels } from '@/lib/validations/guest';
import type { Guest, GuestEvent, GuestGroup, Wedding, WeddingEvent } from '@/types/database';
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
  email: string;
  phone: string;
  category: string;
  maxAttendees: string;
  groupId: string;
  isVip: boolean;
  notes: string;
  dietaryPreferences: string;
};

type PermState = Record<string, { enabled: boolean; allowed: string }>;

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function emptyForm(): FormState {
  return {
    name: '',
    email: '',
    phone: '',
    category: 'other',
    maxAttendees: '1',
    groupId: '',
    isVip: false,
    notes: '',
    dietaryPreferences: '',
  };
}

function toForm(guest: Guest): FormState {
  return {
    name: guest.name,
    email: guest.email ?? '',
    phone: guest.phone ?? '',
    category: guest.category,
    maxAttendees: String(guest.max_attendees),
    groupId: guest.group_id ?? '',
    isVip: guest.is_vip,
    notes: guest.notes ?? '',
    dietaryPreferences: guest.dietary_preferences ?? '',
  };
}

function initialPerms(events: WeddingEvent[], permissions: GuestEvent[]): PermState {
  const state: PermState = {};
  for (const event of events) {
    const match = permissions.find((p) => p.event_id === event.id);
    state[event.id] = {
      enabled: Boolean(match),
      allowed: match?.allowed_attendees ? String(match.allowed_attendees) : '',
    };
  }
  return state;
}

export function GuestFormDialog({
  wedding,
  groups,
  events,
  guest,
  permissions = [],
  trigger,
}: {
  wedding: Wedding;
  groups: GuestGroup[];
  events: WeddingEvent[];
  guest?: Guest;
  permissions?: GuestEvent[];
  trigger: ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => (guest ? toForm(guest) : emptyForm()));
  const [perms, setPerms] = useState<PermState>(() => initialPerms(events, permissions));

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleEvent(eventId: string, enabled: boolean) {
    setPerms((prev) => ({ ...prev, [eventId]: { enabled, allowed: prev[eventId]?.allowed ?? '' } }));
  }

  function setAllowed(eventId: string, allowed: string) {
    setPerms((prev) => ({ ...prev, [eventId]: { enabled: prev[eventId]?.enabled ?? false, allowed } }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = new FormData();
    data.set('weddingId', wedding.id);
    if (guest) data.set('guestId', guest.id);
    data.set('name', form.name);
    data.set('email', form.email);
    data.set('phone', form.phone);
    data.set('category', form.category);
    data.set('maxAttendees', form.maxAttendees);
    data.set('groupId', form.groupId);
    data.set('isVip', String(form.isVip));
    data.set('notes', form.notes);
    data.set('dietaryPreferences', form.dietaryPreferences);
    const selected = events
      .filter((event) => perms[event.id]?.enabled)
      .map((event) => ({
        eventId: event.id,
        allowedAttendees: perms[event.id]?.allowed ? Number(perms[event.id]?.allowed) : null,
      }));
    data.set('permissions', JSON.stringify({ permissions: selected }));

    startTransition(async () => {
      const res = await (guest ? updateGuestAction : createGuestAction)(null, data);
      if (res.error) setError(res.error.startsWith('errors.') ? t(res.error) : res.error);
      else {
        setError(null);
        setOpen(false);
        router.refresh();
      }
    });
  }

  const canSubmit = form.name.trim().length > 0 && !pending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{guest ? 'Edit guest' : 'Add guest'}</DialogTitle>
          <DialogDescription>
            Contact details stay private — only your wedding members can see them. Choose which
            events this guest is invited to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guest-name">Full name</Label>
              <Input id="guest-name" value={form.name} onChange={(e) => setField('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-category">Category</Label>
              <select
                id="guest-category"
                className={selectClass}
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
              >
                {guestCategories.map((category) => (
                  <option key={category} value={category}>
                    {guestCategoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-email">Email</Label>
              <Input
                id="guest-email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-phone">Phone / WhatsApp</Label>
              <Input id="guest-phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-max">Max attendees</Label>
              <Input
                id="guest-max"
                type="number"
                min={1}
                max={100}
                value={form.maxAttendees}
                onChange={(e) => setField('maxAttendees', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-group">Group / family</Label>
              <select
                id="guest-group"
                className={selectClass}
                value={form.groupId}
                onChange={(e) => setField('groupId', e.target.value)}
              >
                <option value="">No group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-dietary">Dietary preferences</Label>
              <Input
                id="guest-dietary"
                value={form.dietaryPreferences}
                placeholder="Vegetarian, halal…"
                onChange={(e) => setField('dietaryPreferences', e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 self-end pt-6 text-sm">
              <input
                type="checkbox"
                checked={form.isVip}
                onChange={(e) => setField('isVip', e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              VIP guest
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest-notes">Notes</Label>
            <Textarea id="guest-notes" rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
          </div>

          {events.length > 0 && (
            <div className="space-y-2">
              <Label>Event invitations</Label>
              <div className="space-y-2 rounded-md border p-3">
                {events.map((event) => {
                  const state = perms[event.id] ?? { enabled: false, allowed: '' };
                  return (
                    <div key={event.id} className="flex flex-wrap items-center gap-3">
                      <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={state.enabled}
                          onChange={(e) => toggleEvent(event.id, e.target.checked)}
                          className="h-4 w-4 rounded border-input"
                        />
                        <span className="truncate">{event.name}</span>
                      </label>
                      {state.enabled && (
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          aria-label={`Seats for ${event.name}`}
                          placeholder={`Seats (default ${form.maxAttendees || 1})`}
                          value={state.allowed}
                          onChange={(e) => setAllowed(event.id, e.target.value)}
                          className="h-8 w-44"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave seats blank to use the guest&apos;s max attendees. Guests only see events you select here.
              </p>
            </div>
          )}

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {guest ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}