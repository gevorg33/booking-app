import { describe, expect, it } from 'vitest';
import { buildSalonTabHomePath, resolveSalonTabId } from './salon-tab-route.util.js';

describe('resolveSalonTabId', () => {
  const slug = 'glow-nails';

  it.each([
    { path: `/s/${slug}`, expected: 'redirect-home' as const },
    { path: `/s/${slug}/home`, expected: 'home' as const },
    { path: `/s/${slug}/services`, expected: 'services' as const },
    { path: `/s/${slug}/account`, expected: 'account' as const },
    { path: `/s/${slug}/results`, expected: 'results' as const },
    { path: `/s/${slug}/lab-to-book`, expected: 'lab-to-book' as const },
    { path: `/s/${slug}/lab-requests`, expected: 'lab-requests' as const },
    { path: `/s/${slug}/unknown`, expected: 'redirect-home' as const },
  ])('maps $path → $expected', ({ path, expected }) => {
    expect(resolveSalonTabId(path, slug)).toBe(expected);
  });
});

describe('buildSalonTabHomePath', () => {
  it('builds home tab path', () => {
    expect(buildSalonTabHomePath('glow-nails')).toBe('/s/glow-nails/home');
  });
});
