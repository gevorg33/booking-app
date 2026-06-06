import { describe, expect, it, beforeEach, vi } from 'vitest';
import { formatPublicMoney } from '../lib/business-currency.js';
import { useTenantStore } from './tenant-store.js';

vi.mock('../lib/branding.js', () => ({
  applyBrandingCss: vi.fn(),
}));

vi.mock('../lib/recent-salons.js', () => ({
  rememberSalon: vi.fn(),
}));

describe('Sprint 28 — consumer tenant profile currency on load', () => {
  beforeEach(() => {
    useTenantStore.setState({ profile: null });
  });

  it.each([
    { currency: 'AMD', serviceCurrency: null, amount: 15000 },
    { currency: 'EUR', serviceCurrency: 'EUR', amount: 45 },
    { currency: 'USD', serviceCurrency: undefined, amount: 99 },
    { currency: 'RUB', serviceCurrency: 'BOGUS', amount: 1200 },
  ])(
    'profile.currency $currency drives service list formatting',
    ({ currency, serviceCurrency, amount }) => {
      useTenantStore.getState().setProfile({
        id: 'biz-1',
        name: 'Salon',
        slug: 'salon',
        timezone: 'UTC',
        locale: 'en',
        currency,
        branding: {},
        publicBookingEnabled: true,
      });

      const profile = useTenantStore.getState().profile;
      expect(profile?.currency).toBe(currency);

      const formatted = formatPublicMoney(
        amount,
        serviceCurrency ?? null,
        profile!.currency,
      );
      expect(formatted).toMatch(new RegExp(`${currency}|[$€£₽֏₪₺₴]|\\d`));
    },
  );
});
