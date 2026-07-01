import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { createPublicBookingServiceHarness } from './public-booking-test.harness.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import type { Business } from '../business/entities/business.entity.js';

function createPackagePublicBookingHarness() {
  const bookingService = {
    create: jest.fn(),
    validateMultiServiceBlockFits: jest.fn(),
  };
  const packagesService = {
    assertPackageBookable: jest.fn(),
    expectedLineServiceIds: jest.fn(),
    previewFromPackage: jest.fn(),
    createPackagePurchase: jest.fn(),
  };
  const multiServiceBookingsService = {
    resolveSettingsFromBusiness: jest.fn(),
    previewTotals: jest.fn(),
    loadServicesForSelection: jest.fn(),
  };
  const bookingPaymentService = {
    resolvePackageCheckoutPricing: jest.fn(),
    resolveFulfillmentCheckoutPricing: jest.fn(
      (_recalculated: unknown, frozen?: unknown) => frozen ?? _recalculated,
    ),
    pricingMetadata: jest.fn().mockReturnValue({ pricing: { amountDue: 0 } }),
  };
  const checkoutPricingService = {
    applyRedemptions: jest.fn(),
  };
  const notificationsService = {
    sendMultiAppointmentConfirmation: jest.fn().mockResolvedValue(undefined),
  };
  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(false),
  };
  const config = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
    ),
  };

  const service = createPublicBookingServiceHarness({
    businessService: { findBySlug: jest.fn() },
    bookingService: bookingService,
    customerService: { findOrCreatePublicCustomer: jest.fn() },
    stripeIntegrationService:
      stripeIntegrationService as unknown as StripeIntegrationService,
    bookingPaymentService: bookingPaymentService,
    checkoutPricingService: checkoutPricingService,
    packagesService: packagesService,
    multiServiceBookingsService: multiServiceBookingsService,
    notificationsService: notificationsService,
    configService: config as unknown as ConfigService,
    serviceRepo: { findOne: jest.fn(), find: jest.fn() },
    slotRepo: { find: jest.fn(), createQueryBuilder: jest.fn() },
    schedulingPeriodRepo: { find: jest.fn() },
  });

  const business: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    isActive: true,
    settings: {
      locale: 'en',
      branding: { primaryColor: '#000' },
      publicBooking: {
        enabled: true,
        multiService: {
          enabled: true,
          maxServiceCount: 5,
          maxDurationMinutes: 480,
          turnoverBufferMinutes: 5,
          schedulingMode: 'same_visit',
          incompatiblePairs: [],
          incompatibleCategoryPairs: [],
        },
      },
    },
  } as Business;

  const pkg = {
    id: 'pkg-1',
    name: 'Glow Package',
    items: [],
  };

  const serviceLines = [
    {
      serviceId: 'face-plasma',
      name: 'Face Plasma',
      durationMinutes: 45,
      bufferMinutes: 0,
      price: 120,
      currency: 'USD',
    },
    {
      serviceId: 'face-pilling',
      name: 'Face Pilling',
      durationMinutes: 60,
      bufferMinutes: 0,
      price: 5,
      currency: 'USD',
    },
  ];

  const validLines = [
    {
      serviceId: 'face-plasma',
      employeeId: 'emp-1',
      startTime: '2026-06-02T09:00:00.000Z',
    },
    {
      serviceId: 'face-pilling',
      employeeId: 'emp-1',
      startTime: '2026-06-02T09:50:00.000Z',
    },
  ];

  function seedPackageContext() {
    jest.spyOn(service, 'resolveBusiness').mockResolvedValue(business);
    packagesService.assertPackageBookable.mockResolvedValue(pkg);
    packagesService.expectedLineServiceIds.mockReturnValue([
      'face-plasma',
      'face-pilling',
    ]);
    packagesService.previewFromPackage.mockReturnValue({
      currency: 'USD',
      pricing: { packagePrice: 100 },
    });
    packagesService.createPackagePurchase.mockResolvedValue({
      id: 'purchase-1',
    });
    multiServiceBookingsService.resolveSettingsFromBusiness.mockReturnValue(
      business.settings.publicBooking!.multiService,
    );
    multiServiceBookingsService.previewTotals.mockResolvedValue({
      valid: true,
      totals: {
        blockDurationMinutes: 110,
        totalPrice: 125,
        currency: 'USD',
        serviceCount: 2,
        totalDurationMinutes: 105,
      },
      services: serviceLines,
    });
    multiServiceBookingsService.loadServicesForSelection.mockResolvedValue(
      serviceLines,
    );
    bookingPaymentService.resolvePackageCheckoutPricing.mockResolvedValue({
      amountDue: 0,
      subtotal: 100,
    });
    jest
      .spyOn(service as any, 'resolvePublicBookingCustomer')
      .mockResolvedValue({
        customer: { id: 'cust-1', name: 'Alex' },
        created: false,
      });
    jest
      .spyOn(service as any, 'loadOrderedMultiServiceLines')
      .mockResolvedValue(serviceLines);
    jest
      .spyOn(service as any, 'findQualifiedMultiServiceEmployees')
      .mockResolvedValue([
        {
          id: 'emp-1',
          name: 'Gevorg',
          serviceIds: ['face-plasma', 'face-pilling'],
        },
      ]);
    jest
      .spyOn(service as any, 'validateMultiServiceBlockAt')
      .mockResolvedValue(true);
    checkoutPricingService.applyRedemptions.mockResolvedValue(undefined);
    notificationsService.sendMultiAppointmentConfirmation.mockResolvedValue(
      undefined,
    );
  }

  return {
    service,
    bookingService,
    packagesService,
    multiServiceBookingsService,
    bookingPaymentService,
    checkoutPricingService,
    notificationsService,
    stripeIntegrationService,
    business,
    pkg,
    serviceLines,
    validLines,
    seedPackageContext,
  };
}

