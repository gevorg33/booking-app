import { ConfigService } from '@nestjs/config';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { BookingPaymentService } from '../booking/booking-payment.service.js';
import { createPublicBookingServiceHarness } from './public-booking-test.harness.js';
import type { CheckoutPricingResult } from '../promo-codes/checkout-pricing.types.js';

const taxPricing = (
  overrides: Partial<CheckoutPricingResult> = {},
): CheckoutPricingResult => ({
  servicePrice: 100,
  subtotal: 100,
  afterPromo: 100,
  afterGiftCard: 100,
  promoDiscount: 0,
  giftCardDiscount: 0,
  loyaltyDiscount: 0,
  totalDiscount: 0,
  amountDue: 120,
  currency: 'USD',
  loyaltyPointsToRedeem: 0,
  loyaltyPointsBalance: 0,
  pointsToEarn: 0,
  adjustments: [],
  taxEnabled: true,
  taxName: 'VAT',
  taxRate: 20,
  taxModel: 'exclusive',
  taxAmount: 20,
  netAmount: 100,
  ...overrides,
});

function createPricingPaymentService(): BookingPaymentService {
  return new BookingPaymentService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
}

describe('Sprint 36 — public booking Stripe tax fulfillment', () => {
  const pricingPaymentService = createPricingPaymentService();
  const storedBookings = new Map<string, Record<string, unknown>>();

  const business = {
    id: 'biz-1',
    slug: 'salon',
    isActive: true,
    settings: {
      locale: 'en',
      branding: { primaryColor: '#000' },
      publicBooking: { enabled: true },
      integrations: { stripe: { connectAccountId: 'acct_1' } },
    },
  };

  const serviceEntity = {
    id: 'svc-1',
    businessId: 'biz-1',
    isActive: true,
    prepaymentMode: PrepaymentMode.FULL,
    price: 100,
    durationMinutes: 60,
    bufferMinutes: 0,
    currency: 'USD',
  };

  const bookingPaymentService = {
    resolveCheckoutPricing: jest.fn(),
    resolvePackageCheckoutPricing: jest.fn(),
    resolveMultiServiceCheckoutPricing: jest.fn(),
    resolveFulfillmentCheckoutPricing: jest
      .fn()
      .mockImplementation((recalculated, frozen) =>
        pricingPaymentService.resolveFulfillmentCheckoutPricing(
          recalculated,
          frozen,
        ),
      ),
    pricingMetadata: jest
      .fn()
      .mockImplementation((pricing) =>
        pricingPaymentService.pricingMetadata(pricing),
      ),
  };

  const bookingService = {
    create: jest.fn(
      async (
        _bizId: string,
        dto: Record<string, unknown>,
        _user?: unknown,
        opts?: { paymentStatus?: PaymentStatus },
      ) => {
        const booking = {
          id: `book-${storedBookings.size + 1}`,
          ...dto,
          paymentStatus: opts?.paymentStatus,
        };
        storedBookings.set(String(booking.id), booking);
        return booking;
      },
    ),
  };

  const businessService = {
    findBySlug: jest.fn(async () => business),
    findOne: jest.fn(async () => business),
  };
  const customerService = {
    findOrCreateByContact: jest.fn(async () => ({
      customer: { id: 'cust-1', name: 'Jane' },
      created: false,
    })),
  };
  const serviceRepo = {
    findOne: jest.fn(async () => serviceEntity),
    find: jest.fn(),
  };

  const publicBookingService = createPublicBookingServiceHarness({
    businessService: businessService,
    bookingService: bookingService,
    customerService: customerService,
    stripeIntegrationService: {
      isConnectReady: jest.fn().mockReturnValue(true),
    } as never,
    bookingPaymentService: bookingPaymentService,
    checkoutPricingService: {
      applyRedemptions: jest.fn().mockResolvedValue(undefined),
    },
    packagesService: {
      assertPackageBookable: jest.fn(async () => ({
        id: 'pkg-1',
        name: 'Glow Package',
        items: [],
      })),
      expectedLineServiceIds: jest.fn(() => ['svc-1']),
      previewFromPackage: jest.fn(() => ({
        currency: 'USD',
        pricing: { packagePrice: 200 },
      })),
      createPackagePurchase: jest.fn(async () => ({ id: 'purchase-1' })),
    },
    multiServiceBookingsService: {
      resolveSettingsFromBusiness: jest.fn(() => ({
        turnoverBufferMinutes: 5,
        schedulingMode: 'per_service',
      })),
      createGroup: jest.fn(async () => ({ id: 'group-1' })),
      previewTotals: jest.fn(async () => ({
        valid: true,
        services: [
          { serviceId: 'svc-1', durationMinutes: 60, bufferMinutes: 0 },
        ],
        totals: { totalPrice: 130, currency: 'USD' },
      })),
      loadServicesForSelection: jest.fn(async () => [
        {
          serviceId: 'svc-1',
          name: 'Cut',
          durationMinutes: 60,
          bufferMinutes: 0,
          price: 130,
          currency: 'USD',
        },
      ]),
    },
    notificationsService: {
      sendMultiAppointmentConfirmation: jest.fn(),
    },
    configService: {
      get: jest.fn(() => 'https://app.test'),
    } as unknown as ConfigService,
    serviceRepo: serviceRepo,
    slotRepo: { find: jest.fn(), createQueryBuilder: jest.fn() },
    schedulingPeriodRepo: { find: jest.fn() },
    bookingRepo: {
      findOne: jest.fn(
        async ({ where }: { where: { id: string } }) =>
          storedBookings.get(where.id) ?? null,
      ),
      save: jest.fn(async (booking: Record<string, unknown>) => {
        storedBookings.set(String(booking.id), booking);
        return booking;
      }),
    },
  });

  beforeEach(() => {
    storedBookings.clear();
    jest.clearAllMocks();
    jest
      .spyOn(publicBookingService, 'resolveEmployeeForServiceSlot')
      .mockResolvedValue({ employeeId: 'emp-1' });
    jest
      .spyOn(publicBookingService as never, 'validateMultiServiceBlockAt')
      .mockResolvedValue(true);
    jest
      .spyOn(publicBookingService as never, 'loadOrderedMultiServiceLines')
      .mockResolvedValue([
        {
          serviceId: 'svc-1',
          name: 'Cut',
          durationMinutes: 60,
          bufferMinutes: 0,
          price: 130,
          currency: 'USD',
        },
      ]);
    jest
      .spyOn(
        publicBookingService as never,
        'findQualifiedMultiServiceEmployees',
      )
      .mockResolvedValue([
        { id: 'emp-1', name: 'Alex', serviceIds: ['svc-1'] },
      ]);
    jest
      .spyOn(
        publicBookingService as never,
        'assertMultiServiceAppointmentsAvailable',
      )
      .mockResolvedValue(undefined);
  });

  it('createBooking uses frozen Stripe checkout pricing for booking metadata', async () => {
    const recalculated = taxPricing({
      amountDue: 100,
      taxEnabled: false,
      taxAmount: 0,
      netAmount: 100,
    });
    const frozen = taxPricing({
      amountDue: 120,
      taxModel: 'exclusive',
      taxAmount: 20,
    });
    bookingPaymentService.resolveCheckoutPricing.mockResolvedValue(
      recalculated,
    );

    await publicBookingService.createBooking(
      'salon',
      {
        serviceId: 'svc-1',
        startTime: new Date().toISOString(),
        employeeId: 'emp-1',
        customer: { name: 'Jane', email: 'jane@test.com' },
        markPaid: true,
        metadata: { checkoutPricing: frozen },
      },
      undefined,
    );

    expect(
      bookingPaymentService.resolveFulfillmentCheckoutPricing,
    ).toHaveBeenCalledWith(recalculated, frozen);
    expect(bookingService.create).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        metadata: expect.objectContaining({
          pricing: expect.objectContaining({
            amountDue: 120,
            taxEnabled: true,
            taxAmount: 20,
            taxModel: 'exclusive',
          }),
          amountPaid: 120,
        }),
      }),
      undefined,
      expect.objectContaining({ paymentStatus: PaymentStatus.PAID }),
    );
  });

  it('bookPackage stores frozen stacked tax on first booking metadata', async () => {
    const recalculated = taxPricing({
      servicePrice: 200,
      subtotal: 200,
      amountDue: 200,
      taxEnabled: false,
      taxAmount: 0,
    });
    const frozen = taxPricing({
      servicePrice: 200,
      subtotal: 200,
      amountDue: 226,
      taxName: 'GST + PST',
      taxRate: 13,
      taxAmount: 26,
      netAmount: 200,
      taxRules: [
        { id: 'gst', name: 'GST', rate: 5, amount: 10 },
        { id: 'pst', name: 'PST', rate: 8, amount: 16 },
      ],
    });
    bookingPaymentService.resolvePackageCheckoutPricing.mockResolvedValue(
      recalculated,
    );

    await publicBookingService.bookPackage(
      'salon',
      {
        packageId: 'pkg-1',
        lines: [
          {
            serviceId: 'svc-1',
            employeeId: 'emp-1',
            startTime: new Date().toISOString(),
          },
        ],
        customer: { name: 'Jane', email: 'jane@test.com' },
        markPaid: true,
        metadata: { checkoutPricing: frozen },
      },
      undefined,
    );

    expect(bookingService.create).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        metadata: expect.objectContaining({
          pricing: expect.objectContaining({
            amountDue: 226,
            taxRules: [
              { id: 'gst', name: 'GST', rate: 5, amount: 10 },
              { id: 'pst', name: 'PST', rate: 8, amount: 16 },
            ],
          }),
          amountPaid: 226,
        }),
      }),
      undefined,
      expect.objectContaining({ paymentStatus: PaymentStatus.PAID }),
    );
  });

  it('bookMultiService uses frozen inclusive tax pricing for group metadata', async () => {
    const recalculated = taxPricing({
      servicePrice: 130,
      subtotal: 130,
      amountDue: 130,
      taxEnabled: false,
      taxAmount: 0,
    });
    const frozen = taxPricing({
      servicePrice: 130,
      subtotal: 130,
      amountDue: 130,
      taxModel: 'inclusive',
      taxAmount: 11.82,
      netAmount: 118.18,
      taxRate: 10,
      taxName: 'GST',
    });
    bookingPaymentService.resolveMultiServiceCheckoutPricing.mockResolvedValue(
      recalculated,
    );

    await publicBookingService.bookMultiService(
      'salon',
      {
        serviceIds: ['svc-1'],
        lines: [
          {
            serviceId: 'svc-1',
            employeeId: 'emp-1',
            startTime: new Date().toISOString(),
          },
        ],
        customer: { name: 'Jane', email: 'jane@test.com' },
        markPaid: true,
        metadata: { checkoutPricing: frozen },
      },
      undefined,
    );

    expect(bookingService.create).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        metadata: expect.objectContaining({
          pricing: expect.objectContaining({
            amountDue: 130,
            taxModel: 'inclusive',
            taxAmount: 11.82,
          }),
          amountPaid: 130,
        }),
      }),
      undefined,
      expect.objectContaining({ paymentStatus: PaymentStatus.PAID }),
    );
  });

  it('falls back to recalculated pricing when frozen checkout snapshot is invalid', async () => {
    const recalculated = taxPricing({ amountDue: 120 });
    bookingPaymentService.resolveCheckoutPricing.mockResolvedValue(
      recalculated,
    );

    await publicBookingService.createBooking(
      'salon',
      {
        serviceId: 'svc-1',
        startTime: new Date().toISOString(),
        employeeId: 'emp-1',
        customer: { name: 'Jane', email: 'jane@test.com' },
        markPaid: true,
        metadata: { checkoutPricing: { invalid: true } },
      },
      undefined,
    );

    expect(bookingService.create).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        metadata: expect.objectContaining({
          pricing: expect.objectContaining({
            amountDue: 120,
            taxEnabled: true,
          }),
        }),
      }),
      undefined,
      expect.any(Object),
    );
  });
});
