import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  createEmptyBookingPopularityRepoMock,
  createPublicBookingServiceHarness,
} from './public-booking-test.harness.js';
import type { Business } from '../business/entities/business.entity.js';

function createClinicPublicBookingHarness() {
  const storedBookings: Array<Record<string, unknown>> = [];

  const business: Business = {
    id: 'biz-clinic',
    name: 'City Polyclinic',
    slug: 'city-poly',
    timezone: 'UTC',
    isActive: true,
    settings: {
      locale: 'en',
      publicBooking: { enabled: true },
    },
  } as Business;

  const labService = {
    id: 'svc-lab',
    businessId: 'biz-clinic',
    name: 'Lipid panel',
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    price: 35,
    durationMinutes: 15,
    bufferMinutes: 0,
    currency: 'USD',
    metadata: {
      serviceType: 'lab_test',
      requiresFasting: true,
      preparationNotes: 'Fast for 12 hours',
    },
    category: { id: 'cat-lab', name: 'Laboratory', sortOrder: 1, metadata: {} },
  };

  const consultationService = {
    id: 'svc-gp',
    businessId: 'biz-clinic',
    name: 'Initial consultation',
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    price: 0,
    durationMinutes: 30,
    bufferMinutes: 0,
    currency: 'USD',
    metadata: { serviceType: 'consultation' },
    category: {
      id: 'cat-gp',
      name: 'General Practice',
      sortOrder: 0,
      metadata: {},
    },
  };

  const haircutService = {
    id: 'svc-hair',
    businessId: 'biz-clinic',
    name: 'Haircut',
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    price: 40,
    durationMinutes: 30,
    bufferMinutes: 5,
    currency: 'USD',
    metadata: {},
    category: null,
  };

  const services = [labService, consultationService, haircutService];

  const bookingPaymentService = {
    resolveCheckoutPricing: jest.fn().mockResolvedValue({
      amountDue: 35,
      subtotal: 35,
      totalDiscount: 0,
    }),
    pricingMetadata: jest.fn().mockReturnValue({ pricing: { amountDue: 35 } }),
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
        id: 'book-clinic-1',
        ...dto,
        paymentStatus: opts?.paymentStatus,
      }),
    ),
  };

  const customerService = {
    findOrCreateByContact: jest.fn().mockResolvedValue({
      customer: { id: 'cust-1', name: 'Sam' },
      created: false,
    }),
  };

  const serviceRepo = {
    find: jest.fn(async () => services),
    findOne: jest.fn(
      async ({ where }: { where: { id: string } }) =>
        services.find((s) => s.id === where.id) ?? null,
    ),
  };

  const publicPreVisitIntakeService = {
    hasPublishedIntakeQuestionnaire: jest.fn().mockResolvedValue(true),
    linkIntakeToBooking: jest.fn().mockResolvedValue({ id: 'intake-1' }),
    serviceOffersPreVisitIntake: jest.fn(
      (_metadata: unknown, hasQuestionnaire: boolean) => hasQuestionnaire,
    ),
  };

  const checkoutPricingService = {
    applyRedemptions: jest.fn(),
  };

  const subscriptionsService = {
    serviceIdsWithActivePlans: jest.fn().mockResolvedValue([]),
  };

  const multiServiceBookingsService = {
    resolveSettingsFromBusiness: jest.fn().mockReturnValue({ enabled: false }),
  };

  const configService = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
    ),
  } as unknown as ConfigService;

  const service = createPublicBookingServiceHarness({
    businessService: {
      findBySlug: jest.fn().mockResolvedValue(business),
      findOne: jest.fn().mockResolvedValue(business),
    },
    bookingService: bookingService,
    customerService: customerService,
    stripeIntegrationService: {
      isConnectReady: jest.fn().mockReturnValue(false),
    } as any,
    bookingPaymentService: bookingPaymentService,
    checkoutPricingService: checkoutPricingService,
    subscriptionsService: subscriptionsService,
    multiServiceBookingsService: multiServiceBookingsService,
    notificationsService: {
      sendMultiAppointmentConfirmation: jest.fn(),
    },
    configService: configService,
    serviceRepo: serviceRepo,
    slotRepo: { find: jest.fn(), createQueryBuilder: jest.fn() },
    schedulingPeriodRepo: { find: jest.fn() },
    bookingRepo: createClinicBookingRepo(storedBookings),
    publicPreVisitIntakeService: publicPreVisitIntakeService,
  });

  return {
    service,
    business,
    labService,
    consultationService,
    haircutService,
    bookingService,
    bookingPaymentService,
    serviceRepo,
    storedBookings,
    publicPreVisitIntakeService,
  };
}

