'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Download, ExternalLink, Pencil, Plus, Search, Star, Trash2, Upload, Users } from 'lucide-react';
import { deleteGuestAction } from '@/features/weddings/guest-actions';
import { guestCategories, guestCategoryLabels, guestCsvHeaders, type GuestCategory } from '@/lib/validations/guest';
import { toCsv } from '@/lib/csv';
import type { Guest, GuestEvent, GuestGroup, Wedding, WeddingEvent } from '@/types/database';
import { GuestFormDialog } from './guest-form-dialog';
import { GuestGroupsDialog } from './guest-groups-dialog';
import { CsvImportDialog } from './csv-import-dialog';
import { EmptyState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const selectClass =
  'flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function categoryLabel(category: string): string {
  return guestCategoryLabels[category as GuestCategory] ?? category;
}

function exportGuestsCsv(guests: Guest[], groups: GuestGroup[]) {
  const groupName = (id: string | null) => groups.find((g) => g.id === id)?.name ?? '';
  const rows = guests.map((g) => [
    g.name,
    g.email ?? '',
    g.phone ?? '',
    g.category,
    g.max_attendees,
    groupName(g.group_id),
    g.notes ?? '',
    g.dietary_preferences ?? '',
    g.is_vip ? 'true' : 'false',
  ]);
  const blob = new Blob([toCsv([[...guestCsvHeaders], ...rows])], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'vowora-guests.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

function DeleteGuestButton({ wedding, guest }: { wedding: Wedding; guest: Guest }) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    const data = new FormData();
    data.set('weddingId', wedding.id);
    data.set('guestId', guest.id);
    startTransition(async () => {
      const res = await deleteGuestAction(null, data);
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
        <Button variant="ghost" size="sm" aria-label={`Delete ${guest.name}`}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {guest.name}?</DialogTitle>
          <DialogDescription>
            This removes the guest and invalidates their invitation link. Their RSVP history is kept
            for your records.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? 'Removing…' : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GuestsManager({
  wedding,
  guests,
  groups,
  guestEvents,
  events,
}: {
  wedding: Wedding;
  guests: Guest[];
  groups: GuestGroup[];
  guestEvents: GuestEvent[];
  events: WeddingEvent[];
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [group, setGroup] = useState('all');
  const [sort, setSort] = useState('name');

  const groupName = (id: string | null) => groups.find((g) => g.id === id)?.name ?? '—';
  const permsFor = (guestId: string) => guestEvents.filter((ge) => ge.guest_id === guestId);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = guests.filter((g) => {
      const matchesQuery =
        q.length === 0 ||
        g.name.toLowerCase().includes(q) ||
        (g.email ?? '').toLowerCase().includes(q) ||
        (g.phone ?? '').toLowerCase().includes(q);
      const matchesCategory = category === 'all' || g.category === category;
      const matchesGroup =
        group === 'all' || (group === 'none' ? g.group_id === null : g.group_id === group);
      return matchesQuery && matchesCategory && matchesGroup;
    });
    return [...filtered].sort((a, b) => {
      if (sort === 'category') return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      if (sort === 'recent') return b.created_at.localeCompare(a.created_at);
      return a.name.localeCompare(b.name);
    });
  }, [guests, query, category, group, sort]);

  const totalSeats = guests.reduce((sum, g) => sum + g.max_attendees, 0);
  const vipCount = guests.filter((g) => g.is_vip).length;
  const publicUrl = `/w/${wedding.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight">Guests</h1>
            <Badge variant={wedding.status === 'published' ? 'success' : 'secondary'}>{wedding.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{wedding.title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <GuestGroupsDialog
            wedding={wedding}
            groups={groups}
            guests={guests}
            trigger={
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4" /> Groups
              </Button>
            }
          />
          <CsvImportDialog
            wedding={wedding}
            groups={groups}
            trigger={
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" /> Import
              </Button>
            }
          />
          <Button variant="outline" size="sm" onClick={() => exportGuestsCsv(guests, groups)} disabled={guests.length === 0}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <GuestFormDialog
            wedding={wedding}
            groups={groups}
            events={events}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" /> Add guest
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Guests</p>
            <p className="mt-1 font-display text-2xl font-semibold">{guests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Max attendees</p>
            <p className="mt-1 font-display text-2xl font-semibold">{totalSeats}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">VIP guests</p>
            <p className="mt-1 font-display text-2xl font-semibold">{vipCount}</p>
          </CardContent>
        </Card>
      </div>

      {guests.length === 0 ? (
        <EmptyState
          title="No guests yet"
          description="Add guests individually or import a CSV. Assign them to events and send secure invitations next."
          action={
            <GuestFormDialog
              wedding={wedding}
              groups={groups}
              events={events}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" /> Add your first guest
                </Button>
              }
            />
          }
        />
      ) : (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, email or phone"
                  className="ps-9"
                  aria-label="Search guests"
                />
              </div>
              <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
                <option value="all">All categories</option>
                {guestCategories.map((c) => (
                  <option key={c} value={c}>
                    {guestCategoryLabels[c]}
                  </option>
                ))}
              </select>
              <select className={selectClass} value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Filter by group">
                <option value="all">All groups</option>
                <option value="none">Ungrouped</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <select className={selectClass} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort guests">
                <option value="name">Name A–Z</option>
                <option value="category">Category</option>
                <option value="recent">Recently added</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-start text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pe-3 text-start font-medium">Name</th>
                    <th className="py-2 pe-3 text-start font-medium">Category</th>
                    <th className="py-2 pe-3 text-start font-medium">Group</th>
                    <th className="py-2 pe-3 text-start font-medium">Contact</th>
                    <th className="py-2 pe-3 text-start font-medium">Seats</th>
                    <th className="py-2 pe-3 text-start font-medium">Events</th>
                    <th className="py-2 text-end font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((guest) => {
                    const perms = permsFor(guest.id);
                    const eventNames = perms
                      .map((p) => events.find((e) => e.id === p.event_id)?.name)
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <tr key={guest.id} className="border-b last:border-0">
                        <td className="py-3 pe-3">
                          <span className="flex items-center gap-1.5 font-medium">
                            {guest.name}
                            {guest.is_vip && <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-label="VIP" />}
                          </span>
                        </td>
                        <td className="py-3 pe-3">
                          <Badge variant="secondary">{categoryLabel(guest.category)}</Badge>
                        </td>
                        <td className="py-3 pe-3 text-muted-foreground">{groupName(guest.group_id)}</td>
                        <td className="py-3 pe-3 text-muted-foreground">
                          <span className="block truncate">{guest.email ?? '—'}</span>
                          <span className="block truncate text-xs">{guest.phone ?? ''}</span>
                        </td>
                        <td className="py-3 pe-3">{guest.max_attendees}</td>
                        <td className="py-3 pe-3">
                          <span title={eventNames}>
                            {perms.length === 0 ? (
                              <span className="text-muted-foreground">None</span>
                            ) : (
                              <Badge variant="outline">{perms.length}</Badge>
                            )}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="flex items-center justify-end">
                            <GuestFormDialog
                              key={`${guest.id}-${guest.updated_at}`}
                              wedding={wedding}
                              groups={groups}
                              events={events}
                              guest={guest}
                              permissions={perms}
                              trigger={
                                <Button variant="ghost" size="sm" aria-label={`Edit ${guest.name}`}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <DeleteGuestButton wedding={wedding} guest={guest} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {visible.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No guests match your filters.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Showing {visible.length} of {guests.length} guests. Contact details are visible only to your wedding members.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}