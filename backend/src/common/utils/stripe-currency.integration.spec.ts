import { ConfigService } from '@nestjs/config';
import { MultiServiceBookingsService } from '../../modules/multi-service-bookings/multi-service-bookings.service.js';
import { StripeIntegrationService } from '../../modules/billing/stripe-integration.service.js';
import { createPublicBookingServiceHarness } from '../../modules/public-booking/public-booking-test.harness.js';
import type { PublicBookingService } from '../../modules/public-booking/public-booking.service.js';
import type { Business } from '../../modules/business/entities/business.entity.js';
import {
  getBusinessDefaultCurrency,
  isStripeChargeCurrencySupported,
  resolvePriceCurrency,
  SUPPORTED_BUSINESS_CURRENCIES,
  STRIPE_CHARGE_CURRENCIES,
} from './business-currency.util.js';

function buildPublicBookingService(): PublicBookingService {
  const config = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
    ),
  };
  const multiServiceBookingsService = new MultiServiceBookingsService(
    { create: jest.fn(), save: jest.fn() } as never,
    { findOne: jest.fn(), save: jest.fn() } as never,
    { find: jest.fn() } as never,
  );
  return createPublicBookingServiceHarness({
    multiServiceBookingsService,
    configService: config as unknown as ConfigService,
  });
}

const baseBusiness = (settings: Record<string, unknown>): Business =>
  ({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    isActive: true,
    settings: {
      locale: 'en',
      branding: { primaryColor: '#000' },
      publicBooking: { enabled: true },
      ...settings,
    },
  }) as Business;

function adminStripeWarning(connectReady: boolean, currency: string): boolean {
  return connectReady && !isStripeChargeCurrencySupported(currency);
}

describe('Sprint 28 — Stripe currency integration', () => {
  const publicBookingService = buildPublicBookingService();

  it('keeps supported business currencies aligned with Stripe charge subset', () => {
    for (const code of SUPPORTED_BUSINESS_CURRENCIES) {
      expect(STRIPE_CHARGE_CURRENCIES.has(code.toLowerCase())).toBe(true);
      expect(isStripeChargeCurrencySupported(code)).toBe(true);
    }
  });

  it.each(SUPPORTED_BUSINESS_CURRENCIES.map((code) => ({ code })))(
    'public profile marks $code as Stripe-supported for checkout',
    ({ code }) => {
      const settings = { currency: code };
      const profile = publicBookingService.toPublicProfile(
        baseBusiness(settings),
      );

      expect(getBusinessDefaultCurrency(settings)).toBe(code);
      expect(profile.currency).toBe(code);
      expect(profile.stripeCurrencySupported).toBe(true);
      expect(isStripeChargeCurrencySupported(code)).toBe(true);
      expect(adminStripeWarning(true, code)).toBe(false);
    },
  );

  it.each([
    {
      id: 'legacy-service-eur',
      settings: { currency: 'AMD' },
      entityCurrency: 'EUR',
      checkoutCurrency: 'EUR',
      stripeCode: 'eur',
    },
    {
      id: 'missing-service-amd',
      settings: { currency: 'AMD' },
      entityCurrency: null,
      checkoutCurrency: 'AMD',
      stripeCode: 'amd',
    },
    {
      id: 'invalid-service-gel-fallback',
      settings: { currency: 'GEL' },
      entityCurrency: 'BOGUS',
      checkoutCurrency: 'GEL',
      stripeCode: 'gel',
    },
    {
      id: 'default-currency-chf',
      settings: { defaultCurrency: 'CHF' },
      entityCurrency: undefined,
      checkoutCurrency: 'CHF',
      stripeCode: 'chf',
    },
  ])(
    'resolvePriceCurrency checkout code for $id',
    ({ settings, entityCurrency, checkoutCurrency, stripeCode }) => {
      expect(resolvePriceCurrency(entityCurrency, settings)).toBe(
        checkoutCurrency,
      );
      expect(checkoutCurrency.toLowerCase()).toBe(stripeCode);
      expect(isStripeChargeCurrencySupported(checkoutCurrency)).toBe(true);
    },
  );

  it.each([
    {
      id: 'connect-ready-supported',
      connectReady: true,
      currency: 'EUR',
      warn: false,
    },
    {
      id: 'connect-ready-unsupported',
      connectReady: true,
      currency: 'XYZ',
      warn: true,
    },
    {
      id: 'no-connect-unsupported',
      connectReady: false,
      currency: 'XYZ',
      warn: false,
    },
    {
      id: 'no-connect-supported',
      connectReady: false,
      currency: 'AMD',
      warn: false,
    },
  ])(
    'admin Stripe Connect warning matrix for $id',
    ({ connectReady, currency, warn }) => {
      expect(adminStripeWarning(connectReady, currency)).toBe(warn);
    },
  );
});