function createClinicBookingRepo(
  storedBookings: Array<Record<string, unknown>>,
) {
  return {
    ...createEmptyBookingPopularityRepoMock(),
    find: jest.fn(async () => storedBookings),
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

describe('Public booking clinic integration', () => {
  const startTime = '2026-09-10T10:00:00.000Z';

  it('maps clinic service fields on public service list', async () => {
    const harness = createClinicPublicBookingHarness();

    const result = await harness.service.getServices('city-poly');

    const lab = result.services.find((s) => s.id === 'svc-lab');
    const consult = result.services.find((s) => s.id === 'svc-gp');
    const haircut = result.services.find((s) => s.id === 'svc-hair');

    expect(lab).toMatchObject({
      isClinic: true,
      clinicServiceType: 'lab_test',
      clinicServiceTypeBadge: 'Lab test',
      requiresFasting: true,
      preparationNotes: 'Fast for 12 hours',
      acceptsPatientNotes: true,
      offersPreVisitIntake: true,
    });
    expect(consult).toMatchObject({
      isClinic: true,
      clinicServiceType: 'consultation',
      clinicServiceTypeBadge: 'Consultation',
      acceptsPatientNotes: true,
    });
    expect(haircut).toMatchObject({
      isClinic: false,
      acceptsPatientNotes: false,
    });
  });

  it('stores clinic referral and symptoms on booking metadata', async () => {
    const harness = createClinicPublicBookingHarness();

    const result = await harness.service.createBooking('city-poly', {
      employeeId: 'emp-1',
      serviceId: 'svc-lab',
      startTime,
      referralNotes: 'Referred by Dr. Lee',
      symptoms: 'Fatigue and dizziness',
      customer: { name: 'Sam', email: 'sam@example.com' },
    });

    expect(harness.bookingService.create).toHaveBeenCalledWith(
      harness.business.id,
      expect.objectContaining({
        metadata: expect.objectContaining({
          referralNotes: 'Referred by Dr. Lee',
          symptoms: 'Fatigue and dizziness',
        }),
      }),
      undefined,
      expect.objectContaining({ paymentStatus: PaymentStatus.PENDING }),
    );
    expect(result.booking.metadata).toMatchObject({
      referralNotes: 'Referred by Dr. Lee',
      symptoms: 'Fatigue and dizziness',
    });
  });

  it('trims whitespace from referral and symptoms before storing', async () => {
    const harness = createClinicPublicBookingHarness();

    await harness.service.createBooking('city-poly', {
      employeeId: 'emp-1',
      serviceId: 'svc-lab',
      startTime,
      referralNotes: '  Referred by Dr. Lee  ',
      symptoms: '  Fatigue  ',
      customer: { name: 'Sam', email: 'sam@example.com' },
    });

    expect(harness.bookingService.create).toHaveBeenCalledWith(
      harness.business.id,
      expect.objectContaining({
        metadata: expect.objectContaining({
          referralNotes: 'Referred by Dr. Lee',
          symptoms: 'Fatigue',
        }),
      }),
      undefined,
      expect.any(Object),
    );
  });

  it('omits clinic booking metadata when referral and symptoms are blank', async () => {
    const harness = createClinicPublicBookingHarness();

    await harness.service.createBooking('city-poly', {
      employeeId: 'emp-1',
      serviceId: 'svc-lab',
      startTime,
      referralNotes: '   ',
      symptoms: '',
      customer: { name: 'Sam', email: 'sam@example.com' },
    });

    const createCall = harness.bookingService.create.mock.calls[0]?.[1] as {
      metadata?: Record<string, unknown>;
    };
    expect(createCall.metadata?.referralNotes).toBeUndefined();
    expect(createCall.metadata?.symptoms).toBeUndefined();
  });

  it('stores symptoms only for consultation bookings', async () => {
    const harness = createClinicPublicBookingHarness();
    harness.bookingPaymentService.resolveCheckoutPricing.mockResolvedValue({
      amountDue: 0,
      subtotal: 0,
      totalDiscount: 0,
    });
    harness.bookingPaymentService.pricingMetadata.mockReturnValue({
      pricing: { amountDue: 0 },
    });

    await harness.service.createBooking('city-poly', {
      employeeId: 'emp-1',
      serviceId: 'svc-gp',
      startTime,
      symptoms: 'Persistent cough',
      customer: { name: 'Sam', email: 'sam@example.com' },
    });

    expect(harness.bookingService.create).toHaveBeenCalledWith(
      harness.business.id,
      expect.objectContaining({
        metadata: expect.objectContaining({
          symptoms: 'Persistent cough',
        }),
      }),
      undefined,
      expect.any(Object),
    );
    const createCall = harness.bookingService.create.mock.calls[0]?.[1] as {
      metadata?: Record<string, unknown>;
    };
    expect(createCall.metadata?.referralNotes).toBeUndefined();
  });

  it('does not attach clinic metadata for non-clinic services', async () => {
    const harness = createClinicPublicBookingHarness();
    harness.bookingPaymentService.resolveCheckoutPricing.mockResolvedValue({
      amountDue: 40,
      subtotal: 40,
      totalDiscount: 0,
    });

    await harness.service.createBooking('city-poly', {
      employeeId: 'emp-1',
      serviceId: 'svc-hair',
      startTime,
      referralNotes: 'Should be ignored',
      symptoms: 'Should be ignored',
      customer: { name: 'Sam', email: 'sam@example.com' },
    });

    const createCall = harness.bookingService.create.mock.calls[0]?.[1] as {
      metadata?: Record<string, unknown>;
    };
    expect(createCall.metadata?.referralNotes).toBeUndefined();
    expect(createCall.metadata?.symptoms).toBeUndefined();
  });

  it('rejects disabled public booking like standard flow', async () => {
    const harness = createClinicPublicBookingHarness();
    harness.business.settings = {
      ...harness.business.settings,
      publicBooking: { enabled: false },
    };

    await expect(
      harness.service.createBooking('city-poly', {
        employeeId: 'emp-1',
        serviceId: 'svc-lab',
        startTime,
        customer: { name: 'Sam', email: 'sam@example.com' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('links optional pre-visit intake when booking lab tests', async () => {
    const harness = createClinicPublicBookingHarness();

    await harness.service.createBooking('city-poly', {
      employeeId: 'emp-1',
      serviceId: 'svc-lab',
      startTime,
      preVisitIntakeId: 'intake-draft-1',
      customer: { name: 'Sam', email: 'sam@example.com' },
    });

    const publicIntake = harness.publicPreVisitIntakeService;
    expect(publicIntake.linkIntakeToBooking).toHaveBeenCalledWith(
      harness.business.id,
      'cust-1',
      'intake-draft-1',
      'book-clinic-1',
    );
  });

  it('exposes businessType on public profile for clinic vertical gating', async () => {
    const harness = createClinicPublicBookingHarness();
    harness.business.settings = {
      ...harness.business.settings,
      businessType: 'polyclinic',
    };

    const profile = harness.service.toPublicProfile(harness.business);

    expect(profile.businessType).toBe('polyclinic');
  });
});
