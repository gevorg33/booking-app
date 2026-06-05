import { describe, expect, it } from 'vitest';
import { readPublicBookingLocalePreference } from './public-locale-cookie';

describe('Sprint 29 — public locale preference integration', () => {
  const tenantSettings = {
    enabledLocales: ['en', 'hy'],
    defaultLocale: 'hy',
    locale: 'hy',
  };

  it('uses tenant default when no cookie is set', () => {
    expect(readPublicBookingLocalePreference(tenantSettings)).toBe('hy');
  });

  it('supports legacy string business locale argument', () => {
    expect(readPublicBookingLocalePreference('en')).toBe('en');
  });

  it('falls back to tenant default for invalid legacy locale', () => {
    expect(readPublicBookingLocalePreference('de')).toBe('en');
  });
});
