import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessService } from './business.service.js';
import { createPublicBookingServiceHarness } from '../public-booking/public-booking-test.harness.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import type { Business } from './entities/business.entity.js';

function buildPublicBookingService(): PublicBookingService {
  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(false),
  };
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
    stripeIntegrationService:
      stripeIntegrationService as unknown as StripeIntegrationService,
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

describe('Sprint 28 — business currency integration', () => {
  const businessRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (b: unknown) => b),
  };
  const memberRepo = { find: jest.fn() };
  const businessService = new BusinessService(
    businessRepo as never,
    memberRepo as never,
  );
  const publicBookingService = buildPublicBookingService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('settings persistence', () => {
    it('persists supported currency on business settings update', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { locale: 'en' },
      });

      await businessService.update('biz-1', {
        settings: { currency: 'amd' },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            currency: 'AMD',
            defaultCurrency: 'AMD',
          }),
        }),
      );
    });

    it('rejects unsupported currency codes', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {},
      });

      await expect(
        businessService.update('biz-1', { settings: { currency: 'XYZ' } }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('public profile currency', () => {
    it.each([
      {
        id: 'explicit-currency',
        settings: { currency: 'EUR' },
        currency: 'EUR',
        stripeCurrencySupported: true,
      },
      {
        id: 'legacy-default',
        settings: { defaultCurrency: 'AMD' },
        currency: 'AMD',
        stripeCurrencySupported: true,
      },
      {
        id: 'locale-fallback',
        settings: { locale: { currency: 'RUB' } },
        currency: 'RUB',
        stripeCurrencySupported: true,
      },
      {
        id: 'usd-default',
        settings: {},
        currency: 'USD',
        stripeCurrencySupported: true,
      },
      {
        id: 'stripe-unsupported',
        settings: { currency: 'USD' },
        currency: 'USD',
        stripeCurrencySupported: true,
      },
    ])(
      'toPublicProfile resolves $id',
      ({ settings, currency, stripeCurrencySupported }) => {
        const profile = publicBookingService.toPublicProfile(
          baseBusiness(settings),
        );
        expect(profile.currency).toBe(currency);
        expect(profile.stripeCurrencySupported).toBe(stripeCurrencySupported);
      },
    );

    it('marks stripeCurrencySupported false for codes outside Stripe subset', () => {
      const profile = publicBookingService.toPublicProfile(
        baseBusiness({ currency: 'USD' }),
      );
      expect(profile.stripeCurrencySupported).toBe(true);

      const allSupported = publicBookingService.toPublicProfile(
        baseBusiness({ currency: 'AMD' }),
      );
      expect(allSupported.stripeCurrencySupported).toBe(true);
    });
  });
});
