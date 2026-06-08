import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import { BusinessService } from './business.service.js';
import { createPublicBookingServiceHarness } from '../public-booking/public-booking-test.harness.js';
import type { PublicBookingService } from '../public-booking/public-booking.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { ServiceService } from '../service/service.service.js';
import { BookingPaymentService } from '../booking/booking-payment.service.js';
import {
  getBusinessDefaultCurrency,
  isStripeChargeCurrencySupported,
  resolvePriceCurrency,
} from '../../common/utils/business-currency.util.js';
import type { Business } from './entities/business.entity.js';

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

describe('Sprint 28 — business currency pipeline integration', () => {
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

  const services: Array<Record<string, unknown>> = [];
  const serviceRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const id = (value.id as string) ?? `svc-${services.length + 1}`;
      const saved = {
        isActive: true,
        prepaymentMode: PrepaymentMode.NONE,
        ...value,
        id,
      };
      services.push(saved);
      return saved;
    }),
    findOne: jest.fn(
      async ({ where }: { where: { id: string } }) =>
        services.find((s) => s.id === where.id) ?? null,
    ),
  };
  const serviceService = new ServiceService(
    serviceRepo as never,
    { findOne: jest.fn() } as never,
    businessRepo as never,
    { publish: jest.fn() } as never,
    { isConnectReady: jest.fn().mockReturnValue(true) } as never,
  );
  const checkoutPricingService = { calculate: jest.fn() };
  const bookingPaymentService = new BookingPaymentService(
    {} as never,
    serviceRepo as never,
    businessRepo as never,
    { isConfigured: false } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    checkoutPricingService as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => {
    services.length = 0;
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'AMD', stripeConnect: { chargesEnabled: true } },
    });
  });

  it.each([
    {
      id: 'amd-business-new-service',
      settings: { currency: 'AMD' },
      createCurrency: undefined,
      serviceCurrency: 'AMD',
      checkoutCurrency: 'AMD',
      stripeSupported: true,
    },
    {
      id: 'legacy-eur-service-on-amd-business',
      settings: { currency: 'AMD' },
      createCurrency: 'EUR',
      serviceCurrency: 'EUR',
      checkoutCurrency: 'EUR',
      stripeSupported: true,
    },
    {
      id: 'missing-service-currency-fallback',
      settings: { currency: 'GEL' },
      createCurrency: undefined,
      serviceCurrency: 'GEL',
      checkoutCurrency: 'GEL',
      stripeSupported: true,
    },
  ])(
    'settings → service → checkout pipeline for $id',
    async ({
      settings,
      createCurrency,
      serviceCurrency,
      checkoutCurrency,
      stripeSupported,
    }) => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          currency: settings.currency,
          stripeConnect: { chargesEnabled: true },
        },
      });

      const created = await serviceService.create('biz-1', {
        name: 'Cut',
        durationMinutes: 30,
        price: 100,
        ...(createCurrency ? { currency: createCurrency } : {}),
      });
      expect(created.currency).toBe(serviceCurrency);

      const profile = publicBookingService.toPublicProfile(
        baseBusiness(settings),
      );
      expect(profile.currency).toBe(getBusinessDefaultCurrency(settings));
      expect(profile.stripeCurrencySupported).toBe(stripeSupported);
      expect(isStripeChargeCurrencySupported(checkoutCurrency)).toBe(
        stripeSupported,
      );

      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings,
      });
      await bookingPaymentService.resolveCheckoutPricing(
        'biz-1',
        {
          id: created.id,
          name: 'Cut',
          price: 100,
          currency: created.currency,
          prepaymentMode: PrepaymentMode.FULL,
        } as never,
        {
          serviceId: created.id,
          startTime: new Date().toISOString(),
          customer: { name: 'Jane' },
        },
      );

      expect(resolvePriceCurrency(created.currency, settings)).toBe(
        checkoutCurrency,
      );
      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({ currency: checkoutCurrency }),
      );
    },
  );

  it('persists normalized currency via business settings update', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {},
    });
    await businessService.update('biz-1', { settings: { currency: 'eur' } });
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          currency: 'EUR',
          defaultCurrency: 'EUR',
        }),
      }),
    );
  });

  it('rejects invalid currency on service create', async () => {
    await expect(
      serviceService.create('biz-1', {
        name: 'Bad',
        durationMinutes: 30,
        price: 10,
        currency: 'BOGUS',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
