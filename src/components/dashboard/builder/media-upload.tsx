'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadMediaAction } from '@/features/weddings/media-actions';
import { parseMediaUrls } from '@/lib/validations/media';
import { Button } from '@/components/ui/button';

const ACCEPT = {
  image: 'image/jpeg,image/png,image/webp',
  video: 'video/mp4',
} as const;

/**
 * Upload control for a section media field. Single mode stores one URL; multiple mode
 * stores a JSON-encoded array of URLs (gallery). Uploads go through the validated server
 * action; when Supabase Storage is not configured the action returns an honest error.
 */
export function MediaUpload({
  weddingId,
  kind,
  label,
  value,
  multiple = false,
  onChange,
}: {
  weddingId: string;
  kind: 'image' | 'video';
  label: string;
  value: string;
  multiple?: boolean;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = multiple ? parseMediaUrls(value) : value ? [value] : [];

  async function handleFile(file: File) {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set('weddingId', weddingId);
    fd.set('kind', kind);
    fd.set('file', file);
    const res = await uploadMediaAction(null, fd);
    setPending(false);
    if (res.error || !res.url) {
      setError(res.error ?? 'Upload failed.');
      return;
    }
    if (multiple) onChange(JSON.stringify([...items, res.url]));
    else onChange(res.url);
  }

  function remove(index: number) {
    if (multiple) {
      onChange(JSON.stringify(items.filter((_, i) => i !== index)));
    } else {
      onChange('');
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {items.length > 0 && (
        <div className={multiple ? 'grid grid-cols-3 gap-2' : ''}>
          {items.map((src, i) => (
            <div key={`${src}-${i}`} className="relative overflow-hidden rounded-md border">
              {kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element -- builder preview of proxied upload
                <img src={src} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <video src={src} className="aspect-square w-full object-cover" muted />
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove media"
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1 shadow hover:bg-background"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {pending ? 'Uploading…' : multiple ? `Add ${kind}` : items.length ? `Replace ${kind}` : `Upload ${kind}`}
        </Button>
        <span className="text-xs text-muted-foreground">
          {kind === 'image' ? 'JPEG, PNG or WebP · up to 10 MB' : 'MP4 · up to 50 MB'}
        </span>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}