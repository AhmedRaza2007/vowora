import { describe, expect, it } from 'vitest';
import {
  createSectionSchema,
  designConfigSchema,
  reorderSectionsSchema,
  updateSectionSchema,
} from './builder';

describe('designConfigSchema', () => {
  it('accepts a partial design config', () => {
    expect(designConfigSchema.safeParse({ primaryColor: '#6d1f3a' }).success).toBe(true);
  });

  it('rejects an over-long invitation message', () => {
    expect(designConfigSchema.safeParse({ invitationMessage: 'x'.repeat(2001) }).success).toBe(false);
  });
});

describe('createSectionSchema', () => {
  it('accepts a known section type', () => {
    expect(createSectionSchema.safeParse({ type: 'hero' }).success).toBe(true);
  });

  it('rejects an unknown section type', () => {
    expect(createSectionSchema.safeParse({ type: 'not_a_section' }).success).toBe(false);
  });
});

describe('updateSectionSchema', () => {
  it('accepts string content fields and a boolean toggle', () => {
    const r = updateSectionSchema.safeParse({ title: 'Welcome', content: { body: 'Hello' }, is_enabled: true });
    expect(r.success).toBe(true);
  });

  it('rejects non-scalar content values', () => {
    expect(updateSectionSchema.safeParse({ content: { body: { nested: 'no' } } }).success).toBe(false);
  });
});

describe('reorderSectionsSchema', () => {
  it('accepts a non-empty array of uuids', () => {
    expect(
      reorderSectionsSchema.safeParse({ ids: ['11111111-1111-1111-1111-111111111111'] }).success,
    ).toBe(true);
  });

  it('rejects an empty array', () => {
    expect(reorderSectionsSchema.safeParse({ ids: [] }).success).toBe(false);
  });

  it('rejects non-uuid entries', () => {
    expect(reorderSectionsSchema.safeParse({ ids: ['not-a-uuid'] }).success).toBe(false);
  });
});