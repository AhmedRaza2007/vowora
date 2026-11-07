'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSectionAction } from '@/features/weddings/builder-actions';
import { SECTION_LABELS } from '@/features/weddings/section-defaults';
import type { Json, WeddingSection } from '@/types/database';
import { MediaUpload } from './media-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function initialContent(content: Json): Record<string, string> {
  const out: Record<string, string> = {};
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    for (const [key, value] of Object.entries(content)) {
      if (typeof value === 'string') out[key] = value;
    }
  }
  if (Object.keys(out).length === 0) out.body = '';
  return out;
}

export function SectionEditor({
  section,
  weddingId,
  open,
  onOpenChange,
}: {
  section: WeddingSection;
  weddingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(section.title ?? '');
  const [fields, setFields] = useState<Record<string, string>>(() => initialContent(section.content));

  const mediaFields =
    section.type === 'hero'
      ? [{ key: 'imageUrl', kind: 'image' as const, label: 'Hero image (optional)', multiple: false }]
      : section.type === 'photo_gallery'
        ? [{ key: 'images', kind: 'image' as const, label: 'Gallery photos', multiple: true }]
        : section.type === 'video_gallery'
          ? [{ key: 'videos', kind: 'video' as const, label: 'Gallery videos', multiple: true }]
          : [];
  const mediaKeys = mediaFields.map((m) => m.key);

  function save() {
    const fd = new FormData();
    fd.set('weddingId', weddingId);
    fd.set('sectionId', section.id);
    fd.set('title', title);
    fd.set('content', JSON.stringify(fields));
    startTransition(async () => {
      const res = await updateSectionAction(null, fd);
      if (res.error) setError(res.error);
      else {
        setError(null);
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {SECTION_LABELS[section.type]}</DialogTitle>
          <DialogDescription>Update the heading and content shown to your guests.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-title">Section title</Label>
            <Input id="section-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
          </div>
          {Object.entries(fields)
            .filter(([key]) => !mediaKeys.includes(key))
            .map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`field-${key}`} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                </Label>
                <Textarea
                  id={`field-${key}`}
                  value={value}
                  onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                  rows={3}
                />
              </div>
            ))}
          {mediaFields.map((m) => (
            <MediaUpload
              key={m.key}
              weddingId={weddingId}
              kind={m.kind}
              label={m.label}
              multiple={m.multiple}
              value={fields[m.key] ?? ''}
              onChange={(v) => setFields((f) => ({ ...f, [m.key]: v }))}
            />
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? 'Saving…' : 'Save section'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}