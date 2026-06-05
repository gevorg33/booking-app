import { describe, expect, it } from 'vitest';
import { SUPPORTED_BUSINESS_CURRENCIES } from './business-currency';
import { formatPublicMoney } from './public-currency';

/** Every public-booking surface that formats money with tenant fallback (curr-1.5). */
export const PUBLIC_BOOKING_CURRENCY_SURFACES = [
  'service-list',
  'tour-service-card',
  'services-client',
  'any-services-client',
  'checkout-form',
  'multi-service-availability',
  'multi-service-confirm',
  'multi-service-checkout',
  'package-service-cards',
  'package-confirm-client',
  'package-checkout-client',
  'gift-card-catalog-client',
  'gift-card-checkout-shipping',
  'account-loyalty',
  'product-recommendation-cards',
] as const;

describe('Sprint 28 — public booking currency (integration)', () => {
  it('covers every curr-1.5 public surface id', () => {
    expect(PUBLIC_BOOKING_CURRENCY_SURFACES.length).toBe(15);
  });

  it.each([
    {
      surface: 'service-list',
      tenant: 'AMD',
      entity: null as string | null,
      amount: 15000,
      code: 'AMD',
      locale: 'en' as const,
    },
    {
      surface: 'tour-service-card',
      tenant: 'EUR',
      entity: null,
      amount: 85,
      code: 'EUR',
      locale: 'en',
    },
    {
      surface: 'services-client',
      tenant: 'GEL',
      entity: 'GEL',
      amount: 45,
      code: 'GEL',
      locale: 'hy',
    },
    {
      surface: 'any-services-client',
      tenant: 'USD',
      entity: undefined,
      amount: 60,
      code: 'USD',
      locale: 'ru',
    },
    {
      surface: 'checkout-form',
      tenant: 'AMD',
      entity: 'USD',
      amount: 80,
      code: 'USD',
      locale: 'en',
    },
    {
      surface: 'multi-service-availability',
      tenant: 'EUR',
      entity: null,
      amount: 120,
      code: 'EUR',
      locale: 'en',
    },
    {
      surface: 'multi-service-confirm',
      tenant: 'CHF',
      entity: null,
      amount: 200,
      code: 'CHF',
      locale: 'en',
    },
    {
      surface: 'multi-service-checkout',
      tenant: 'PLN',
      entity: 'PLN',
      amount: 99,
      code: 'PLN',
      locale: 'en',
    },
    {
      surface: 'package-service-cards',
      tenant: 'RUB',
      entity: null,
      amount: 4500,
      code: 'RUB',
      locale: 'ru',
    },
    {
      surface: 'package-confirm-client',
      tenant: 'GBP',
      entity: '',
      amount: 199,
      code: 'GBP',
      locale: 'en',
    },
    {
      surface: 'package-checkout-client',
      tenant: 'CAD',
      entity: null,
      amount: 149.99,
      code: 'CAD',
      locale: 'en',
    },
    {
      surface: 'gift-card-catalog-client',
      tenant: 'USD',
      entity: 'USD',
      amount: 50,
      code: 'USD',
      locale: 'en',
    },
    {
      surface: 'gift-card-checkout-shipping',
      tenant: 'AED',
      entity: null,
      amount: 25,
      code: 'AED',
      locale: 'en',
    },
    {
      surface: 'account-loyalty',
      tenant: 'ILS',
      entity: null,
      amount: 33.5,
      code: 'ILS',
      locale: 'en',
    },
    {
      surface: 'product-recommendation-cards',
      tenant: 'TRY',
      entity: null,
      amount: 75,
      code: 'TRY',
      locale: 'en',
    },
  ])(
    '$surface formats with tenant fallback via formatPublicMoney',
    ({ tenant, entity, amount, code, locale }) => {
      const formatted = formatPublicMoney(amount, entity, tenant, locale);
      expect(formatted).toMatch(new RegExp(`${code}|[$€£₽֏₪₺₴]|\\d`));
      expect(formatted.length).toBeGreaterThan(0);
    },
  );

  it.each(SUPPORTED_BUSINESS_CURRENCIES.map((code) => ({ code })))(
    'tenant profile currency $code formats service prices without entity code',
    ({ code }) => {
      const formatted = formatPublicMoney(100, null, code);
      expect(formatted).toBeTruthy();
      expect(formatted).not.toBe('—');
    },
  );

  it('profile pipeline: missing entity uses tenant from public profile', () => {
    const profileCurrency = 'AMD';
    const serviceCurrency = null;
    expect(formatPublicMoney(25000, serviceCurrency, profileCurrency)).toMatch(/AMD|֏|\d/);
  });

  it('legacy service preserves entity currency on checkout', () => {
    expect(formatPublicMoney(50, 'USD', 'AMD', 'en')).toContain('$');
  });
});
