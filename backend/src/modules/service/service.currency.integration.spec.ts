import { BadRequestException } from '@nestjs/common';
import { PrepaymentMode } from './entities/service.entity.js';
import { ServiceService } from './service.service.js';
import { BookingPaymentService } from '../booking/booking-payment.service.js';
import { resolvePriceCurrency } from '../../common/utils/business-currency.util.js';

describe('Sprint 28 — service currency enforcement integration', () => {
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

  const businessRepo = {
    findOne: jest.fn(),
  };

  const serviceService = new ServiceService(
    serviceRepo as never,
    { findOne: jest.fn() } as never,
    businessRepo as never,
    { publish: jest.fn() } as never,
    { isConnectReady: jest.fn().mockReturnValue(true) } as never,
  
    undefined as never);

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
      settings: { currency: 'AMD' },
    });
  });

  it.each([
    {
      id: 'create-defaults-to-business',
      action: 'create' as const,
      input: { name: 'Cut', durationMinutes: 30, price: 5000 },
      expected: 'AMD',
    },
    {
      id: 'create-explicit-eur',
      action: 'create' as const,
      input: {
        name: 'Color',
        durationMinutes: 90,
        price: 80,
        currency: 'EUR',
      },
      expected: 'EUR',
    },
    {
      id: 'legacy-eur-unchanged-on-price-update',
      action: 'update-price' as const,
      seed: { currency: 'EUR' },
      expected: 'EUR',
    },
    {
      id: 'legacy-eur-updated-when-edited',
      action: 'update-currency' as const,
      seed: { currency: 'EUR' },
      patch: { currency: 'GEL' },
      expected: 'GEL',
    },
  ])('$id', async ({ action, input, seed, patch, expected }) => {
    if (action === 'create') {
      const created = await serviceService.create('biz-1', input);
      expect(created.currency).toBe(expected);
      return;
    }

    const created = await serviceService.create('biz-1', {
      name: 'Legacy',
      durationMinutes: 30,
      price: 100,
      ...seed,
    });

    if (action === 'update-price') {
      const updated = await serviceService.update(created.id, { price: 120 });
      expect(updated.currency).toBe(expected);
      return;
    }

    const updated = await serviceService.update(created.id, patch);
    expect(updated.currency).toBe(expected);
  });

  it.each([
    {
      id: 'service-eur-checkout',
      serviceCurrency: 'EUR',
      businessCurrency: 'AMD',
      resolved: 'EUR',
    },
    {
      id: 'missing-service-currency',
      serviceCurrency: null,
      businessCurrency: 'AMD',
      resolved: 'AMD',
    },
    {
      id: 'invalid-service-currency',
      serviceCurrency: 'NOTREAL',
      businessCurrency: 'GEL',
      resolved: 'GEL',
    },
  ])(
    'checkout resolvePriceCurrency for $id',
    async ({ serviceCurrency, businessCurrency, resolved }) => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { currency: businessCurrency },
      });

      await bookingPaymentService.resolveCheckoutPricing(
        'biz-1',
        {
          id: 'svc-1',
          name: 'Massage',
          price: 50,
          currency: serviceCurrency,
          prepaymentMode: PrepaymentMode.FULL,
        } as never,
        {
          serviceId: 'svc-1',
          startTime: new Date().toISOString(),
          customer: { name: 'Jane' },
        },
      );

      expect(
        resolvePriceCurrency(serviceCurrency, { currency: businessCurrency }),
      ).toBe(resolved);
      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({ currency: resolved }),
      );
    },
  );

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

  it('rejects invalid currency on service update', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Cut',
      durationMinutes: 30,
      price: 20,
      currency: 'USD',
    });

    await expect(
      serviceService.update(created.id, { currency: 'BOGUS' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
