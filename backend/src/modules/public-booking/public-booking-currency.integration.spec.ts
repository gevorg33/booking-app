import { ConfigService } from '@nestjs/config';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { PublicBookingService } from './public-booking.service.js';
import {
  getBusinessDefaultCurrency,
  isStripeChargeCurrencySupported,
} from '../../common/utils/business-currency.util.js';
import type { Business } from '../business/entities/business.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

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
  return new PublicBookingService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {
      isConnectReady: jest.fn().mockReturnValue(false),
    } as unknown as StripeIntegrationService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    multiServiceBookingsService,
    {} as never,
    {} as never,
    config as unknown as ConfigService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  
    // e2e-bug: PublicBookingService gained four repositories;
    // `undefined as never` keeps the runtime identical to omitting them.
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never);
}

const baseBusiness = (settings: Record<string, unknown>): Business =>
  makeBusiness({
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
  });

describe('Sprint 28 — public booking currency integration', () => {
  const publicBookingService = buildPublicBookingService();

  it.each([
    {
      id: 'explicit-amd',
      settings: { currency: 'AMD' },
      currency: 'AMD',
      stripeSupported: true,
    },
    {
      id: 'legacy-default-eur',
      settings: { defaultCurrency: 'EUR' },
      currency: 'EUR',
      stripeSupported: true,
    },
    {
      id: 'locale-rub-fallback',
      settings: { locale: { currency: 'RUB' } },
      currency: 'RUB',
      stripeSupported: true,
    },
    {
      id: 'usd-default',
      settings: {},
      currency: 'USD',
      stripeSupported: true,
    },
    {
      id: 'invalid-code-fallback',
      settings: { currency: 'BOGUS', defaultCurrency: 'GEL' },
      currency: 'GEL',
      stripeSupported: true,
    },
  ])(
    'public profile currency pipeline for $id',
    ({ settings, currency, stripeSupported }) => {
      const business = baseBusiness(settings);
      const profile = publicBookingService.toPublicProfile(business);

      expect(getBusinessDefaultCurrency(settings)).toBe(currency);
      expect(profile.currency).toBe(currency);
      expect(profile.stripeCurrencySupported).toBe(stripeSupported);
      expect(isStripeChargeCurrencySupported(currency)).toBe(stripeSupported);
    },
  );

  it('exposes currency on profile for checkout display consumers', () => {
    const profile = publicBookingService.toPublicProfile(
      baseBusiness({ currency: 'CHF' }),
    );
    expect(profile.currency).toBe('CHF');
    expect(profile).toHaveProperty('stripeCurrencySupported');
  });
});
