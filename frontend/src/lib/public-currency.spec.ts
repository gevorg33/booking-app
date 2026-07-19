import { describe, expect, it } from 'vitest';
import { formatPublicMoney, formatPublicPrice } from './public-currency';

describe('public-currency', () => {
  describe('formatPublicPrice', () => {
    it.each([
      ['en', 'EUR', '€'],
      ['hy', 'AMD', '֏'],
      ['ru', 'RUB', '₽'],
      [undefined, 'USD', '$'],
    ] as const)('formats with locale %s', (locale, currency, fragment) => {
      expect(formatPublicPrice(10, currency, locale)).toMatch(
        new RegExp(fragment.replace('$', '\\$')),
      );
    });

    it('falls back to code suffix when Intl rejects currency', () => {
      expect(formatPublicPrice(12.5, 'NOTREAL', 'en')).toBe('12.5 NOTREAL');
    });

    it('e2e-bug.115 — missing locale uses fixed en-GB (not runtime default)', () => {
      const withMissing = formatPublicPrice(344.25, 'USD');
      const withEn = formatPublicPrice(344.25, 'USD', 'en');
      expect(withMissing).toBe(withEn);
      // en-GB USD: symbol prefix + dot decimal (never fr-style "344,25 $")
      expect(withMissing).toMatch(/\$344\.25|US\$344\.25/);
      expect(withMissing).not.toMatch(/344,25/);
    });
  });

  describe('formatPublicMoney', () => {
    it('uses tenant currency when entity code is missing', () => {
      expect(formatPublicMoney(40, null, 'EUR', 'en')).toContain('€');
    });

    it('preserves valid entity currency over tenant default', () => {
      expect(formatPublicMoney(99, 'USD', 'AMD', 'en')).toContain('$');
    });

    it('falls back to tenant when entity code is invalid', () => {
      expect(formatPublicMoney(100, 'BOGUS', 'CHF', 'en')).toMatch(/CHF|Fr/);
    });

    it('defaults tenant to USD when profile currency absent', () => {
      expect(formatPublicMoney(15, null, null, 'en')).toContain('$');
    });
  });
});
