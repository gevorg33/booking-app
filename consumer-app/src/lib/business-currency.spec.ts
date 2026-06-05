import { describe, expect, it } from 'vitest';
import {
  formatConsumerPrice,
  formatPublicMoney,
  resolveDisplayCurrency,
  resolveTenantPriceCurrency,
  SUPPORTED_BUSINESS_CURRENCIES,
} from './business-currency.js';

describe('business-currency (consumer app)', () => {
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

  describe('formatPublicMoney', () => {
    it('uses tenant currency when service currency missing', () => {
      expect(formatPublicMoney(25, null, 'EUR')).toContain('€');
    });

    it('preserves legacy service currency', () => {
      expect(formatPublicMoney(10, 'USD', 'AMD')).toContain('$');
    });

    it('falls back to code suffix for invalid Intl currency', () => {
      expect(formatConsumerPrice(5, 'NOTREAL')).toBe('5 NOTREAL');
    });
  });

  it('covers every supported currency code', () => {
    for (const code of SUPPORTED_BUSINESS_CURRENCIES) {
      expect(resolveTenantPriceCurrency(null, code)).toBe(code);
      expect(formatPublicMoney(1, null, code)).toBeTruthy();
    }
  });
});
