import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';
import { PublicCustomerBookingService } from './public-customer-booking.service.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { applyCustomerSelfServiceToBusinessSettings } from '../../common/utils/customer-self-service.util.js';

describe('Public customer auth integration', () => {
  const futureStart = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const futureEnd = new Date(futureStart.getTime() + 60 * 60 * 1000);
  const business = {
    id: 'biz-1',
    slug: 'salon',
    isActive: true,
    settings: applyCustomerSelfServiceToBusinessSettings(
      {},
      {
        allowCancel: true,
        allowReschedule: true,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 3,
        allowProviderChangeOnReschedule: false,
      },
    ),
  };

  const customers = new Map<string, Record<string, unknown>>();
  const bookings: Array<Record<string, unknown>> = [];

  const businessService = {
    findBySlug: jest.fn(async (slug: string) => {
      if (slug !== business.slug) {
        throw new NotFoundException('Business not found');
      }
      return business;
    }),
  };

  const firebase = {
    isReady: true,
    verifyIdToken: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(() => 'signed-jwt'),
  } as unknown as JwtService;

  const bookingRepo = {
    find: jest.fn(async () => bookings),
    createQueryBuilder: jest.fn(() => {
      let targetCustomerId: string | null = null;
      let duplicateIds: string[] = [];
      const chain = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn((values: { customerId?: string }) => {
          targetCustomerId = values.customerId ?? null;
          return chain;
        }),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn((_sql: string, params?: Record<string, unknown>) => {
          if (params?.duplicateIds) {
            duplicateIds = params.duplicateIds as string[];
          }
          return chain;
        }),
        execute: jest.fn(async () => {
          if (!targetCustomerId) return;
          for (const booking of bookings) {
            if (duplicateIds.includes(String(booking.customerId))) {
              booking.customerId = targetCustomerId;
            }
          }
        }),
      };
      return chain;
    }),
  };

  const reviewRepo = {
    find: jest.fn(async () => []),
  };

  const customerRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (customer: Record<string, unknown>) => {
      const id = (customer.id as string) ?? `cust-${customers.size + 1}`;
      const saved = { ...customer, id };
      customers.set(id, saved);
      return saved;
    }),
    findOne: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      for (const customer of customers.values()) {
        if (
          customer.businessId === where.businessId &&
          customer.id === where.id &&
          customer.isActive === where.isActive
        ) {
          return { ...customer };
        }
      }
      return null;
    }),
    createQueryBuilder: jest.fn(() => {
      let emailFilter: string | undefined;
      let phoneFilter: string | undefined;
      let excludedCustomerId: string | undefined;
      const chain = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn((_sql: string, params?: Record<string, unknown>) => {
          if (params?.email) emailFilter = String(params.email);
          if (params?.phone) phoneFilter = String(params.phone);
          if (params?.customerId) excludedCustomerId = String(params.customerId);
          return chain;
        }),
        getOne: jest.fn(async () => {
          for (const customer of customers.values()) {
            if (customer.businessId !== business.id || customer.isActive !== true) continue;
            if (phoneFilter && customer.phone === phoneFilter) {
              return { ...customer };
            }
            if (
              emailFilter &&
              String(customer.email ?? '').toLowerCase() === emailFilter.toLowerCase()
            ) {
              return { ...customer };
            }
          }
          return null;
        }),
        getMany: jest.fn(async () => {
          const matches: Array<Record<string, unknown>> = [];
          for (const customer of customers.values()) {
            if (customer.businessId !== business.id || customer.isActive !== true) continue;
            if (excludedCustomerId && customer.id === excludedCustomerId) continue;
            const emailMatches =
              emailFilter &&
              String(customer.email ?? '').toLowerCase() === emailFilter.toLowerCase();
            const phoneMatches = phoneFilter && customer.phone === phoneFilter;
            if (emailMatches || phoneMatches) {
              matches.push({ ...customer });
            }
          }
          return matches;
        }),
      };
      return chain;
    }),
    update: jest.fn(async (criteria: { id: unknown }, values: Record<string, unknown>) => {
      const raw = criteria.id as { _value?: string[] } | string | string[];
      const ids = Array.isArray(raw)
        ? raw
        : typeof raw === 'string'
          ? [raw]
          : Array.isArray(raw?._value)
            ? raw._value
            : [];
      for (const id of ids) {
        const existing = customers.get(id);
        if (existing) customers.set(id, { ...existing, ...values });
      }
    }),
  };

  const publicCustomerBookingService = {
    enrichBookingItem: jest.fn((booking, settings, _reviewIds) => ({
      id: booking.id,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      serviceName: booking.service?.name ?? 'Service',
      employeeName: booking.employee?.name ?? 'Specialist',
      employeeId: booking.employeeId,
      serviceId: booking.serviceId,
      canReview: false,
      canCancel: true,
      canReschedule: true,
      policyMessage: null,
      rescheduleCount: 0,
      maxReschedules: settings.maxReschedulesPerBooking,
      allowProviderChangeOnReschedule: settings.allowProviderChangeOnReschedule,
    })),
  };

  const giftCardPurchaseService = {
    linkGuestPurchasesToCustomer: jest.fn().mockResolvedValue(undefined),
  };

  const eventEmitter = {
    emit: jest.fn(),
  };

  const service = new PublicCustomerAuthService(
    businessService as any,
    jwtService,
    firebase as any,
    publicCustomerBookingService as unknown as PublicCustomerBookingService,
    giftCardPurchaseService as any,
    eventEmitter as any,
    customerRepo as any,
    bookingRepo as any,
    reviewRepo as any,
  );

  beforeEach(() => {
    customers.clear();
    bookings.length = 0;
    jest.clearAllMocks();
    business.isActive = true;
    firebase.isReady = true;
  });

  it('creates a new customer on Google login and returns JWT', async () => {
    firebase.verifyIdToken.mockResolvedValue({
      email: 'Jane@Example.com',
      name: 'Jane Doe',
      uid: 'google-sub-1',
      picture: 'https://photo.test/jane.jpg',
    });

    const result = await service.loginWithGoogle('salon', 'google-id-token');

    expect(result.token).toBe('signed-jwt');
    expect(result.customer).toMatchObject({
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: expect.any(String),
        email: 'jane@example.com',
        businessId: business.id,
        type: 'public_customer',
      }),
    );
  });

  it('updates existing customer metadata on Google login', async () => {
    customers.set('cust-1', {
      id: 'cust-1',
      businessId: business.id,
      name: 'Old Name',
      email: 'jane@example.com',
      isActive: true,
      metadata: {},
    });

    firebase.verifyIdToken.mockResolvedValue({
      email: 'jane@example.com',
      name: 'Jane Doe',
      uid: 'google-sub-1',
      picture: 'https://photo.test/new.jpg',
    });

    const result = await service.loginWithGoogle('salon', 'google-id-token');
    expect(result.customer.name).toBe('Jane Doe');
    expect(customers.get('cust-1')?.metadata).toMatchObject({
      googleSub: 'google-sub-1',
      authProvider: 'google',
      photoUrl: 'https://photo.test/new.jpg',
    });
  });

  it('rejects Google login when Firebase is not configured', async () => {
    firebase.isReady = false;
    await expect(
      service.loginWithGoogle('salon', 'token'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid Google token', async () => {
    firebase.verifyIdToken.mockRejectedValue(new Error('bad token'));
    await expect(
      service.loginWithGoogle('salon', 'bad'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects Google account without email', async () => {
    firebase.verifyIdToken.mockResolvedValue({
      uid: 'sub',
      name: 'No Email User',
    });
    await expect(
      service.loginWithGoogle('salon', 'token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns profile and validates active customer session', async () => {
    customers.set('cust-1', {
      id: 'cust-1',
      businessId: business.id,
      name: 'Jane',
      email: 'jane@example.com',
      phone: '+15551234567',
      isActive: true,
    });

    const profile = service.getProfile(customers.get('cust-1') as any);
    expect(profile).toEqual({
      id: 'cust-1',
      name: 'Jane',
      email: 'jane@example.com',
      phone: '+15551234567',
    });

    await expect(
      service.getCustomerById(business.id, 'cust-1'),
    ).resolves.toMatchObject({
      id: 'cust-1',
    });
    await expect(
      service.getCustomerById(business.id, 'missing'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lists bookings for authenticated customer and rejects inactive business', async () => {
    customers.set('cust-1', {
      id: 'cust-1',
      businessId: business.id,
      name: 'Jane',
      email: 'jane@example.com',
      isActive: true,
    });
    bookings.push({
      id: 'book-1',
      businessId: business.id,
      customerId: 'cust-1',
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      startTime: futureStart,
      endTime: new Date(futureStart.getTime() + 3600000),
      employee: { name: 'Alex' },
      service: { name: 'Haircut' },
    });

    const listed = await service.listBookings('salon', 'cust-1');
    expect(listed.bookings).toHaveLength(1);
    expect(publicCustomerBookingService.enrichBookingItem).toHaveBeenCalled();

    business.isActive = false;
    await expect(
      service.listBookings('salon', 'cust-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('signs JWT with normalized email', () => {
    const token = service.signToken(
      {
        id: 'cust-9',
        name: 'Jane',
        email: 'Jane@Test.com',
        phone: null,
      } as any,
      business.id,
      'Jane@Test.com',
    );
    expect(token).toBe('signed-jwt');
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'jane@test.com' }),
    );
  });

  it('derives customer name from Google given and family names', async () => {
    firebase.verifyIdToken.mockResolvedValue({
      email: 'pat@example.com',
      given_name: 'Pat',
      family_name: 'Lee',
      uid: 'google-sub-2',
    });

    const result = await service.loginWithGoogle('salon', 'google-id-token');
    expect(result.customer.name).toBe('Pat Lee');
  });

  it('skips customer save when Google metadata is already up to date', async () => {
    customers.set('cust-2', {
      id: 'cust-2',
      businessId: business.id,
      name: 'Jane Doe',
      email: 'jane@example.com',
      isActive: true,
      metadata: {
        googleSub: 'google-sub-1',
        authProvider: 'google',
        photoUrl: 'https://photo.test/jane.jpg',
      },
    });

    firebase.verifyIdToken.mockResolvedValue({
      email: 'jane@example.com',
      name: 'Jane Doe',
      uid: 'google-sub-1',
      picture: 'https://photo.test/jane.jpg',
    });

    await service.loginWithGoogle('salon', 'google-id-token');
    expect(customerRepo.save).not.toHaveBeenCalled();
  });

  it('returns empty booking list without querying reviews', async () => {
    customers.set('cust-1', {
      id: 'cust-1',
      businessId: business.id,
      name: 'Jane',
      email: 'jane@example.com',
      isActive: true,
    });

    const listed = await service.listBookings('salon', 'cust-1');
    expect(listed.bookings).toEqual([]);
    expect(reviewRepo.find).not.toHaveBeenCalled();
  });

  it('derives customer name from email when Google profile has no display name', async () => {
    firebase.verifyIdToken.mockResolvedValue({
      email: 'solo@example.com',
      uid: 'google-sub-solo',
    });

    const result = await service.loginWithGoogle('salon', 'google-id-token');
    expect(result.customer.name).toBe('solo');
  });

  it('links Google account when existing customer metadata is empty', async () => {
    customers.set('cust-3', {
      id: 'cust-3',
      businessId: business.id,
      name: 'Legacy',
      email: 'legacy@example.com',
      isActive: true,
      metadata: null,
    });

    firebase.verifyIdToken.mockResolvedValue({
      email: 'legacy@example.com',
      name: 'Legacy User',
      uid: 'google-sub-legacy',
      picture: 'https://photo.test/legacy.jpg',
    });

    await service.loginWithGoogle('salon', 'google-id-token');
    expect(customers.get('cust-3')?.metadata).toMatchObject({
      googleSub: 'google-sub-legacy',
      authProvider: 'google',
    });
  });

  it('links guest bookings to the signed-in customer by email', async () => {
    customers.set('cust-auth', {
      id: 'cust-auth',
      businessId: business.id,
      name: 'Auth User',
      email: 'guest@example.com',
      phone: '+15550001111',
      isActive: true,
    });
    customers.set('cust-guest', {
      id: 'cust-guest',
      businessId: business.id,
      name: 'Guest User',
      email: null,
      phone: '+15550001111',
      isActive: true,
    });
    bookings.push({
      id: 'book-guest',
      businessId: business.id,
      customerId: 'cust-guest',
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.UNPAID,
      startTime: futureStart,
      endTime: futureEnd,
      employee: { id: 'emp-1', name: 'Alex' },
      service: { id: 'svc-1', name: 'Cut' },
    } as any);

    firebase.verifyIdToken.mockResolvedValue({
      email: 'guest@example.com',
      name: 'Auth User',
      uid: 'google-sub-guest',
    });

    await service.loginWithGoogle('salon', 'google-id-token');
    expect(bookings[0]?.customerId).toBe('cust-auth');
    expect(customers.get('cust-guest')?.isActive).toBe(false);
  });

  it('creates a phone session and merges guest bookings by phone', async () => {
    customers.set('cust-guest', {
      id: 'cust-guest',
      businessId: business.id,
      name: 'Guest User',
      email: null,
      phone: '+15550001111',
      isActive: true,
    });
    bookings.push({
      id: 'book-phone-guest',
      businessId: business.id,
      customerId: 'cust-guest',
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.UNPAID,
      startTime: futureStart,
      endTime: futureEnd,
    } as any);

    firebase.verifyIdToken.mockResolvedValue({
      phone_number: '+15550001111',
      uid: 'phone-sub-1',
    });

    const result = await service.loginWithPhone('salon', 'phone-id-token');
    expect(result.customer.phone).toBe('+15550001111');
    expect(bookings[0]?.customerId).toBe(result.customer.id);
    expect(customers.get('cust-guest')?.isActive).toBe(true);
  });

  it('ignores reviews without booking ids when listing bookings', async () => {
    customers.set('cust-1', {
      id: 'cust-1',
      businessId: business.id,
      name: 'Jane',
      email: 'jane@example.com',
      isActive: true,
    });
    bookings.push({
      id: 'book-9',
      businessId: business.id,
      customerId: 'cust-1',
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      startTime: futureStart,
      endTime: new Date(futureStart.getTime() + 3600000),
      employee: { name: 'Alex' },
      service: { name: 'Haircut' },
    });
    reviewRepo.find.mockResolvedValue([
      { bookingId: null },
      { bookingId: 'book-9' },
    ]);

    const listed = await service.listBookings('salon', 'cust-1');
    expect(listed.bookings).toHaveLength(1);
    expect(publicCustomerBookingService.enrichBookingItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      new Set(['book-9']),
    );
  });
});
