import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  createEmptyBookingPopularityRepoMock,
  createPublicBookingServiceHarness,
} from './public-booking-test.harness.js';
import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';
import type { Business } from '../business/entities/business.entity.js';

export function createTourPublicBookingHarness(options?: {
  tourService?: Record<string, unknown>;
}) {
  const storedBookings: Array<Record<string, unknown>> = [];

  const business = {
    id: 'biz-tour',
    name: 'Alpine Tours',
    slug: 'alpine-tours',
    timezone: 'UTC',
    isActive: true,
    settings: {
      locale: 'en',
      publicBooking: { enabled: true },
    },
  } as unknown as Business;

  const tourService = options?.tourService ?? {
    id: 'svc-tour-1',
    businessId: 'biz-tour',
    name: '3-Day Mountain Trek',
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    price: 320,
    durationMinutes: 4320,
    bufferMinutes: 0,
    currency: 'USD',
    metadata: {
      serviceType: TOUR_SERVICE_TYPE,
      maxGroupSize: 8,
      durationDays: 3,
      difficulty: 'challenging',
      coverImage: '/placeholders/tours/mountain-trek.jpg',
    },
  };

  const bookingPaymentService = {
    resolveCheckoutPricing: jest.fn().mockResolvedValue({
      amountDue: 960,
      subtotal: 960,
      totalDiscount: 0,
    }),
    pricingMetadata: jest.fn().mockReturnValue({ pricing: { amountDue: 960 } }),
    resolveFulfillmentCheckoutPricing: jest.fn(
      (_recalculated: unknown, frozen?: unknown) => frozen ?? _recalculated,
    ),
  };

  const bookingService = {
    create: jest.fn(
      async (
        _bizId: string,
        dto: Record<string, unknown>,
        _user?: unknown,
        opts?: { paymentStatus?: PaymentStatus },
      ) => ({
        id: 'book-tour-1',
        ...dto,
        paymentStatus: opts?.paymentStatus,
      }),
    ),
  };

  const customerService = {
    findOrCreateByContact: jest.fn().mockResolvedValue({
      customer: { id: 'cust-1', name: 'Alex' },
      created: false,
    }),
  };

  const businessService = {
    findBySlug: jest.fn().mockResolvedValue(business),
    findOne: jest.fn().mockResolvedValue(business),
  };

  const bookingRepo = createTourBookingRepo(storedBookings);

  const service = createPublicBookingServiceHarness({
    businessService,
    bookingService,
    customerService,
    bookingPaymentService,
    checkoutPricingService: { applyRedemptions: jest.fn() },
    notificationsService: { sendMultiAppointmentConfirmation: jest.fn() },
    configService: {
      get: jest.fn(() => 'https://app.test'),
    } as unknown as ConfigService,
    referralProgramService: { find: jest.fn() },
    serviceRepo: { findOne: jest.fn().mockResolvedValue(tourService) },
    slotRepo: { find: jest.fn(), createQueryBuilder: jest.fn() },
    schedulingPeriodRepo: { find: jest.fn() },
    bookingRepo,
  });

  return {
    service,
    business,
    tourService,
    bookingService,
    bookingPaymentService,
    storedBookings,
    bookingRepo,
  };
}

function createTourBookingRepo(storedBookings: Array<Record<string, unknown>>) {
  return {
    ...createEmptyBookingPopularityRepoMock(),
    find: jest.fn().mockImplementation(async () => storedBookings),
    findOne: jest.fn(
      async ({ where }: { where: { id: string } }) =>
        storedBookings.find((b) => b.id === where.id) ?? {
          id: where.id,
          metadata: {},
        },
    ),
    save: jest.fn(async (booking: Record<string, unknown>) => {
      const idx = storedBookings.findIndex((b) => b.id === booking.id);
      if (idx >= 0) storedBookings[idx] = booking;
      else storedBookings.push(booking);
      return booking;
    }),
  };
}
