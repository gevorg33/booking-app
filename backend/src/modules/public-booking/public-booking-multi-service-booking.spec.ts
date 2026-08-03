import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { createPublicBookingServiceHarness } from './public-booking-test.harness.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import type { Business } from '../business/entities/business.entity.js';

describe('PublicBookingService bookMultiService same_visit', () => {
  const bookingService = {
    create: jest.fn(),
    validateMultiServiceBlockFits: jest.fn(),
  };
  const multiServiceBookingsService = {
    resolveSettingsFromBusiness: jest.fn(),
    previewTotals: jest.fn(),
    createGroup: jest.fn(),
    loadServicesForSelection: jest.fn(),
  };
  const bookingPaymentService = {
    resolveMultiServiceCheckoutPricing: jest.fn(),
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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(service, 'resolveBusiness').mockResolvedValue(business);
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
    multiServiceBookingsService.createGroup.mockResolvedValue({
      id: 'group-1',
      schedulingMode: 'same_visit',
    });
    bookingPaymentService.resolveMultiServiceCheckoutPricing.mockResolvedValue({
      amountDue: 0,
      subtotal: 125,
    });
    jest
      .spyOn(service as any, 'resolvePublicBookingCustomer')
      .mockResolvedValue({
        customer: { id: 'cust-1', name: 'Alex' },
        created: false,
      });
    jest
      .spyOn(service as any, 'validateMultiServiceBlockAt')
      .mockResolvedValue(true);
    jest
      .spyOn(service as any, 'assertMultiServiceAppointmentsAvailable')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'loadOrderedMultiServiceLines')
      .mockResolvedValue(serviceLines);
    jest
      .spyOn(service as any, 'loadMultiServiceNames')
      .mockResolvedValue(['Face Plasma', 'Face Pilling']);
    bookingService.create
      .mockResolvedValueOnce({ id: 'booking-1', serviceId: 'face-plasma' })
      .mockResolvedValueOnce({ id: 'booking-2', serviceId: 'face-pilling' });
    checkoutPricingService.applyRedemptions.mockResolvedValue(undefined);
  });

  it('creates every same-visit appointment with sameVisitMultiService on booking.create', async () => {
    const result = await service.bookMultiService('salon', {
      serviceIds: ['face-plasma', 'face-pilling'],
      blockStartTime: '2026-06-02T09:00:00.000Z',
      employeeId: 'emp-1',
      customer: { name: 'Alex', email: 'alex@example.com' },
      markPaid: true,
    });

    expect(bookingService.create).toHaveBeenCalledTimes(2);
    expect(bookingService.create).toHaveBeenNthCalledWith(
      1,
      'biz-1',
      expect.objectContaining({
        serviceId: 'face-plasma',
        employeeId: 'emp-1',
        multiServiceGroupId: 'group-1',
        startTime: '2026-06-02T09:00:00.000Z',
      }),
      undefined,
      { paymentStatus: PaymentStatus.PAID, sameVisitMultiService: true },
    );
    expect(bookingService.create).toHaveBeenNthCalledWith(
      2,
      'biz-1',
      expect.objectContaining({
        serviceId: 'face-pilling',
        employeeId: 'emp-1',
        multiServiceGroupId: 'group-1',
      }),
      undefined,
      { paymentStatus: PaymentStatus.PAID, sameVisitMultiService: true },
    );
    expect(result.bookings).toHaveLength(2);
    expect(
      notificationsService.sendMultiAppointmentConfirmation,
    ).toHaveBeenCalledWith(['booking-1', 'booking-2']);
  });

  it('stamps stripePaymentIntentId on every line for cancel refund eligibility (e2e-bug.35)', async () => {
    bookingService.create.mockReset();
    bookingService.create
      .mockResolvedValueOnce({ id: 'booking-1', serviceId: 'face-plasma' })
      .mockResolvedValueOnce({ id: 'booking-2', serviceId: 'face-pilling' });

    await service.bookMultiService('salon', {
      serviceIds: ['face-plasma', 'face-pilling'],
      blockStartTime: '2026-06-02T09:00:00.000Z',
      employeeId: 'emp-1',
      customer: { name: 'Alex', email: 'alex@example.com' },
      markPaid: true,
      metadata: {
        stripePaymentIntentId: 'pi_ms_1',
        stripeConnectAccountId: 'acct_1',
        stripeSessionId: 'sess_ms',
      },
    });

    expect(bookingService.create).toHaveBeenCalledTimes(2);
    for (const call of bookingService.create.mock.calls) {
      expect(call[1].metadata).toEqual(
        expect.objectContaining({
          stripePaymentIntentId: 'pi_ms_1',
          stripeConnectAccountId: 'acct_1',
          stripeSessionId: 'sess_ms',
        }),
      );
    }
    expect(multiServiceBookingsService.createGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          stripePaymentIntentId: 'pi_ms_1',
        }),
      }),
    );
  });

  it('does not set sameVisitMultiService for per_service scheduling', async () => {
    multiServiceBookingsService.resolveSettingsFromBusiness.mockReturnValue({
      ...business.settings.publicBooking!.multiService,
      schedulingMode: 'per_service',
    });
    bookingService.create.mockReset();
    bookingService.create
      .mockResolvedValueOnce({ id: 'booking-1' })
      .mockResolvedValueOnce({ id: 'booking-2' });

    await service.bookMultiService('salon', {
      serviceIds: ['face-plasma', 'face-pilling'],
      customer: { name: 'Alex', email: 'alex@example.com' },
      lines: [
        {
          serviceId: 'face-plasma',
          employeeId: 'emp-1',
          startTime: '2026-06-02T09:00:00.000Z',
        },
        {
          serviceId: 'face-pilling',
          employeeId: 'emp-1',
          startTime: '2026-06-02T10:00:00.000Z',
        },
      ],
      markPaid: true,
    });

    expect(bookingService.create).toHaveBeenCalledTimes(2);
    for (const call of bookingService.create.mock.calls) {
      expect(call[3]).toEqual({
        paymentStatus: PaymentStatus.PAID,
        sameVisitMultiService: false,
      });
    }
  });

  it('requires a block start time for same_visit checkout', async () => {
    await expect(
      service.bookMultiService('salon', {
        serviceIds: ['face-plasma', 'face-pilling'],
        customer: { name: 'Alex', email: 'alex@example.com' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('api-bug.7 — allows unpaid book when Connect ready but amountDue is 0 (all none)', async () => {
    stripeIntegrationService.isConnectReady.mockReturnValue(true);
    bookingPaymentService.resolveMultiServiceCheckoutPricing.mockResolvedValue({
      amountDue: 0,
      subtotal: 125,
    });

    const result = await service.bookMultiService('salon', {
      serviceIds: ['face-plasma', 'face-pilling'],
      blockStartTime: '2026-06-02T09:00:00.000Z',
      employeeId: 'emp-1',
      customer: { name: 'Alex', email: 'alex@example.com' },
    });

    expect(result.bookings).toHaveLength(2);
  });

  it('api-bug.7 — still requires online payment when amountDue > 0', async () => {
    stripeIntegrationService.isConnectReady.mockReturnValue(true);
    bookingPaymentService.resolveMultiServiceCheckoutPricing.mockResolvedValue({
      amountDue: 40,
      subtotal: 125,
    });

    await expect(
      service.bookMultiService('salon', {
        serviceIds: ['face-plasma', 'face-pilling'],
        blockStartTime: '2026-06-02T09:00:00.000Z',
        employeeId: 'emp-1',
        customer: { name: 'Alex', email: 'alex@example.com' },
      }),
    ).rejects.toThrow('Online payment is required for this booking');
  });

  describe('suggestMultiServicePerServiceLines (e2e-bug.217)', () => {
    it('expands suggest-block into lines when block succeeds', async () => {
      jest.spyOn(service, 'suggestMultiServiceBlock').mockResolvedValue({
        employeeId: 'emp-1',
        employeeName: 'Gevorg',
        dateKey: '2026-07-29',
        startTime: '2026-07-29T10:00:00.000Z',
      });
      jest
        .spyOn(service, 'findNearestBookableSlot')
        .mockResolvedValue(null);

      const result = await service.suggestMultiServicePerServiceLines(
        'salon',
        ['face-plasma', 'face-pilling'],
      );

      expect(service.suggestMultiServiceBlock).toHaveBeenCalledWith('salon', [
        'face-plasma',
        'face-pilling',
      ]);
      expect(service.findNearestBookableSlot).not.toHaveBeenCalled();
      expect(result.lines).toEqual([
        {
          serviceId: 'face-plasma',
          serviceName: 'Face Plasma',
          startTime: '2026-07-29T10:00:00.000Z',
          employeeId: 'emp-1',
          employeeName: 'Gevorg',
        },
        {
          serviceId: 'face-pilling',
          serviceName: 'Face Pilling',
          startTime: '2026-07-29T10:50:00.000Z',
          employeeId: 'emp-1',
          employeeName: 'Gevorg',
        },
      ]);
    });

    it('falls back to nearest-slot chain when block search fails', async () => {
      jest
        .spyOn(service, 'suggestMultiServiceBlock')
        .mockRejectedValue(
          new BadRequestException('No available block found for the selected services'),
        );
      jest
        .spyOn(service, 'findNearestBookableSlot')
        .mockResolvedValueOnce({
          startTime: '2026-07-30T09:00:00.000Z',
          employeeId: 'emp-a',
          employeeName: 'Ann',
        } as any)
        .mockResolvedValueOnce({
          startTime: '2026-07-30T10:00:00.000Z',
          employeeId: 'emp-b',
          employeeName: 'Bob',
        } as any);
      (service as any).serviceRepo.findOne
        .mockResolvedValueOnce({
          id: 'face-plasma',
          name: 'Face Plasma',
          durationMinutes: 45,
          bufferMinutes: 0,
        })
        .mockResolvedValueOnce({
          id: 'face-pilling',
          name: 'Face Pilling',
          durationMinutes: 60,
          bufferMinutes: 0,
        });

      const result = await service.suggestMultiServicePerServiceLines(
        'salon',
        ['face-plasma', 'face-pilling'],
      );

      expect(result.lines).toHaveLength(2);
      expect(result.lines[0].employeeId).toBe('emp-a');
      expect(result.lines[1].employeeId).toBe('emp-b');
      expect(service.findNearestBookableSlot).toHaveBeenCalledTimes(2);
      // Second search must start after first service + turnover (not at first start).
      expect(service.findNearestBookableSlot).toHaveBeenNthCalledWith(
        2,
        'salon',
        expect.objectContaining({
          serviceId: 'face-pilling',
          notBeforeTime: '2026-07-30T09:50:00.000Z',
        }),
      );
    });
  });
});
