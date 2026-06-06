import {
  assertSupportedBusinessCurrency,
  formatBusinessMoney,
  getBusinessDefaultCurrency,
  isStripeChargeCurrencySupported,
  listStripeChargeCurrencyCodes,
  isSupportedBusinessCurrency,
  normalizeBusinessCurrency,
  resolvePriceCurrency,
  SUPPORTED_BUSINESS_CURRENCIES,
  STRIPE_CHARGE_CURRENCIES,
} from './business-currency.util.js';

describe('business-currency.util', () => {
  describe('normalizeBusinessCurrency', () => {
    it.each([
      [' amd ', 'AMD'],
      ['eur', 'EUR'],
      ['  GBP  ', 'GBP'],
    ])('normalizes valid code %s → %s', (input, expected) => {
      expect(normalizeBusinessCurrency(input)).toBe(expected);
    });

    it.each([
      [null],
      [undefined],
      [''],
      ['  '],
      ['US'],
      ['USDD'],
      ['12A'],
      [123 as unknown as string],
    ])('returns null for invalid input %p', (input) => {
      expect(normalizeBusinessCurrency(input as string)).toBeNull();
    });
  });

  describe('isSupportedBusinessCurrency', () => {
    it('accepts all supported codes case-insensitively', () => {
      for (const code of SUPPORTED_BUSINESS_CURRENCIES) {
        expect(isSupportedBusinessCurrency(code)).toBe(true);
        expect(isSupportedBusinessCurrency(code.toLowerCase())).toBe(true);
      }
      expect(isSupportedBusinessCurrency('XYZ')).toBe(false);
    });
  });

  describe('assertSupportedBusinessCurrency', () => {
    it('returns normalized code when supported', () => {
      expect(assertSupportedBusinessCurrency('amd')).toBe('AMD');
    });

    it('throws when code is unsupported or malformed', () => {
      expect(() => assertSupportedBusinessCurrency('XYZ')).toThrow(
        'Unsupported currency code: XYZ',
      );
      expect(() => assertSupportedBusinessCurrency('US')).toThrow(
        'Unsupported currency code: US',
      );
    });
  });

  describe('getBusinessDefaultCurrency', () => {
    it('defaults to USD when settings are empty', () => {
      expect(getBusinessDefaultCurrency()).toBe('USD');
      expect(getBusinessDefaultCurrency({})).toBe('USD');
    });

    it('prefers settings.currency over legacy and locale', () => {
      expect(
        getBusinessDefaultCurrency({
          currency: 'EUR',
          defaultCurrency: 'GBP',
          locale: { currency: 'RUB' },
        }),
      ).toBe('EUR');
    });

    it('falls back to defaultCurrency then locale.currency', () => {
      expect(getBusinessDefaultCurrency({ defaultCurrency: 'AMD' })).toBe(
        'AMD',
      );
      expect(getBusinessDefaultCurrency({ locale: { currency: 'RUB' } })).toBe(
        'RUB',
      );
    });

    it('ignores unsupported codes at each precedence level', () => {
      expect(
        getBusinessDefaultCurrency({
          currency: 'XYZ',
          defaultCurrency: 'GEL',
        }),
      ).toBe('GEL');
      expect(
        getBusinessDefaultCurrency({
          currency: 'BAD',
          defaultCurrency: 'NOPE',
          locale: { currency: 'AMD' },
        }),
      ).toBe('AMD');
      expect(
        getBusinessDefaultCurrency({
          currency: 'ZZZ',
          locale: { currency: 'QQQ' },
        }),
      ).toBe('USD');
    });

    it('ignores locale.currency when locale is not an object', () => {
      expect(
        getBusinessDefaultCurrency({
          locale: 'en' as unknown as Record<string, unknown>,
        }),
      ).toBe('USD');
    });
  });

  describe('isStripeChargeCurrencySupported', () => {
    it.each([...STRIPE_CHARGE_CURRENCIES])(
      'supports Stripe charge currency %s',
      (code) => {
        expect(isStripeChargeCurrencySupported(code)).toBe(true);
        expect(isStripeChargeCurrencySupported(code.toUpperCase())).toBe(true);
        expect(isStripeChargeCurrencySupported(` ${code} `)).toBe(true);
      },
    );

    it('rejects unknown Stripe currencies', () => {
      expect(isStripeChargeCurrencySupported('xyz')).toBe(false);
    });

    it('lists uppercase Stripe charge ISO codes', () => {
      const codes = listStripeChargeCurrencyCodes();
      expect(codes).toContain('EUR');
      expect(codes).toContain('AMD');
      expect(codes.every((code) => code === code.toUpperCase())).toBe(true);
    });
  });

  describe('formatBusinessMoney', () => {
    it.each([
      { amount: 4200, settings: { currency: 'EUR' }, pattern: /€|EUR/ },
      { amount: 15000, settings: { currency: 'AMD' }, pattern: /֏|AMD/ },
      { amount: 99.5, settings: { currency: 'USD' }, pattern: /\$|USD/ },
    ])(
      'formats KPI amounts with business currency',
      ({ amount, settings, pattern }) => {
        expect(formatBusinessMoney(amount, settings)).toMatch(pattern);
      },
    );

    it('returns dash for empty analytics amounts', () => {
      expect(formatBusinessMoney(null, { currency: 'EUR' })).toBe('—');
      expect(formatBusinessMoney('bad', { currency: 'EUR' })).toBe('—');
    });

    it('prefers entity currency when formatting report KPIs', () => {
      expect(formatBusinessMoney(10, { currency: 'AMD' }, 'USD')).toContain(
        '$',
      );
    });

    it('falls back to code suffix when Intl formatter throws', () => {
      const original = Intl.NumberFormat;
      jest.spyOn(Intl, 'NumberFormat').mockImplementation(() => {
        throw new Error('formatter unavailable');
      });
      try {
        expect(formatBusinessMoney(5, { currency: 'EUR' })).toBe('5 EUR');
      } finally {
        Intl.NumberFormat = original;
      }
    });
  });

  describe('resolvePriceCurrency', () => {
    it('uses entity currency when supported', () => {
      expect(resolvePriceCurrency('eur', { currency: 'AMD' })).toBe('EUR');
    });

    it('falls back to business default when entity currency missing or invalid', () => {
      expect(resolvePriceCurrency(null, { currency: 'AMD' })).toBe('AMD');
      expect(resolvePriceCurrency(undefined, { currency: 'GEL' })).toBe('GEL');
      expect(resolvePriceCurrency('bogus', { currency: 'RUB' })).toBe('RUB');
      expect(resolvePriceCurrency('', { defaultCurrency: 'CHF' })).toBe('CHF');
    });

    it('defaults to USD when neither entity nor business currency is valid', () => {
      expect(resolvePriceCurrency(null, {})).toBe('USD');
      expect(resolvePriceCurrency('bad', { currency: 'ZZZ' })).toBe('USD');
    });
  });
});
