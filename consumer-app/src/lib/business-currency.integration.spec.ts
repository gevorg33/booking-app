import { describe, expect, it } from 'vitest';
import { formatPublicMoney, resolveTenantPriceCurrency } from './business-currency.js';

describe('Sprint 28 — consumer app public currency on profile load', () => {
  it.each([
    {
      id: 'profile-amd-services-fallback',
      profileCurrency: 'AMD',
      serviceCurrency: null,
      display: 'AMD',
      amount: 15000,
    },
    {
      id: 'profile-eur-service-match',
      profileCurrency: 'EUR',
      serviceCurrency: 'EUR',
      display: 'EUR',
      amount: 45,
    },
    {
      id: 'legacy-usd-on-amd-tenant',
      profileCurrency: 'AMD',
      serviceCurrency: 'USD',
      display: 'USD',
      amount: 80,
    },
    {
      id: 'invalid-service-fallback-rub',
      profileCurrency: 'RUB',
      serviceCurrency: 'BOGUS',
      display: 'RUB',
      amount: 1200,
    },
    {
      id: 'usd-default-profile',
      profileCurrency: 'USD',
      serviceCurrency: undefined,
      display: 'USD',
      amount: 99,
    },
  ])(
    '$id resolves display currency from profile on load',
    ({ profileCurrency, serviceCurrency, display, amount }) => {
      expect(resolveTenantPriceCurrency(serviceCurrency, profileCurrency)).toBe(display);
      const formatted = formatPublicMoney(amount, serviceCurrency, profileCurrency);
      expect(formatted).toMatch(new RegExp(`${display}|[$€£₽֏₪₺₴]`));
      expect(formatted).not.toBe('');
    },
  );
});
