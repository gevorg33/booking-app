import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiBookingDepthService } from './ai-booking-depth.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { ServicePackage } from '../service-packages/entities/service-package.entity.js';
import { BookingService } from '../booking/booking.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { SchedulingResourcesService } from '../resources/scheduling-resources.service.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';

describe('Sprint 26 dashboard booking AI scenarios', () => {
  const customers = [{ id: 'c1', name: 'Maria Lopez' }] as any[];
  const services = [
    {
      id: 's1',
      name: 'Nail Care',
      durationMinutes: 45,
      bufferMinutes: 5,
      price: 50,
      currency: 'USD',
      categoryId: 'cat-1',
    },
    {
      id: 's2',
      name: 'Haircut',
      durationMinutes: 30,
      bufferMinutes: 5,
      price: 40,
      currency: 'USD',
      categoryId: 'cat-1',
    },
    {
      id: 's3',
      name: 'Beard Trim',
      durationMinutes: 15,
      bufferMinutes: 0,
      price: 20,
      currency: 'USD',
      categoryId: 'cat-1',
    },
  ] as any[];
  const employees = [{ id: 'e1', name: 'Anna Kim' }] as any[];

  const bookingFind = jest.fn().mockResolvedValue([]);
  const bookingFindOne = jest.fn().mockResolvedValue(null);
  const bookingRepo = {
    find: bookingFind,
    findOne: bookingFindOne,
    manager: {
      transaction: jest.fn(async (fn: (m: unknown) => Promise<void>) => fn({})),
    },
  };
  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'biz-1',
      settings: {
        publicBooking: {
          acceptCashPayments: true,
          customerSelfService: {
            allowCancel: true,
            allowReschedule: true,
            minimumNoticeHours: 24,
          },
        },
      },
    }),
  };
  const packageRepo = {
    find: jest.fn().mockResolvedValue([
      {
        id: 'pkg-1',
        name: 'Spa Day',
        isActive: true,
        items: [{ service: services[0] }, { service: services[1] }],
      },
    ]),
  };
  const bookingService = {
    create: jest.fn(async (_b, dto) => ({ id: `bk-${dto.serviceId}`, ...dto })),
    cancel: jest.fn(async () => ({})),
    update: jest.fn(async () => ({})),
    findOne: jest.fn(),
  };
  const subscriptionsService = {
    getActiveForCustomerService: jest.fn().mockResolvedValue({ id: 'sub-1' }),
  };
  const packagesService = {
    previewFromPackage: jest.fn(() => ({
      pricing: { packagePrice: 100 },
      currency: 'USD',
    })),
    createPackagePurchase: jest.fn(async () => ({ id: 'purchase-1' })),
  };
  const multiServiceBookingsService = {
    resolveSettingsFromBusiness: jest.fn(() => ({
      schedulingMode: 'same_visit',
      turnoverBufferMinutes: 5,
    })),
    previewTotals: jest.fn(async () => ({
      totals: { totalPrice: 60, totalDurationMinutes: 45 },
    })),
    createGroup: jest.fn(async () => ({ id: 'group-1' })),
  };
  const resourcesService = {
    listResources: jest.fn().mockResolvedValue([{ id: 'r1', name: 'Room 2' }]),
    assignToBooking: jest.fn(),
  };

  let bookingDepth: AiBookingDepthService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    bookingFind.mockResolvedValue([]);
    bookingFindOne.mockResolvedValue(null);
    subscriptionsService.getActiveForCustomerService.mockResolvedValue({
      id: 'sub-1',
    });

    const module = await Test.createTestingModule({
      providers: [
        AiBookingDepthService,
        AiIntentRescueService,
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(ServicePackage), useValue: packageRepo },
        { provide: BookingService, useValue: bookingService },
        {
          provide: ServiceSubscriptionsService,
          useValue: subscriptionsService,
        },
        { provide: ServicePackagesService, useValue: packagesService },
        {
          provide: MultiServiceBookingsService,
          useValue: multiServiceBookingsService,
        },
        { provide: SchedulingResourcesService, useValue: resourcesService },
      ],
    }).compile();

    bookingDepth = module.get(AiBookingDepthService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('intent rescue (ai-cmd-b1/b2)', () => {
    it('rescues subscription credit from create_booking', () => {
      const result = rescue.rescue({
        prompt:
          'Book Maria for nail care using her subscription credit tomorrow 10am',
        action: 'create_booking',
        params: {},
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('create_booking_subscription_credit');
      expect(result?.rescued).toBe(true);
    });

    it('rescues cash pay-at-venue from create_booking', () => {
      const result = rescue.rescue({
        prompt: 'Book walk-in haircut tomorrow 3pm pay at venue',
        action: 'create_booking',
        params: {},
        employees: [],
      });
      expect(result?.action).toBe('create_booking_cash');
    });

    it('rescues package and multi-service creates from unknown', () => {
      expect(
        rescue.rescue({
          prompt: 'Book spa day package for James Friday 2pm',
          action: 'unknown',
          params: {},
          employees: [],
        })?.action,
      ).toBe('create_package_booking');

      expect(
        rescue.rescue({
          prompt: 'Book haircut and beard trim Tuesday 10am with Anna',
          action: 'unknown',
          params: {},
          employees: employees.map((e) => ({ id: e.id, name: e.name })),
        })?.action,
      ).toBe('create_multi_service_booking');
    });

    it('rescues list, cancel, reschedule, mark paid, assign, and policy intents', () => {
      expect(
        rescue.rescue({
          prompt: 'Show pay at venue appointments today',
          action: 'unknown',
          params: {},
          employees: [],
        })?.action,
      ).toBe('list_cash_pending_bookings');
      expect(
        rescue.rescue({
          prompt: 'list package visits this week',
          action: 'unknown',
          params: {},
          employees: [],
        })?.action,
      ).toBe('list_package_bookings');
      expect(
        rescue.rescue({
          prompt: 'show multi-service groups today',
          action: 'unknown',
          params: {},
          employees: [],
        })?.action,
      ).toBe('list_multi_service_bookings');
      expect(
        rescue.rescue({
          prompt: 'cancel package visit for booking b1',
          action: 'unknown',
          params: {},
          employees: [],
        })?.action,
      ).toBe('cancel_package_visit');
      expect(
        rescue.rescue({
          prompt: 'cancel multi-service appointment b2',
          action: 'unknown',
          params: {},
          employees: [],
        })?.action,
      ).toBe('cancel_multi_service_group');
      expect(
        rescue.rescue({
          prompt: 'reschedule package visit to Friday 10am',
          action: 'unknown',
          params: {},
          employees: [],
        })?.action,
      ).toBe('reschedule_package_visit');
      expect(
        rescue.rescue({
          prompt: 'move multi-service to 3pm',
          action: 'unknown',
          params: {},
          employees: [],
        })?.action,
      ).toBe('reschedule_multi_service_group');
      expect(
        rescue.rescue({
          prompt: 'mark booking b1 paid',
          action: 'unknown',
          params: {},
          employees: [],
        })?.action,
      ).toBe('mark_paid');
      expect(
        rescue.rescue({
          prompt: 'assign room 2 to the 2pm facial',
          action: 'unknown',
          params: {},
          employees: [],
        })?.action,
      ).toBe('assign_booking_resource');
      expect(
        rescue.rescue({
          prompt: 'Can this customer still cancel?',
          action: 'unknown',
          params: {},
          employees: [],
        })?.action,
      ).toBe('explain_booking_policy');
    });

    it('does not rescue when action already matches', () => {
      expect(
        rescue.rescue({
          prompt: 'mark booking paid',
          action: 'mark_paid',
          params: {},
          employees: [],
        }),
      ).toBeNull();
    });
  });

  describe('service end-to-end flows', () => {
    const resolveCustomer = (list: any[], name: string) =>
      list.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));
    const resolveService = (list: any[], name: string) =>
      list.find((s) => s.name.toLowerCase().includes(name.toLowerCase()));
    const resolveEmployee = (list: any[], name: string) =>
      list.find((e) => e.name.toLowerCase().includes(name.toLowerCase()));
    const resolveServices = (list: any[], params: Record<string, any>) =>
      (params.serviceNames ?? [])
        .map((n: string) => resolveService(list, n))
        .filter(Boolean);

    it('prepares subscription credit and cash booking params', async () => {
      const sub = await bookingDepth.prepareSubscriptionCreditParams(
        'biz-1',
        { customerName: 'Maria', serviceName: 'Nail' },
        customers,
        services,
        resolveCustomer,
        resolveService,
      );
      expect(sub.ok).toBe(true);
      if (sub.ok) expect(sub.params.useSubscriptionId).toBe('sub-1');

      const cash = bookingDepth.prepareCashCreateParams(
        { serviceName: 'Cut' },
        { publicBooking: { acceptCashPayments: true } },
      );
      expect(cash.ok).toBe(true);
    });

    it('lists cash pending bookings and explains policy', async () => {
      bookingFind.mockResolvedValueOnce([
        {
          id: 'b1',
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PENDING,
          metadata: { payAtVenue: true },
          startTime: new Date(),
        },
      ]);
      const list = await bookingDepth.handleListCashPending('biz-1', 'today', {
        date: new Date().toISOString().slice(0, 10),
      });
      expect(list.success).toBe(true);
      expect((list.details as any).count).toBe(1);

      bookingFindOne.mockResolvedValueOnce({
        id: 'b1',
        businessId: 'biz-1',
        startTime: new Date(Date.now() + 72 * 3600000),
        status: BookingStatus.CONFIRMED,
        metadata: {},
        customer: { name: 'Sofia' },
        service: { name: 'Massage' },
      });
      const policy = await bookingDepth.handleExplainPolicy('biz-1', {
        bookingId: 'b1',
      });
      expect(policy.success).toBe(true);
      expect(policy.summary).toContain('Sofia');
    });

    it('creates multi-service and package bookings through the service', async () => {
      const multi = await bookingDepth.handleCreateMultiServiceBooking(
        'biz-1',
        {
          serviceNames: ['Haircut', 'Beard'],
          employeeName: 'Anna',
          customerName: 'Maria',
          date: '2026-06-12',
          timeSlot: '10:00',
        },
        { settings: {} } as any,
        employees,
        services,
        customers,
        resolveEmployee,
        resolveServices,
        resolveCustomer,
        'user-1',
      );
      expect(multi.success).toBe(true);
      expect(bookingService.create).toHaveBeenCalled();

      const pkg = await bookingDepth.handleCreatePackageBooking(
        'biz-1',
        {
          packageName: 'Spa Day',
          customerName: 'Maria',
          employeeName: 'Anna',
          date: '2026-06-12',
          timeSlot: '10:00',
        },
        { settings: {} } as any,
        employees,
        services,
        customers,
        resolveEmployee,
        resolveCustomer,
        'user-1',
      );
      expect(pkg.success).toBe(true);
      expect(packagesService.createPackagePurchase).toHaveBeenCalled();
    });

    it('cancels, reschedules, marks paid, and assigns resources', async () => {
      const visitBooking = {
        id: 'b1',
        businessId: 'biz-1',
        packagePurchaseId: 'p1',
        multiServiceGroupId: 'g1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-10T10:00:00.000Z'),
        employeeId: 'e1',
        metadata: { payAtVenue: true },
        customer: { name: 'Leo' },
      };
      bookingFindOne.mockResolvedValue(visitBooking);
      bookingFind.mockResolvedValue([visitBooking]);

      expect(
        (
          await bookingDepth.handleCancelPackageVisit(
            'biz-1',
            { bookingId: 'b1' },
            'u1',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await bookingDepth.handleCancelMultiServiceGroup(
            'biz-1',
            { bookingId: 'b1' },
            'u1',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await bookingDepth.handleReschedulePackageVisit(
            'biz-1',
            { bookingId: 'b1', date: '2026-06-12', timeSlot: '11:00' },
            'u1',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await bookingDepth.handleRescheduleMultiServiceGroup(
            'biz-1',
            { bookingId: 'b1', date: '2026-06-12', timeSlot: '14:00' },
            'u1',
          )
        ).success,
      ).toBe(true);
      expect(
        (await bookingDepth.handleMarkPaid('biz-1', { bookingId: 'b1' }, 'u1'))
          .success,
      ).toBe(true);
      expect(
        (
          await bookingDepth.handleAssignResource(
            'biz-1',
            { bookingId: 'b1', resourceName: 'room 2' },
            'u1',
          )
        ).success,
      ).toBe(true);
    });
  });
});
