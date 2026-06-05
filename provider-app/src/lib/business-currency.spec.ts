import { describe, expect, it } from 'vitest';
import {
  formatProviderMoney,
  formatProviderPrice,
  readBusinessCurrency,
  resolveDisplayCurrency,
  resolveTenantPriceCurrency,
  SUPPORTED_BUSINESS_CURRENCIES,
} from './business-currency';

describe('business-currency (provider app)', () => {
  describe('readBusinessCurrency', () => {
    it.each([
      [undefined, 'USD'],
      [null, 'USD'],
      ['', 'USD'],
      ['amd', 'AMD'],
      [' EUR ', 'EUR'],
      ['bogus', 'USD'],
    ] as const)('readBusinessCurrency(%s) → %s', (input, expected) => {
      expect(readBusinessCurrency(input)).toBe(expected);
    });
  });

  describe('resolveDisplayCurrency', () => {
    it.each([
      [null, 'AMD', 'AMD'],
      [undefined, 'EUR', 'EUR'],
      ['', 'CHF', 'CHF'],
      ['  gbp ', 'USD', 'GBP'],
      ['EUR', 'AMD', 'EUR'],
      ['invalid', 'RUB', 'RUB'],
    ] as const)('resolveDisplayCurrency(%s, %s) → %s', (entity, business, expected) => {
      expect(resolveDisplayCurrency(entity, business)).toBe(expected);
    });
  });

  describe('resolveTenantPriceCurrency', () => {
    it('defaults to USD when tenant currency is absent', () => {
      expect(resolveTenantPriceCurrency(null, null)).toBe('USD');
      expect(resolveTenantPriceCurrency(null, undefined)).toBe('USD');
    });
  });

  describe('formatProviderMoney', () => {
    it('uses tenant currency when service currency missing', () => {
      expect(formatProviderMoney(25, null, 'EUR')).toContain('€');
    });

    it('preserves legacy service currency', () => {
      expect(formatProviderMoney(10, 'USD', 'AMD')).toContain('$');
    });

    it('returns dash for nullish amounts', () => {
      expect(formatProviderMoney(null, 'USD', 'USD')).toBe('—');
      expect(formatProviderMoney('', 'USD', 'USD')).toBe('—');
    });

    it('falls back to code suffix for invalid Intl currency', () => {
      expect(formatProviderPrice(5, 'NOTREAL')).toBe('5 NOTREAL');
    });

    it('defaults empty currency code to USD in formatter', () => {
      expect(formatProviderPrice(8, '')).toContain('$');
    });

    it('formats fractional amounts with two decimal places', () => {
      expect(formatProviderPrice(10.99, 'USD')).toContain('10.99');
    });
  });

  it('covers every supported currency code', () => {
    for (const code of SUPPORTED_BUSINESS_CURRENCIES) {
      expect(resolveTenantPriceCurrency(null, code)).toBe(code);
      expect(formatProviderMoney(1, null, code)).toBeTruthy();
    }
  });
});
