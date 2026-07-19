import { BadRequestException } from '@nestjs/common';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { createPublicBookingServiceHarness } from './public-booking-test.harness.js';
import {
  applyPublicPaymentSettingsToBusinessSettings,
  resolvePublicPaymentSettings,
} from '../../common/utils/customer-self-service.util.js';
import {
  ensureBookingManageToken,
  generateBookingManageToken,
} from '../../common/utils/booking-manage-token.util.js';

describe('Public booking cash + manage token integration', () => {
  const business = {
    id: 'biz-1',
    slug: 'salon',
    isActive: true,
    settings: applyPublicPaymentSettingsToBusinessSettings(
      {},
      { acceptCashPayments: true },
    ),
  };

  const serviceEntity = {
    id: 'svc-1',
    businessId: 'biz-1',
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    price: 30,
    durationMinutes: 30,
    bufferMinutes: 0,
  };

  const storedBookings = new Map<string, Record<string, unknown>>();

  const businessService = {
    findBySlug: jest.fn(async () => business),
    findOne: jest.fn(async () => business),
  };
  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(true),
  };
  const bookingPaymentService = {
    resolveCheckoutPricing: jest.fn().mockResolvedValue({
      amountDue: 30,
      subtotal: 30,
      totalDiscount: 0,
    }),
    pricingMetadata: jest.fn().mockReturnValue({ pricing: { amountDue: 30 } }),
    resolveFulfillmentCheckoutPricing: jest.fn(
      (_recalculated: unknown, frozen?: unknown) => frozen ?? _recalculated,
    ),
  };
  const checkoutPricingService = {
    applyRedemptions: jest.fn().mockResolvedValue(undefined),
  };
  const customerService = {
    findOrCreateByContact: jest.fn().mockResolvedValue({
      customer: { id: 'cust-1', name: 'Jane' },
      created: false,
    }),
  };
  const bookingService = {
    create: jest.fn(
      async (
        _bizId: string,
        dto: Record<string, unknown>,
        _user?: unknown,
        opts?: { paymentStatus?: PaymentStatus },
      ) => {
        // Mirror BookingService.create — stamp manageToken with the row.
        const metadata = {
          ...((dto.metadata as Record<string, unknown>) || {}),
          manageToken: generateBookingManageToken(),
        };
        const booking = {
          id: 'book-cash-1',
          ...dto,
          metadata,
          paymentStatus: opts?.paymentStatus,
        };
        storedBookings.set('book-cash-1', booking);
        return booking;
      },
    ),
  };
  const serviceRepo = {
    findOne: jest.fn(async () => serviceEntity),
  };
  const bookingRepo = {
    findOne: jest.fn(
      async ({ where }: { where: { id: string } }) =>
        storedBookings.get(where.id) ?? null,
    ),
    save: jest.fn(async (b: Record<string, unknown>) => {
      storedBookings.set(String(b.id), b);
      return b;
    }),
    // e2e-bug.120 / api-bug.6 — ensureBookingManageToken uses FOR UPDATE tx
    manager: {
      transaction: jest.fn(async (cb: (m: unknown) => Promise<unknown>) => {
        const manager = {
          createQueryBuilder: () => ({
            setLock: () => ({
              where: (_clause: string, params: { bookingId: string }) => ({
                getOne: async () => {
                  const row = storedBookings.get(params.bookingId);
                  return row
                    ? {
                        ...row,
                        metadata: {
                          ...((row.metadata as Record<string, unknown>) || {}),
                        },
                      }
                    : null;
                },
              }),
            }),
          }),
          save: async (_entity: unknown, booking: Record<string, unknown>) => {
            storedBookings.set(String(booking.id), { ...booking });
            return booking;
          },
        };
        return cb(manager);
      }),
    },
  };
  const configService = { get: jest.fn(() => 'https://app.test') };

  const publicBookingService = createPublicBookingServiceHarness({
    businessService: businessService,
    bookingService: bookingService,
    customerService: customerService,
    stripeIntegrationService: stripeIntegrationService as any,
    bookingPaymentService: bookingPaymentService,
    checkoutPricingService: checkoutPricingService,
    notificationsService: {
      sendMultiAppointmentConfirmation: jest.fn(),
    },
    configService: configService as any,
    serviceRepo: serviceRepo,
    bookingRepo: bookingRepo,
  });

  beforeEach(() => {
    storedBookings.clear();
    jest.clearAllMocks();
    business.settings = applyPublicPaymentSettingsToBusinessSettings(
      {},
      { acceptCashPayments: true },
    );
  });

  it('creates cash booking with pending payment and manage token', async () => {
    const result = await publicBookingService.createBooking('salon', {
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      paymentMethod: 'cash',
      customer: { name: 'Jane', email: 'jane@example.com' },
    });

    expect(
      resolvePublicPaymentSettings(business.settings).acceptCashPayments,
    ).toBe(true);
    expect(bookingService.create).toHaveBeenCalledWith(
      business.id,
      expect.objectContaining({
        metadata: expect.objectContaining({
          paymentMethod: 'cash',
          payAtVenue: true,
        }),
      }),
      undefined,
      { paymentStatus: PaymentStatus.PENDING },
    );
    expect(result.paymentMethod).toBe('cash');
    expect(result.manageToken).toMatch(/^[a-f0-9]{48}$/);
    expect(storedBookings.get('book-cash-1')?.metadata).toMatchObject({
      manageToken: result.manageToken,
    });
  });

  it('rejects cash when business disabled cash payments', async () => {
    business.settings = applyPublicPaymentSettingsToBusinessSettings(
      {},
      { acceptCashPayments: false },
    );
    await expect(
      publicBookingService.createBooking('salon', {
        employeeId: 'emp-1',
        serviceId: 'svc-1',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        paymentMethod: 'cash',
        customer: { name: 'Jane', email: 'jane@example.com' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects cash when service requires online prepayment', async () => {
    serviceRepo.findOne.mockResolvedValueOnce({
      ...serviceEntity,
      prepaymentMode: PrepaymentMode.FULL,
    });
    await expect(
      publicBookingService.createBooking('salon', {
        employeeId: 'emp-1',
        serviceId: 'svc-1',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        paymentMethod: 'cash',
        customer: { name: 'Jane', email: 'jane@example.com' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reuses manage token from ensureBookingManageToken after booking create', async () => {
    const result = await publicBookingService.createBooking('salon', {
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      customer: { name: 'Jane', email: 'jane@example.com' },
    });
    const again = await ensureBookingManageToken(
      bookingRepo as any,
      result.booking.id,
    );
    expect(again).toBe(result.manageToken);
  });

  it('e2e-bug.120 — create response manageToken matches persisted metadata under concurrent ensure', async () => {
    const result = await publicBookingService.createBooking('salon', {
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      customer: { name: 'Jane', email: 'jane@example.com' },
    });

    const persisted = storedBookings.get('book-cash-1')?.metadata as {
      manageToken?: string;
    };
    expect(result.manageToken).toMatch(/^[a-f0-9]{48}$/);
    expect(persisted?.manageToken).toBe(result.manageToken);
    expect(result.booking.metadata?.manageToken).toBe(result.manageToken);

    // Concurrent confirmation-email style ensures must not mint a different token.
    const [a, b] = await Promise.all([
      ensureBookingManageToken(bookingRepo as any, result.booking.id),
      ensureBookingManageToken(bookingRepo as any, result.booking.id),
    ]);
    expect(a).toBe(result.manageToken);
    expect(b).toBe(result.manageToken);
    expect(
      (storedBookings.get('book-cash-1')?.metadata as { manageToken?: string })
        ?.manageToken,
    ).toBe(result.manageToken);
  });

  it('e2e-bug.120 — legacy row without stamped token: ensure under lock matches response', async () => {
    bookingService.create.mockImplementationOnce(
      async (
        _bizId: string,
        dto: Record<string, unknown>,
        _user?: unknown,
        opts?: { paymentStatus?: PaymentStatus },
      ) => {
        const booking = {
          id: 'book-cash-1',
          ...dto,
          metadata: { ...((dto.metadata as Record<string, unknown>) || {}) },
          paymentStatus: opts?.paymentStatus,
        };
        storedBookings.set('book-cash-1', booking);
        return booking;
      },
    );

    const result = await publicBookingService.createBooking('salon', {
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      customer: { name: 'Jane', email: 'jane@example.com' },
    });

    expect(bookingRepo.manager.transaction).toHaveBeenCalled();
    expect(
      (storedBookings.get('book-cash-1')?.metadata as { manageToken?: string })
        ?.manageToken,
    ).toBe(result.manageToken);
  });

  it('allows cash booking when amount due remains after discounts', async () => {
    bookingPaymentService.resolveCheckoutPricing.mockResolvedValueOnce({
      amountDue: 15,
      subtotal: 50,
      totalDiscount: 35,
    });
    bookingPaymentService.pricingMetadata.mockReturnValueOnce({
      pricing: { amountDue: 15 },
    });

    const result = await publicBookingService.createBooking('salon', {
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      paymentMethod: 'cash',
      customer: { name: 'Jane', email: 'jane@example.com' },
    });

    expect(result.paymentMethod).toBe('cash');
    expect(result.amountDue).toBe(15);
    expect(bookingService.create).toHaveBeenCalledWith(
      business.id,
      expect.objectContaining({
        metadata: expect.objectContaining({
          paymentMethod: 'cash',
          payAtVenue: true,
        }),
      }),
      undefined,
      { paymentStatus: PaymentStatus.PENDING },
    );
  });

  it('rejects cash for deposit prepayment when amount due remains', async () => {
    serviceRepo.findOne.mockResolvedValueOnce({
      ...serviceEntity,
      prepaymentMode: PrepaymentMode.DEPOSIT,
    });
    bookingPaymentService.resolveCheckoutPricing.mockResolvedValueOnce({
      amountDue: 20,
      subtotal: 30,
      totalDiscount: 0,
    });

    await expect(
      publicBookingService.createBooking('salon', {
        employeeId: 'emp-1',
        serviceId: 'svc-1',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        paymentMethod: 'cash',
        customer: { name: 'Jane', email: 'jane@example.com' },
      }),
    ).rejects.toThrow('pay in cash is not available');
  });

  it('allows cash for deposit services when nothing is due at checkout', async () => {
    serviceRepo.findOne.mockResolvedValueOnce({
      ...serviceEntity,
      prepaymentMode: PrepaymentMode.DEPOSIT,
    });
    bookingPaymentService.resolveCheckoutPricing.mockResolvedValueOnce({
      amountDue: 0,
      subtotal: 30,
      totalDiscount: 30,
    });
    bookingPaymentService.pricingMetadata.mockReturnValueOnce({
      pricing: { amountDue: 0 },
    });

    const result = await publicBookingService.createBooking('salon', {
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      paymentMethod: 'cash',
      customer: { name: 'Jane', email: 'jane@example.com' },
    });

    expect(result.paymentMethod).toBe('cash');
  });
});
