import { describe, expect, it } from 'vitest';
import {
  formatBusinessMoney,
  isStripeChargeCurrencySupported,
  readBusinessCurrency,
  resolveDisplayCurrency,
  resolveTenantPriceCurrency,
  SUPPORTED_BUSINESS_CURRENCIES,
  STRIPE_CHARGE_CURRENCIES,
} from './business-currency';

describe('business-currency', () => {
  describe('readBusinessCurrency', () => {
    it.each([
      [{ currency: 'AMD' }, 'AMD'],
      [{ defaultCurrency: 'EUR' }, 'EUR'],
      [{ currency: 'GBP', defaultCurrency: 'USD' }, 'GBP'],
      [{}, 'USD'],
      [null, 'USD'],
      [{ currency: 'BAD' }, 'USD'],
      [{ currency: '  rub  ' }, 'RUB'],
    ] as const)('reads %j as %s', (settings, expected) => {
      expect(readBusinessCurrency(settings)).toBe(expected);
    });

    it('covers every supported currency code', () => {
      for (const code of SUPPORTED_BUSINESS_CURRENCIES) {
        expect(readBusinessCurrency({ currency: code })).toBe(code);
      }
    });
  });

  describe('isStripeChargeCurrencySupported', () => {
    it.each([...STRIPE_CHARGE_CURRENCIES])('supports Stripe code %s', (code) => {
      expect(isStripeChargeCurrencySupported(code)).toBe(true);
      expect(isStripeChargeCurrencySupported(code.toUpperCase())).toBe(true);
    });

    it('rejects unknown Stripe currencies', () => {
      expect(isStripeChargeCurrencySupported('xyz')).toBe(false);
    });

    it('trims whitespace before checking Stripe support', () => {
      expect(isStripeChargeCurrencySupported(' amd ')).toBe(true);
    });
  });

  describe('resolveTenantPriceCurrency', () => {
    it('falls back to tenant currency when entity code missing', () => {
      expect(resolveTenantPriceCurrency(null, 'AMD')).toBe('AMD');
      expect(resolveTenantPriceCurrency('EUR', 'AMD')).toBe('EUR');
    });

    it('defaults to USD when tenant currency is absent', () => {
      expect(resolveTenantPriceCurrency(null, null)).toBe('USD');
      expect(resolveTenantPriceCurrency(null, undefined)).toBe('USD');
    });

    it('falls back to tenant when entity code is invalid', () => {
      expect(resolveTenantPriceCurrency('BOGUS', 'RUB')).toBe('RUB');
    });
  });

  describe('formatBusinessMoney', () => {
    it('formats with business currency when entity code absent', () => {
      expect(formatBusinessMoney(10, { businessCurrency: 'EUR' })).toContain('€');
    });

    it('prefers entity currency when valid', () => {
      expect(
        formatBusinessMoney(10, { businessCurrency: 'AMD', entityCurrency: 'USD' }),
      ).toContain('$');
    });

    it.each([null, undefined, ''] as const)('returns dash for empty amount %s', (amount) => {
      expect(formatBusinessMoney(amount, { businessCurrency: 'USD' })).toBe('—');
    });

    it('defaults business currency to USD when options omitted', () => {
      expect(formatBusinessMoney(12)).toContain('$');
    });

    it('falls back to code suffix when amount is not numeric', () => {
      expect(formatBusinessMoney('abc', { businessCurrency: 'EUR' })).toBe('abc EUR');
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
      ['XYZ', 'USD', 'USD'],
    ] as const)(
      'resolveDisplayCurrency(%s, %s) → %s',
      (entity, business, expected) => {
        expect(resolveDisplayCurrency(entity, business)).toBe(expected);
      },
    );
  });
});
