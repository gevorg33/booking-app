import { describe, expect, it } from 'vitest';
import {
  buildSalonTabHomePath,
  isClinicOnlySalonTab,
  resolveSalonTabId,
} from './salon-tab-route.util.js';

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

  it.each([
    { path: `/s/${slug}/results`, businessType: 'salon', expected: 'redirect-home' as const },
    { path: `/s/${slug}/lab-to-book`, businessType: 'hair_salon', expected: 'redirect-home' as const },
    { path: `/s/${slug}/lab-requests`, businessType: 'tour_operator', expected: 'redirect-home' as const },
    { path: `/s/${slug}/results`, businessType: 'clinic', expected: 'results' as const },
    { path: `/s/${slug}/lab-to-book`, businessType: 'dental', expected: 'lab-to-book' as const },
    { path: `/s/${slug}/account`, businessType: 'salon', expected: 'account' as const },
  ])(
    'e2e-bug.43: $path with businessType=$businessType → $expected',
    ({ path, businessType, expected }) => {
      expect(resolveSalonTabId(path, slug, { businessType })).toBe(expected);
    },
  );
});

describe('isClinicOnlySalonTab', () => {
  it('flags clinic-only tabs', () => {
    expect(isClinicOnlySalonTab('results')).toBe(true);
    expect(isClinicOnlySalonTab('lab-to-book')).toBe(true);
    expect(isClinicOnlySalonTab('lab-requests')).toBe(true);
    expect(isClinicOnlySalonTab('home')).toBe(false);
    expect(isClinicOnlySalonTab('account')).toBe(false);
  });
});

describe('buildSalonTabHomePath', () => {
  it('builds home tab path', () => {
    expect(buildSalonTabHomePath('glow-nails')).toBe('/s/glow-nails/home');
  });
});
