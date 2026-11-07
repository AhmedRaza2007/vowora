import { describe, expect, it } from 'vitest';
import { moduleCatalog } from './modules';

describe('moduleCatalog', () => {
  it('keys match their slug', () => {
    for (const [key, info] of Object.entries(moduleCatalog)) {
      expect(info.slug).toBe(key);
    }
  });

  it('every module declares a delivery phase and non-empty copy', () => {
    for (const info of Object.values(moduleCatalog)) {
      expect(info.title.length).toBeGreaterThan(0);
      expect(info.description.length).toBeGreaterThan(0);
      expect(info.phase).toMatch(/^Phase \d+$/);
    }
  });

  it('covers the signature invitation and core planning modules', () => {
    for (const slug of ['builder', 'invitation', 'events', 'guests', 'rsvp', 'budget', 'ai', 'billing']) {
      expect(moduleCatalog[slug]).toBeDefined();
    }
  });
});