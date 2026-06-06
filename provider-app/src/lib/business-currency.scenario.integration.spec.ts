import { describe, expect, it } from 'vitest';
import {
  formatProviderMoney,
  readBusinessCurrency,
  resolveDisplayCurrency,
  resolveTenantPriceCurrency,
  SUPPORTED_BUSINESS_CURRENCIES,
} from './business-currency';

describe('Sprint 28 — provider currency scenario matrix', () => {
  it.each([
    {
      id: 'auth-amd-default',
      businessCurrency: 'AMD',
      serviceCurrency: null,
      display: 'AMD',
    },
    {
      id: 'auth-eur-default',
      businessCurrency: 'EUR',
      serviceCurrency: undefined,
      display: 'EUR',
    },
    {
      id: 'legacy-usd-on-amd-business',
      businessCurrency: 'AMD',
      serviceCurrency: 'USD',
      display: 'USD',
    },
    {
      id: 'invalid-service-fallback',
      businessCurrency: 'RUB',
      serviceCurrency: 'BOGUS',
      display: 'RUB',
    },
    {
      id: 'usd-default',
      businessCurrency: 'USD',
      serviceCurrency: '',
      display: 'USD',
    },
    {
      id: 'gel-tenant-chf-service',
      businessCurrency: 'GEL',
      serviceCurrency: 'CHF',
      display: 'CHF',
    },
  ])(
    'provider display currency for $id',
    ({ businessCurrency, serviceCurrency, display }) => {
      const tenant = readBusinessCurrency(businessCurrency);
      expect(tenant).toBe(businessCurrency);
      expect(resolveDisplayCurrency(serviceCurrency, tenant)).toBe(display);
      expect(resolveTenantPriceCurrency(serviceCurrency, tenant)).toBe(display);
      expect(formatProviderMoney(100, serviceCurrency, tenant)).toBeTruthy();
    },
  );

  it('covers every supported business currency from auth payload', () => {
    for (const code of SUPPORTED_BUSINESS_CURRENCIES) {
      expect(readBusinessCurrency(code)).toBe(code);
      expect(resolveTenantPriceCurrency(null, code)).toBe(code);
    }
  });
});
