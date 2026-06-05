import { describe, expect, it } from 'vitest';
import {
  isStripeChargeCurrencySupported,
  readBusinessCurrency,
  resolveDisplayCurrency,
  resolveTenantPriceCurrency,
} from './business-currency';
import { formatPublicMoney } from './public-currency';
import type { PublicBusinessProfile } from './public-api';

function tenantCurrency(settings: Record<string, unknown>): string {
  return readBusinessCurrency(settings);
}

describe('Sprint 28 — public booking currency display pipeline', () => {
  it.each([
    {
      id: 'service-list-amd-default',
      settings: { currency: 'AMD' },
      entityCurrency: null,
      display: 'AMD',
    },
    {
      id: 'service-list-legacy-eur',
      settings: { currency: 'EUR' },
      entityCurrency: 'EUR',
      display: 'EUR',
    },
    {
      id: 'checkout-preserves-usd-service',
      settings: { currency: 'AMD' },
      entityCurrency: 'USD',
      display: 'USD',
    },
    {
      id: 'multi-service-cart-fallback',
      settings: { currency: 'GEL' },
      entityCurrency: undefined,
      display: 'GEL',
    },
    {
      id: 'package-invalid-fallback',
      settings: { currency: 'RUB' },
      entityCurrency: 'NOTREAL',
      display: 'RUB',
    },
    {
      id: 'gift-card-preset-default',
      settings: {},
      entityCurrency: '',
      display: 'USD',
    },
  ])(
    'resolveTenantPriceCurrency for $id',
    ({ settings, entityCurrency, display }) => {
      const profile: Pick<PublicBusinessProfile, 'currency'> = {
        currency: tenantCurrency(settings),
      };
      expect(
        resolveTenantPriceCurrency(entityCurrency, profile.currency),
      ).toBe(display);
    },
  );

  it.each([
    {
      id: 'stripe-supported-amd',
      connectReady: true,
      currency: 'AMD',
      warn: false,
      stripeSupported: true,
    },
    {
      id: 'stripe-supported-eur',
      connectReady: true,
      currency: 'EUR',
      warn: false,
      stripeSupported: true,
    },
    {
      id: 'no-connect-no-warning',
      connectReady: false,
      currency: 'AMD',
      warn: false,
      stripeSupported: true,
    },
    {
      id: 'unsupported-code-warning',
      connectReady: true,
      currency: 'XYZ',
      warn: true,
      stripeSupported: false,
    },
  ])(
    'admin Stripe warning matrix for $id',
    ({ connectReady, currency, warn, stripeSupported }) => {
      expect(isStripeChargeCurrencySupported(currency)).toBe(stripeSupported);
      expect(connectReady && !isStripeChargeCurrencySupported(currency)).toBe(
        warn,
      );
    },
  );

  it.each([
    { surface: 'service-list', tenant: 'AMD', entity: null, amount: 40 },
    { surface: 'checkout-form', tenant: 'EUR', entity: 'EUR', amount: 55 },
    { surface: 'multi-service-cart', tenant: 'GEL', entity: undefined, amount: 90 },
    { surface: 'package-cards', tenant: 'RUB', entity: null, amount: 3000 },
    { surface: 'gift-card-catalog', tenant: 'USD', entity: 'USD', amount: 50 },
    { surface: 'account-loyalty', tenant: 'GBP', entity: null, amount: 12 },
  ])(
    'formatPublicMoney on $surface uses resolveDisplayCurrency fallback',
    ({ tenant, entity, amount }) => {
      const code = resolveDisplayCurrency(entity, tenant);
      const formatted = formatPublicMoney(amount, entity, tenant);
      const digits = String(amount).replace(/[^\d]/g, '');
      expect(formatted.replace(/[^\d]/g, '')).toContain(digits.slice(0, 2));
      expect(resolveTenantPriceCurrency(entity, tenant)).toBe(code);
    },
  );

  it('multi-service cart uses first service currency with tenant fallback', () => {
    const tenant = 'AMD';
    const services = [
      { currency: null as string | null },
      { currency: 'EUR' },
    ];
    const cartCurrency = resolveTenantPriceCurrency(
      services[0]?.currency,
      tenant,
    );
    expect(cartCurrency).toBe('AMD');
    expect(resolveTenantPriceCurrency(services[1].currency, tenant)).toBe(
      'EUR',
    );
  });
});
