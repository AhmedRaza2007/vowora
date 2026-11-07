import { z } from 'zod';

export const mediaKinds = ['image', 'video', 'audio'] as const;
export type MediaKindInput = (typeof mediaKinds)[number];

export const uploadMediaSchema = z.object({
  weddingId: z.string().uuid(),
  kind: z.enum(mediaKinds),
});

export const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const VIDEO_MIME = ['video/mp4'] as const;
export const AUDIO_MIME = ['audio/mpeg', 'audio/mp4'] as const;

const MB = 1024 * 1024;
export const MAX_BYTES: Record<MediaKindInput, number> = {
  image: 10 * MB,
  video: 50 * MB,
  audio: 20 * MB,
};

const ALLOWED: Record<MediaKindInput, readonly string[]> = {
  image: IMAGE_MIME,
  video: VIDEO_MIME,
  audio: AUDIO_MIME,
};

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
};

export function extensionFor(mime: string): string {
  return EXT[mime] ?? 'bin';
}

/** Validate an uploaded file against its kind. Returns an error message, or null when valid. */
export function validateMediaFile(
  kind: MediaKindInput,
  file: { type: string; size: number } | null,
): string | null {
  if (!file || file.size === 0) return 'Please choose a non-empty file.';
  if (!ALLOWED[kind].includes(file.type)) {
    return `Unsupported ${kind} type. Allowed: ${ALLOWED[kind].join(', ')}.`;
  }
  if (file.size > MAX_BYTES[kind]) {
    return `File is too large. Maximum ${Math.round(MAX_BYTES[kind] / MB)} MB for ${kind}.`;
  }
  return null;
}

/** Stable, same-origin URL served by the published-gated media proxy. */
export function mediaUrl(path: string): string {
  return `/api/media/${path}`;
}

/** Parse a gallery field (JSON-encoded string array of URLs) defensively. */
export function parseMediaUrls(value: string): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string' && v.length > 0);
  } catch {
    return [];
  }
}