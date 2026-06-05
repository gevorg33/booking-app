import { describe, expect, it } from 'vitest';
import {
  isStripeChargeCurrencySupported,
  readBusinessCurrency,
  SUPPORTED_BUSINESS_CURRENCIES,
  STRIPE_CHARGE_CURRENCIES,
} from './business-currency';
import type { PublicBusinessProfile } from './public-api';

function adminStripeWarning(
  connectReady: boolean,
  currency: string,
): boolean {
  return connectReady && !isStripeChargeCurrencySupported(currency);
}

function publicProfileFromSettings(
  settings: Record<string, unknown>,
): Pick<PublicBusinessProfile, 'currency' | 'stripeCurrencySupported'> {
  const currency = readBusinessCurrency(settings);
  return {
    currency,
    stripeCurrencySupported: isStripeChargeCurrencySupported(currency),
  };
}

describe('Sprint 28 — Stripe currency integration (frontend)', () => {
  it('keeps supported business currencies aligned with Stripe charge subset', () => {
    for (const code of SUPPORTED_BUSINESS_CURRENCIES) {
      expect(STRIPE_CHARGE_CURRENCIES.has(code.toLowerCase())).toBe(true);
      expect(isStripeChargeCurrencySupported(code)).toBe(true);
    }
  });

  it.each(SUPPORTED_BUSINESS_CURRENCIES.map((code) => ({ code })))(
    'public profile exposes Stripe-supported currency $code',
    ({ code }) => {
      const profile = publicProfileFromSettings({ currency: code });
      expect(profile.currency).toBe(code);
      expect(profile.stripeCurrencySupported).toBe(true);
      expect(adminStripeWarning(true, code)).toBe(false);
    },
  );

  it.each([
    {
      id: 'connect-amd-no-warning',
      connectReady: true,
      currency: 'AMD',
      warn: false,
    },
    {
      id: 'connect-eur-no-warning',
      connectReady: true,
      currency: 'EUR',
      warn: false,
    },
    {
      id: 'connect-xyz-warning',
      connectReady: true,
      currency: 'XYZ',
      warn: true,
    },
    {
      id: 'no-connect-no-warning',
      connectReady: false,
      currency: 'XYZ',
      warn: false,
    },
    {
      id: 'legacy-default-rub',
      connectReady: true,
      settings: { defaultCurrency: 'RUB' },
      currency: 'RUB',
      warn: false,
    },
  ])(
    'admin settings Stripe warning for $id',
    ({ connectReady, currency, warn, settings }) => {
      const resolved = settings
        ? readBusinessCurrency(settings)
        : currency;
      expect(adminStripeWarning(connectReady, resolved)).toBe(warn);
    },
  );

  it.each([
    { checkoutKind: 'service', currency: 'USD', stripeCode: 'usd' },
    { checkoutKind: 'package', currency: 'EUR', stripeCode: 'eur' },
    { checkoutKind: 'multi-service', currency: 'AMD', stripeCode: 'amd' },
    { checkoutKind: 'gift-card', currency: 'GEL', stripeCode: 'gel' },
  ])(
    '$checkoutKind checkout maps $currency to Stripe lowercase code',
    ({ currency, stripeCode }) => {
      expect(currency.toLowerCase()).toBe(stripeCode);
      expect(isStripeChargeCurrencySupported(currency)).toBe(true);
    },
  );
});
