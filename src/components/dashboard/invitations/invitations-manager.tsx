'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Ban, ExternalLink, Search, Send, Star } from 'lucide-react';
import { revokeInvitationAction } from '@/features/invitations/invitation-manage-actions';
import { effectiveInvitationStatus, type InvitationEffectiveStatus } from '@/lib/validations/invitation-delivery';
import type { Guest, Invitation, Wedding } from '@/types/database';
import { DeliveryDialog } from './delivery-dialog';
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

const statusVariant: Record<InvitationEffectiveStatus, 'success' | 'secondary' | 'destructive' | 'gold'> = {
  active: 'success',
  revoked: 'destructive',
  expired: 'secondary',
  exhausted: 'gold',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function RevokeButton({ wedding, invitation, guestName }: { wedding: Wedding; invitation: Invitation; guestName: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    const data = new FormData();
    data.set('weddingId', wedding.id);
    data.set('invitationId', invitation.id);
    startTransition(async () => {
      const res = await revokeInvitationAction(null, data);
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
        <Button variant="ghost" size="sm" aria-label={`Revoke invitation for ${guestName}`}>
          <Ban className="h-4 w-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke {guestName}&apos;s invitation?</DialogTitle>
          <DialogDescription>
            The link stops working immediately. You can generate a fresh link for this guest afterwards.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? 'Revoking…' : 'Revoke'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InvitationsManager({
  wedding,
  guests,
  invitations,
  baseUrl,
  emailConfigured,
}: {
  wedding: Wedding;
  guests: Guest[];
  invitations: Invitation[];
  baseUrl: string;
  emailConfigured: boolean;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  // The current usable token per guest (active and not expired/exhausted), newest first.
  const activeByGuest = useMemo(() => {
    const map = new Map<string, Invitation>();
    for (const inv of invitations) {
      if (effectiveInvitationStatus(inv) !== 'active') continue;
      const prev = map.get(inv.guest_id);
      if (!prev || inv.created_at > prev.created_at) map.set(inv.guest_id, inv);
    }
    return map;
  }, [invitations]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests
      .map((guest) => {
        const active = activeByGuest.get(guest.id) ?? null;
        const history = invitations.filter((i) => i.guest_id === guest.id);
        const latest = history[0] ?? null;
        const effective: InvitationEffectiveStatus | 'none' = active
          ? 'active'
          : latest
            ? effectiveInvitationStatus(latest)
            : 'none';
        return { guest, active, latest, effective };
      })
      .filter((row) => {
        const matchesQuery =
          q.length === 0 ||
          row.guest.name.toLowerCase().includes(q) ||
          (row.guest.email ?? '').toLowerCase().includes(q);
        const matchesStatus = status === 'all' || row.effective === status;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => a.guest.name.localeCompare(b.guest.name));
  }, [guests, invitations, activeByGuest, query, status]);

  const issuedCount = activeByGuest.size;
  const deliveredCount = guests.filter((g) => {
    const inv = activeByGuest.get(g.id);
    return inv?.delivered_at;
  }).length;
  const openedCount = guests.filter((g) => activeByGuest.get(g.id)?.last_opened_at).length;
  const publicUrl = `/w/${wedding.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight">Invitations</h1>
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
        </div>
      </div>

      {wedding.status !== 'published' && (
        <p className="rounded-md bg-gold/10 px-4 py-3 text-sm text-gold">
          Publish your wedding website before sending invitations — personal links only resolve once
          the site is live.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Active links</p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {issuedCount}
              <span className="text-base font-normal text-muted-foreground"> / {guests.length}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivered</p>
            <p className="mt-1 font-display text-2xl font-semibold">{deliveredCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Opened</p>
            <p className="mt-1 font-display text-2xl font-semibold">{openedCount}</p>
          </CardContent>
        </Card>
      </div>

      {guests.length === 0 ? (
        <EmptyState
          title="No guests to invite"
          description="Add guests first, then generate and deliver a secure personal invitation to each."
          action={
            <Button asChild>
              <Link href={`/dashboard/weddings/${wedding.id}/guests`}>Go to guests</Link>
            </Button>
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
                  placeholder="Search guests"
                  className="ps-9"
                  aria-label="Search guests"
                />
              </div>
              <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="none">Not issued</option>
                <option value="revoked">Revoked</option>
                <option value="expired">Expired</option>
                <option value="exhausted">Exhausted</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-start text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pe-3 text-start font-medium">Guest</th>
                    <th className="py-2 pe-3 text-start font-medium">Status</th>
                    <th className="py-2 pe-3 text-start font-medium">Delivered</th>
                    <th className="py-2 pe-3 text-start font-medium">Opens</th>
                    <th className="py-2 pe-3 text-start font-medium">Last opened</th>
                    <th className="py-2 text-end font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ guest, active, latest, effective }) => {
                    const shown = active ?? latest;
                    return (
                      <tr key={guest.id} className="border-b last:border-0">
                        <td className="py-3 pe-3">
                          <span className="flex items-center gap-1.5 font-medium">
                            {guest.name}
                            {guest.is_vip && <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-label="VIP" />}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">{guest.email ?? guest.phone ?? ''}</span>
                        </td>
                        <td className="py-3 pe-3">
                          {effective === 'none' ? (
                            <Badge variant="outline">Not issued</Badge>
                          ) : (
                            <Badge variant={statusVariant[effective]} className="capitalize">
                              {effective}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 pe-3 text-muted-foreground">
                          {shown?.delivered_at ? (
                            <span className="capitalize">{shown.delivered_via ?? 'link'} · {formatDate(shown.delivered_at)}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 pe-3">
                          {shown ? `${shown.use_count}${shown.max_uses ? ` / ${shown.max_uses}` : ''}` : '—'}
                        </td>
                        <td className="py-3 pe-3 text-muted-foreground">{formatDate(shown?.last_opened_at ?? null)}</td>
                        <td className="py-3">
                          <span className="flex items-center justify-end gap-1">
                            <DeliveryDialog
                              wedding={wedding}
                              guest={guest}
                              invitation={active}
                              baseUrl={baseUrl}
                              emailConfigured={emailConfigured}
                              trigger={
                                <Button variant={active ? 'outline' : 'default'} size="sm">
                                  <Send className="h-4 w-4" /> {active ? 'Deliver' : 'Create link'}
                                </Button>
                              }
                            />
                            {active && <RevokeButton wedding={wedding} invitation={active} guestName={guest.name} />}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No guests match your filters.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Each link is a unique, unguessable token scoped to one guest. Guests can never see each
              other&apos;s invitations or private contact details.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}