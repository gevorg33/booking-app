import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { PublicBookingService } from './public-booking.service.js';
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

  const service = new PublicBookingService(
    {
      findBySlug: jest.fn(),
    } as any,
    bookingService as any,
    {
      findOrCreatePublicCustomer: jest.fn(),
    } as any,
    {} as any,
    stripeIntegrationService as unknown as StripeIntegrationService,
    {} as any,
    bookingPaymentService as any,
    checkoutPricingService as any,
    {} as any,
    {} as any,
    {} as any,
    multiServiceBookingsService as any,
    notificationsService as any,
    config as unknown as ConfigService,
    { find: jest.fn() } as any,
    { findOne: jest.fn(), find: jest.fn() } as any,
    { find: jest.fn(), createQueryBuilder: jest.fn() } as any,
    { find: jest.fn() } as any,
  );

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
});
