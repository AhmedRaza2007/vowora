import { describe, expect, it } from 'vitest';
import {
  MAX_BYTES,
  extensionFor,
  mediaUrl,
  parseMediaUrls,
  uploadMediaSchema,
  validateMediaFile,
} from './media';

describe('uploadMediaSchema', () => {
  it('accepts a valid wedding id and kind', () => {
    expect(
      uploadMediaSchema.safeParse({
        weddingId: '123e4567-e89b-12d3-a456-426614174000',
        kind: 'image',
      }).success,
    ).toBe(true);
  });

  it('rejects an unknown kind', () => {
    expect(
      uploadMediaSchema.safeParse({
        weddingId: '123e4567-e89b-12d3-a456-426614174000',
        kind: 'exe',
      }).success,
    ).toBe(false);
  });
});

describe('validateMediaFile', () => {
  it('accepts a valid image', () => {
    expect(validateMediaFile('image', { type: 'image/png', size: 1024 })).toBeNull();
  });

  it('rejects a missing or empty file', () => {
    expect(validateMediaFile('image', null)).not.toBeNull();
    expect(validateMediaFile('image', { type: 'image/png', size: 0 })).not.toBeNull();
  });

  it('rejects a disallowed mime type for the kind', () => {
    expect(validateMediaFile('image', { type: 'image/gif', size: 10 })).not.toBeNull();
    expect(validateMediaFile('video', { type: 'image/png', size: 10 })).not.toBeNull();
  });

  it('rejects an oversized file', () => {
    expect(validateMediaFile('image', { type: 'image/png', size: MAX_BYTES.image + 1 })).not.toBeNull();
  });

  it('accepts a video within the limit', () => {
    expect(validateMediaFile('video', { type: 'video/mp4', size: MAX_BYTES.video })).toBeNull();
  });
});

describe('extensionFor', () => {
  it('maps known mime types', () => {
    expect(extensionFor('image/jpeg')).toBe('jpg');
    expect(extensionFor('video/mp4')).toBe('mp4');
  });

  it('falls back for unknown types', () => {
    expect(extensionFor('application/x-unknown')).toBe('bin');
  });
});

describe('mediaUrl', () => {
  it('builds a same-origin proxy path', () => {
    expect(mediaUrl('abc/file.png')).toBe('/api/media/abc/file.png');
  });
});

describe('parseMediaUrls', () => {
  it('parses a JSON array of strings', () => {
    expect(parseMediaUrls(JSON.stringify(['/a.png', '/b.png']))).toEqual(['/a.png', '/b.png']);
  });

  it('filters non-string and empty entries', () => {
    expect(parseMediaUrls(JSON.stringify(['/a.png', 3, '', null]))).toEqual(['/a.png']);
  });

  it('returns empty for invalid JSON or non-arrays', () => {
    expect(parseMediaUrls('not json')).toEqual([]);
    expect(parseMediaUrls('{"a":1}')).toEqual([]);
    expect(parseMediaUrls('')).toEqual([]);
  });
});