describe('PublicBookingService package same-day block scheduling', () => {
  const harness = createPackagePublicBookingHarness();

  beforeEach(() => {
    jest.clearAllMocks();
    harness.seedPackageContext();
    harness.bookingService.create
      .mockResolvedValueOnce({ id: 'booking-1', serviceId: 'face-plasma' })
      .mockResolvedValueOnce({ id: 'booking-2', serviceId: 'face-pilling' });
  });

  describe('suggestPackageBlock', () => {
    it('delegates to suggestMultiServiceBlock with expanded package service ids', async () => {
      const block = {
        employeeId: 'emp-1',
        employeeName: 'Gevorg',
        dateKey: '2026-06-02',
        startTime: '2026-06-02T09:00:00.000Z',
      };
      jest
        .spyOn(harness.service, 'suggestMultiServiceBlock')
        .mockResolvedValue(block);

      await expect(
        harness.service.suggestPackageBlock('salon', 'pkg-1'),
      ).resolves.toEqual(block);
      expect(harness.service.suggestMultiServiceBlock).toHaveBeenCalledWith(
        'salon',
        ['face-plasma', 'face-pilling'],
      );
    });

    it('throws when no provider can perform every included service', async () => {
      jest
        .spyOn(harness.service as any, 'findQualifiedMultiServiceEmployees')
        .mockResolvedValue([]);

      await expect(
        harness.service.suggestPackageBlock('salon', 'pkg-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getPackageBlockDaySlots', () => {
    it('delegates to getMultiServiceBlockDaySlots for the package services', async () => {
      const daySlots = {
        date: '2026-06-02',
        serviceIds: ['face-plasma', 'face-pilling'],
        totalDurationMinutes: 110,
        slots: [
          {
            startTime: '2026-06-02T09:00:00.000Z',
            endTime: '2026-06-02T10:50:00.000Z',
            employeeId: 'emp-1',
            employeeName: 'Gevorg',
          },
        ],
      };
      jest
        .spyOn(harness.service, 'getMultiServiceBlockDaySlots')
        .mockResolvedValue(daySlots);

      await expect(
        harness.service.getPackageBlockDaySlots('salon', 'pkg-1', '2026-06-02'),
      ).resolves.toEqual(daySlots);
      expect(harness.service.getMultiServiceBlockDaySlots).toHaveBeenCalledWith(
        'salon',
        ['face-plasma', 'face-pilling'],
        '2026-06-02',
      );
    });
  });

  describe('getPackageBlockProviders', () => {
    it('delegates to getMultiServiceBlockProviders with includeLaterDays', async () => {
      const providers = {
        providers: [
          {
            id: 'emp-1',
            name: 'Gevorg',
            earliestStartTime: '2026-06-02T09:00:00.000Z',
          },
        ],
      };
      jest
        .spyOn(harness.service, 'getMultiServiceBlockProviders')
        .mockResolvedValue(providers);

      await expect(
        harness.service.getPackageBlockProviders(
          'salon',
          'pkg-1',
          '2026-06-02T09:00:00.000Z',
          true,
        ),
      ).resolves.toEqual(providers);
      expect(
        harness.service.getMultiServiceBlockProviders,
      ).toHaveBeenCalledWith(
        'salon',
        ['face-plasma', 'face-pilling'],
        '2026-06-02T09:00:00.000Z',
        true,
      );
    });
  });

  describe('suggestPackageLineSlots', () => {
    it('returns sequential same-day lines from the earliest package block', async () => {
      jest.spyOn(harness.service, 'suggestPackageBlock').mockResolvedValue({
        employeeId: 'emp-1',
        employeeName: 'Gevorg',
        dateKey: '2026-06-02',
        startTime: '2026-06-02T09:00:00.000Z',
      });

      const result = await harness.service.suggestPackageLineSlots(
        'salon',
        'pkg-1',
      );

      expect(result.dateKey).toBe('2026-06-02');
      expect(result.blockStartTime).toBe('2026-06-02T09:00:00.000Z');
      expect(result.lines).toEqual([
        {
          serviceId: 'face-plasma',
          serviceName: 'Face Plasma',
          startTime: '2026-06-02T09:00:00.000Z',
          employeeId: 'emp-1',
          employeeName: 'Gevorg',
        },
        {
          serviceId: 'face-pilling',
          serviceName: 'Face Pilling',
          startTime: '2026-06-02T09:50:00.000Z',
          employeeId: 'emp-1',
          employeeName: 'Gevorg',
        },
      ]);
    });

    it('throws when no same-day block is available', async () => {
      jest
        .spyOn(harness.service, 'suggestPackageBlock')
        .mockRejectedValue(new BadRequestException('No available block found'));

      await expect(
        harness.service.suggestPackageLineSlots('salon', 'pkg-1'),
      ).rejects.toThrow('No available same-day block found for this package');
    });
  });

  describe('bookPackage', () => {
    it('creates every appointment with sameVisitMultiService for multi-service packages', async () => {
      const result = await harness.service.bookPackage('salon', {
        packageId: 'pkg-1',
        lines: harness.validLines,
        customer: { name: 'Alex', email: 'alex@example.com' },
        markPaid: true,
      });

      expect(harness.bookingService.create).toHaveBeenCalledTimes(2);
      expect(harness.bookingService.create).toHaveBeenNthCalledWith(
        1,
        'biz-1',
        expect.objectContaining({
          serviceId: 'face-plasma',
          employeeId: 'emp-1',
          packagePurchaseId: 'purchase-1',
          startTime: '2026-06-02T09:00:00.000Z',
        }),
        undefined,
        { paymentStatus: PaymentStatus.PAID, sameVisitMultiService: true },
      );
      expect(harness.bookingService.create).toHaveBeenNthCalledWith(
        2,
        'biz-1',
        expect.objectContaining({
          serviceId: 'face-pilling',
          employeeId: 'emp-1',
          packagePurchaseId: 'purchase-1',
        }),
        undefined,
        { paymentStatus: PaymentStatus.PAID, sameVisitMultiService: true },
      );
      expect(result.bookings).toHaveLength(2);
      expect(
        harness.notificationsService.sendMultiAppointmentConfirmation,
      ).toHaveBeenCalledWith([expect.any(String), expect.any(String)]);
    });

    it('does not set sameVisitMultiService for single-service packages', async () => {
      harness.packagesService.expectedLineServiceIds.mockReturnValue([
        'face-plasma',
      ]);
      jest
        .spyOn(harness.service as any, 'loadOrderedMultiServiceLines')
        .mockResolvedValue([harness.serviceLines[0]]);
      harness.bookingService.create.mockReset();
      harness.bookingService.create.mockResolvedValue({
        id: 'booking-1',
        serviceId: 'face-plasma',
      });

      await harness.service.bookPackage('salon', {
        packageId: 'pkg-1',
        lines: [harness.validLines[0]],
        customer: { name: 'Alex', email: 'alex@example.com' },
        markPaid: true,
      });

      expect(harness.bookingService.create).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ serviceId: 'face-plasma' }),
        undefined,
        { paymentStatus: PaymentStatus.PAID, sameVisitMultiService: false },
      );
    });

    it('requires email or phone', async () => {
      await expect(
        harness.service.bookPackage('salon', {
          packageId: 'pkg-1',
          lines: harness.validLines,
          customer: { name: 'Alex' },
        }),
      ).rejects.toThrow('Email or phone number is required');
    });

    it('rejects package lines scheduled on different days', async () => {
      await expect(
        harness.service.bookPackage('salon', {
          packageId: 'pkg-1',
          lines: [
            harness.validLines[0],
            {
              ...harness.validLines[1],
              startTime: '2026-06-03T09:50:00.000Z',
            },
          ],
          customer: { name: 'Alex', email: 'alex@example.com' },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects non-sequential same-day lines', async () => {
      await expect(
        harness.service.bookPackage('salon', {
          packageId: 'pkg-1',
          lines: [
            harness.validLines[0],
            {
              ...harness.validLines[1],
              startTime: '2026-06-02T11:00:00.000Z',
            },
          ],
          customer: { name: 'Alex', email: 'alex@example.com' },
        }),
      ).rejects.toThrow(
        'Package services must be scheduled back-to-back on the same visit',
      );
    });

    it('rejects when the selected block is no longer available', async () => {
      jest
        .spyOn(harness.service as any, 'validateMultiServiceBlockAt')
        .mockResolvedValue(false);

      await expect(
        harness.service.bookPackage('salon', {
          packageId: 'pkg-1',
          lines: harness.validLines,
          customer: { name: 'Alex', email: 'alex@example.com' },
        }),
      ).rejects.toThrow('That time block is no longer available');
    });

    it('resolves missing employee ids and normalizes all lines to the primary provider', async () => {
      jest
        .spyOn(harness.service as any, 'resolveEmployeeForServiceSlot')
        .mockResolvedValue({
          employeeId: 'emp-2',
          employeeName: 'Anna',
        });

      await harness.service.bookPackage('salon', {
        packageId: 'pkg-1',
        lines: [
          { serviceId: 'face-plasma', startTime: '2026-06-02T09:00:00.000Z' },
          { serviceId: 'face-pilling', startTime: '2026-06-02T09:50:00.000Z' },
        ],
        customer: { name: 'Alex', email: 'alex@example.com' },
        markPaid: true,
      });

      expect(harness.bookingService.create).toHaveBeenCalledTimes(2);
      for (const call of harness.bookingService.create.mock.calls) {
        expect(call[1]).toEqual(
          expect.objectContaining({ employeeId: 'emp-2' }),
        );
      }
    });

    it('rejects when a line cannot be resolved to an available provider', async () => {
      jest
        .spyOn(harness.service as any, 'resolveEmployeeForServiceSlot')
        .mockResolvedValue(null);

      await expect(
        harness.service.bookPackage('salon', {
          packageId: 'pkg-1',
          lines: [
            { serviceId: 'face-plasma', startTime: '2026-06-02T09:00:00.000Z' },
            {
              serviceId: 'face-pilling',
              startTime: '2026-06-02T09:50:00.000Z',
            },
          ],
          customer: { name: 'Alex', email: 'alex@example.com' },
        }),
      ).rejects.toThrow(
        'One or more selected time slots are no longer available',
      );
    });

    it('requires online payment when Stripe is ready and amount is due', async () => {
      harness.stripeIntegrationService.isConnectReady.mockReturnValue(true);
      harness.bookingPaymentService.resolvePackageCheckoutPricing.mockResolvedValue(
        {
          amountDue: 50,
          subtotal: 100,
        },
      );

      await expect(
        harness.service.bookPackage('salon', {
          packageId: 'pkg-1',
          lines: harness.validLines,
          customer: { name: 'Alex', email: 'alex@example.com' },
        }),
      ).rejects.toThrow('Online payment is required for this package');
    });

    it('rejects mismatched bundled services', async () => {
      await expect(
        harness.service.bookPackage('salon', {
          packageId: 'pkg-1',
          lines: [
            {
              serviceId: 'other-service',
              startTime: '2026-06-02T09:00:00.000Z',
            },
          ],
          customer: { name: 'Alex', email: 'alex@example.com' },
        }),
      ).rejects.toThrow('Package line count does not match included services');
    });
  });
});
