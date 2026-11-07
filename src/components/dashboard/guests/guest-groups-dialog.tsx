'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { createGroupAction, deleteGroupAction, updateGroupAction } from '@/features/weddings/guest-actions';
import type { Guest, GuestGroup, Wedding } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function useGroupAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(action: (p: unknown, f: FormData) => Promise<{ error: string | null }>, data: FormData, t: (k: string) => string, onDone?: () => void) {
    startTransition(async () => {
      const res = await action(null, data);
      if (res.error) setError(res.error.startsWith('errors.') ? t(res.error) : res.error);
      else {
        setError(null);
        onDone?.();
        router.refresh();
      }
    });
  }
  return { pending, error, run };
}

function GroupRow({ wedding, group, count }: { wedding: Wedding; group: GuestGroup; count: number }) {
  const t = useTranslations();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [name, setName] = useState(group.name);
  const [max, setMax] = useState(String(group.max_attendees));
  const { pending, error, run } = useGroupAction();

  function save() {
    const data = new FormData();
    data.set('weddingId', wedding.id);
    data.set('groupId', group.id);
    data.set('name', name);
    data.set('maxAttendees', max);
    run(updateGroupAction, data, t, () => setEditing(false));
  }

  function remove() {
    const data = new FormData();
    data.set('weddingId', wedding.id);
    data.set('groupId', group.id);
    run(deleteGroupAction, data, t);
  }

  return (
    <div className="rounded-md border p-3">
      {editing ? (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
            <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Group name" />
            <Input type="number" min={1} value={max} onChange={(e) => setMax(e.target.value)} aria-label="Max attendees" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" /> {t('common.cancel')}
            </Button>
            <Button size="sm" onClick={save} disabled={pending || name.trim().length === 0}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t('common.save')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{group.name}</p>
            <p className="text-xs text-muted-foreground">
              {count} {count === 1 ? 'guest' : 'guests'} · up to {group.max_attendees} attendees
            </p>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="ghost" aria-label={`Edit ${group.name}`} onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            {confirming ? (
              <>
                <Button size="sm" variant="destructive" onClick={remove} disabled={pending}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" aria-label="Cancel delete" onClick={() => setConfirming(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" aria-label={`Delete ${group.name}`} onClick={() => setConfirming(true)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function GuestGroupsDialog({
  wedding,
  groups,
  guests,
  trigger,
}: {
  wedding: Wedding;
  groups: GuestGroup[];
  guests: Guest[];
  trigger: ReactNode;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [max, setMax] = useState('4');
  const { pending, error, run } = useGroupAction();

  function add() {
    const data = new FormData();
    data.set('weddingId', wedding.id);
    data.set('name', name);
    data.set('maxAttendees', max);
    run(createGroupAction, data, t, () => {
      setName('');
      setMax('4');
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guest groups</DialogTitle>
          <DialogDescription>
            Organize guests into families or parties. Deleting a group keeps its guests ungrouped.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No groups yet. Add one below.</p>
          ) : (
            groups.map((group) => (
              <GroupRow
                key={group.id}
                wedding={wedding}
                group={group}
                count={guests.filter((g) => g.group_id === group.id).length}
              />
            ))
          )}
        </div>

        <div className="space-y-2 rounded-md border border-dashed p-3">
          <Label htmlFor="new-group-name">New group</Label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
            <Input
              id="new-group-name"
              value={name}
              placeholder="Khan Family"
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="number"
              min={1}
              value={max}
              aria-label="New group max attendees"
              onChange={(e) => setMax(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button size="sm" onClick={add} disabled={pending || name.trim().length === 0}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}