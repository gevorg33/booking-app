import { describe, expect, it } from 'vitest';
import {
  isStripeChargeCurrencySupported,
  readBusinessCurrency,
  resolveDisplayCurrency,
  resolveTenantPriceCurrency,
} from './business-currency';
import type { PublicBusinessProfile } from './public-api';

describe('Sprint 28 — business currency scenario matrix', () => {
  it.each([
    {
      id: 'profile-amd',
      settings: { currency: 'AMD' },
      businessCurrency: 'AMD',
      serviceCurrency: null,
      display: 'AMD',
    },
    {
      id: 'legacy-eur',
      settings: { defaultCurrency: 'EUR' },
      businessCurrency: 'EUR',
      serviceCurrency: undefined,
      display: 'EUR',
    },
    {
      id: 'service-usd-on-amd-business',
      settings: { currency: 'AMD' },
      businessCurrency: 'AMD',
      serviceCurrency: 'USD',
      display: 'USD',
    },
    {
      id: 'invalid-service-fallback',
      settings: { currency: 'RUB' },
      businessCurrency: 'RUB',
      serviceCurrency: 'BOGUS',
      display: 'RUB',
    },
    {
      id: 'usd-default',
      settings: {},
      businessCurrency: 'USD',
      serviceCurrency: '',
      display: 'USD',
    },
    {
      id: 'gel-tenant-chf-service',
      settings: { currency: 'GEL' },
      businessCurrency: 'GEL',
      serviceCurrency: 'CHF',
      display: 'CHF',
    },
  ])(
    'public booking currency display for $id',
    ({ settings, businessCurrency, serviceCurrency, display }) => {
      const profile: Pick<PublicBusinessProfile, 'currency'> = {
        currency: readBusinessCurrency(settings),
      };

      expect(profile.currency).toBe(businessCurrency);
      expect(resolveDisplayCurrency(serviceCurrency, profile.currency)).toBe(
        display,
      );
      expect(
        resolveTenantPriceCurrency(serviceCurrency, profile.currency),
      ).toBe(display);
      expect(isStripeChargeCurrencySupported(profile.currency)).toBe(true);
    },
  );
});
