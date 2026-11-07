import { describe, expect, it } from 'vitest';
import { adminNav, dashboardNav, defaultBranding, marketingNav } from './branding';

describe('defaultBranding', () => {
  it('ships a configurable working brand', () => {
    expect(defaultBranding.name.length).toBeGreaterThan(0);
    expect(defaultBranding.tagline.length).toBeGreaterThan(0);
    expect(defaultBranding.supportEmail).toContain('@');
  });
});

describe('navigation', () => {
  it('has unique hrefs within each nav', () => {
    for (const nav of [marketingNav, dashboardNav, adminNav]) {
      const hrefs = nav.map((n) => n.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });

  it('uses absolute internal paths', () => {
    for (const nav of [marketingNav, dashboardNav, adminNav]) {
      for (const item of nav) expect(item.href.startsWith('/')).toBe(true);
    }
  });
});