import { describe, expect, it } from 'vitest';
import { resolveDashboardBusinessType } from './use-dashboard-business-type';

describe('resolveDashboardBusinessType (e2e-bug.61)', () => {
  it.each([
    {
      id: 'auth-settings',
      business: { settings: { businessType: 'clinic' } },
      profile: undefined,
      expected: 'clinic',
    },
    {
      id: 'auth-top-level',
      business: { businessType: 'dental' },
      profile: undefined,
      expected: 'dental',
    },
    {
      id: 'profile-settings-fallback',
      business: { id: 'biz-1' },
      profile: { settings: { businessType: 'polyclinic' } },
      expected: 'polyclinic',
    },
    {
      id: 'profile-top-level-fallback',
      business: null,
      profile: { businessType: 'beauty_clinic' },
      expected: 'beauty_clinic',
    },
    {
      id: 'auth-wins-over-profile',
      business: { settings: { businessType: 'clinic' } },
      profile: { settings: { businessType: 'salon' } },
      expected: 'clinic',
    },
    {
      id: 'missing',
      business: { id: 'biz-1' },
      profile: { settings: {} },
      expected: undefined,
    },
  ])('$id', ({ business, profile, expected }) => {
    expect(resolveDashboardBusinessType(business as never, profile)).toBe(expected);
  });
});
