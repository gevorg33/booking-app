import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import {
  prepareSubscriptionCreditParamsLogic,
  prepareCashCreateParamsLogic,
  handleListCashPendingBookingsLogic,
  handleListPackageBookingsLogic,
  handleListMultiServiceBookingsLogic,
  handleExplainBookingPolicyLogic,
  handleCancelPackageVisitLogic,
  handleCancelMultiServiceGroupLogic,
  handleReschedulePackageVisitLogic,
  handleRescheduleMultiServiceGroupLogic,
  handleMarkPaidLogic,
  handleAssignBookingResourceLogic,
  handleCreateMultiServiceBookingLogic,
  handleCreatePackageBookingLogic,
  type BookingDepthLogicDeps,
} from './ai-booking-depth.logic.js';

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

function resolveCustomer(list: any[], name: string) {
  return list.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));
}
function resolveService(list: any[], name: string) {
  return list.find((s) => s.name.toLowerCase().includes(name.toLowerCase()));
}
function resolveEmployee(list: any[], name: string) {
  return list.find((e) => e.name.toLowerCase().includes(name.toLowerCase()));
}
function resolveServices(list: any[], params: Record<string, any>) {
  const names = params.serviceNames ?? [];
  return names.map((n: string) => resolveService(list, n)).filter(Boolean);
}

function buildDeps(
  overrides: Partial<BookingDepthLogicDeps> = {},
): BookingDepthLogicDeps {
  const manager = {
    transaction: jest.fn(async (fn: (m: unknown) => Promise<void>) => fn({})),
  };
  const baseBookingRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    manager,
  };
  const bookingRepo = overrides.bookingRepo
    ? {
        ...baseBookingRepo,
        ...overrides.bookingRepo,
        manager: overrides.bookingRepo.manager ?? manager,
      }
    : baseBookingRepo;
  return {
    bookingRepo: bookingRepo as any,
    businessRepo: {
      findOne: jest.fn().mockResolvedValue({ settings: {} }),
    } as any,
    packageRepo: { find: jest.fn().mockResolvedValue([]) } as any,
    bookingService: {
      create: jest.fn(async (_b, dto) => ({
        id: `bk-${dto.serviceId}`,
        ...dto,
      })),
      cancel: jest.fn(async () => ({})),
      update: jest.fn(async () => ({})),
      findOne: jest.fn(),
    },
    subscriptionsService: {
      getActiveForCustomerService: jest.fn().mockResolvedValue(null),
    },
    packagesService: {
      previewFromPackage: jest.fn(() => ({
        pricing: { packagePrice: 100 },
        currency: 'USD',
      })),
      createPackagePurchase: jest.fn(async () => ({ id: 'purchase-1' })),
    },
    multiServiceBookingsService: {
      resolveSettingsFromBusiness: jest.fn(() => ({
        schedulingMode: 'same_visit',
        turnoverBufferMinutes: 5,
      })),
      previewTotals: jest.fn(async () => ({
        totals: { totalPrice: 60, totalDurationMinutes: 45 },
      })),
      createGroup: jest.fn(async () => ({ id: 'group-1' })),
    },
    resourcesService: {
      listResources: jest
        .fn()
        .mockResolvedValue([{ id: 'r1', name: 'Room 2' }]),
      assignToBooking: jest.fn(async () => undefined),
    },
    ...overrides,
    bookingRepo: bookingRepo as any,
  };
}

describe('ai-booking-depth.logic', () => {
  describe('prepareSubscriptionCreditParamsLogic', () => {
    it('fails when customer or service missing', async () => {
      const deps = buildDeps();
      expect(
        (
          await prepareSubscriptionCreditParamsLogic(
            deps,
            'biz-1',
            {},
            customers,
            services,
            resolveCustomer,
            resolveService,
          )
        ).ok,
      ).toBe(false);
      expect(
        (
          await prepareSubscriptionCreditParamsLogic(
            deps,
            'biz-1',
            { customerName: 'Maria' },
            customers,
            services,
            resolveCustomer,
            resolveService,
          )
        ).ok,
      ).toBe(false);
    });

    it('fails when no active subscription', async () => {
      const deps = buildDeps();
      const result = await prepareSubscriptionCreditParamsLogic(
        deps,
        'biz-1',
        { customerName: 'Maria', serviceName: 'Nail' },
        customers,
        services,
        resolveCustomer,
        resolveService,
      );
      expect(result.ok).toBe(false);
    });

    it('succeeds with subscription credit by id or name', async () => {
      const deps = buildDeps({
        subscriptionsService: {
          getActiveForCustomerService: jest
            .fn()
            .mockResolvedValue({ id: 'sub-1' }),
        },
      });
      const byName = await prepareSubscriptionCreditParamsLogic(
        deps,
        'biz-1',
        { customerName: 'Maria', serviceName: 'Nail' },
        customers,
        services,
        resolveCustomer,
        resolveService,
      );
      expect(byName.ok).toBe(true);
      if (byName.ok) expect(byName.params.useSubscriptionId).toBe('sub-1');

      const byId = await prepareSubscriptionCreditParamsLogic(
        deps,
        'biz-1',
        { customerId: 'c1', serviceId: 's1' },
        customers,
        services,
        resolveCustomer,
        resolveService,
      );
      expect(byId.ok).toBe(true);
    });
  });

  describe('prepareCashCreateParamsLogic', () => {
    it('rejects when cash disabled and passes when enabled', () => {
      expect(prepareCashCreateParamsLogic({}, {}).ok).toBe(false);
      expect(
        prepareCashCreateParamsLogic(
          { serviceName: 'Cut' },
          { publicBooking: { acceptCashPayments: true } },
        ).ok,
      ).toBe(true);
    });
  });

  describe('list handlers', () => {
    it('lists cash pending bookings including empty range fallback', async () => {
      const deps = buildDeps({
        bookingRepo: {
          find: jest.fn().mockResolvedValue([
            {
              id: 'b1',
              status: BookingStatus.CONFIRMED,
              paymentStatus: PaymentStatus.PENDING,
              metadata: { paymentMethod: 'cash' },
              startTime: new Date(),
            },
          ]),
        } as any,
      });
      const withResults = await handleListCashPendingBookingsLogic(
        deps,
        'biz-1',
        'today',
        {
          date: new Date().toISOString().slice(0, 10),
        },
      );
      expect(withResults.success).toBe(true);
      expect((withResults.details as any).count).toBe(1);

      const empty = await handleListCashPendingBookingsLogic(
        buildDeps(),
        'biz-1',
        'today',
        {},
      );
      expect(empty.summary).toContain('No pay-at-venue');

      await handleListCashPendingBookingsLogic(
        buildDeps(),
        'biz-1',
        'pay at venue pending',
        {},
      );
    });

    it('lists package and multi-service bookings', async () => {
      const bookings = [
        {
          id: 'b1',
          packagePurchaseId: 'p1',
          multiServiceGroupId: 'g1',
          startTime: new Date(),
        },
        {
          id: 'b2',
          packagePurchaseId: 'p1',
          multiServiceGroupId: 'g1',
          startTime: new Date(),
        },
      ];
      const deps = buildDeps({
        bookingRepo: { find: jest.fn().mockResolvedValue(bookings) } as any,
      });

      const packages = await handleListPackageBookingsLogic(
        deps,
        'biz-1',
        'this week',
        {},
      );
      expect(packages.success).toBe(true);
      expect((packages.details as any).visitCount).toBe(1);

      const multi = await handleListMultiServiceBookingsLogic(
        deps,
        'biz-1',
        'today',
        {},
      );
      expect(multi.success).toBe(true);
      expect((multi.details as any).groupCount).toBe(1);

      const emptyPackages = await handleListPackageBookingsLogic(
        buildDeps(),
        'biz-1',
        'week',
        {},
      );
      expect(emptyPackages.summary).toContain('No package visits');

      const emptyMulti = await handleListMultiServiceBookingsLogic(
        buildDeps(),
        'biz-1',
        'today',
        {},
      );
      expect(emptyMulti.summary).toContain('No multi-service');

      await handleListMultiServiceBookingsLogic(
        buildDeps(),
        'biz-1',
        'multi-service',
        {},
      );
    });
  });

  describe('handleExplainBookingPolicyLogic', () => {
    it('requires booking id and handles not found', async () => {
      expect(
        (await handleExplainBookingPolicyLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);

      const deps = buildDeps();
      const missing = await handleExplainBookingPolicyLogic(deps, 'biz-1', {
        bookingId: 'missing',
      });
      expect(missing.success).toBe(false);
    });

    it('explains booking policy with missing business settings', async () => {
      const bookingRepo = {
        findOne: jest.fn(async () => ({
          id: 'b1',
          businessId: 'biz-1',
          startTime: new Date(Date.now() + 72 * 3600000),
          status: BookingStatus.CONFIRMED,
          metadata: {},
          customer: { name: 'Sofia' },
          service: { name: 'Massage' },
        })),
      };
      const businessRepo = { findOne: jest.fn(async () => null) };
      const result = await handleExplainBookingPolicyLogic(
        { bookingRepo: bookingRepo as any, businessRepo: businessRepo as any },
        'biz-1',
        { bookingId: 'b1' },
      );
      expect(result.success).toBe(true);
    });

    it('explains booking policy when booking id provided', async () => {
      const bookingRepo = {
        findOne: jest.fn(async () => ({
          id: 'b1',
          businessId: 'biz-1',
          startTime: new Date(Date.now() + 72 * 3600000),
          status: BookingStatus.CONFIRMED,
          metadata: {},
          customer: { name: 'Sofia' },
          service: { name: 'Massage' },
        })),
      };
      const businessRepo = {
        findOne: jest.fn(async () => ({
          settings: {
            publicBooking: {
              customerSelfService: {
                allowCancel: true,
                allowReschedule: false,
                minimumNoticeHours: 24,
                maxReschedulesPerBooking: 3,
              },
            },
          },
        })),
      };
      const result = await handleExplainBookingPolicyLogic(
        { bookingRepo: bookingRepo as any, businessRepo: businessRepo as any },
        'biz-1',
        { bookingId: 'b1' },
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('Sofia');
    });
  });

  describe('cancel and reschedule handlers', () => {
    it('cancels package visit appointments', async () => {
      const visit = [
        {
          id: 'b1',
          businessId: 'biz-1',
          packagePurchaseId: 'p1',
          status: BookingStatus.CONFIRMED,
        },
        {
          id: 'b2',
          businessId: 'biz-1',
          packagePurchaseId: 'p1',
          status: BookingStatus.CANCELLED,
        },
      ];
      const deps = buildDeps({
        bookingRepo: {
          findOne: jest.fn().mockResolvedValue(visit[0]),
          find: jest.fn().mockResolvedValue(visit),
        } as any,
      });

      expect(
        (await handleCancelPackageVisitLogic(deps, 'biz-1', {})).success,
      ).toBe(false);

      const notPackageDeps = buildDeps({
        bookingRepo: {
          findOne: jest
            .fn()
            .mockResolvedValue({ id: 'x', businessId: 'biz-1' }),
        } as any,
      });
      expect(
        (
          await handleCancelPackageVisitLogic(notPackageDeps, 'biz-1', {
            bookingId: 'x',
          })
        ).success,
      ).toBe(false);

      const noActiveDeps = buildDeps({
        bookingRepo: {
          findOne: jest.fn().mockResolvedValue({
            id: 'b1',
            businessId: 'biz-1',
            packagePurchaseId: 'p1',
          }),
          find: jest.fn().mockResolvedValue([
            {
              id: 'b1',
              status: BookingStatus.CANCELLED,
              packagePurchaseId: 'p1',
            },
          ]),
        } as any,
      });
      expect(
        (
          await handleCancelPackageVisitLogic(noActiveDeps, 'biz-1', {
            bookingId: 'b1',
          })
        ).success,
      ).toBe(false);

      const result = await handleCancelPackageVisitLogic(
        deps,
        'biz-1',
        { bookingId: 'b1' },
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(deps.bookingService.cancel).toHaveBeenCalled();
    });

    it('cancels multi-service group', async () => {
      const booking = {
        id: 'b1',
        businessId: 'biz-1',
        multiServiceGroupId: 'g1',
        status: BookingStatus.CONFIRMED,
      };
      const deps = buildDeps({
        bookingRepo: {
          findOne: jest.fn().mockResolvedValue(booking),
          find: jest.fn().mockResolvedValue([]),
        } as any,
      });

      expect(
        (await handleCancelMultiServiceGroupLogic(deps, 'biz-1', {})).success,
      ).toBe(false);

      const notGroupDeps = buildDeps({
        bookingRepo: {
          findOne: jest
            .fn()
            .mockResolvedValue({ id: 'x', businessId: 'biz-1' }),
        } as any,
      });
      expect(
        (
          await handleCancelMultiServiceGroupLogic(notGroupDeps, 'biz-1', {
            bookingId: 'x',
          })
        ).success,
      ).toBe(false);

      const result = await handleCancelMultiServiceGroupLogic(
        deps,
        'biz-1',
        { bookingId: 'b1' },
        'user-1',
      );
      expect(result.success).toBe(true);
    });

    it('reschedules package visit and multi-service group', async () => {
      const start = new Date('2026-06-10T10:00:00.000Z');
      const visit = [
        {
          id: 'b1',
          businessId: 'biz-1',
          packagePurchaseId: 'p1',
          status: BookingStatus.CONFIRMED,
          startTime: start,
          employeeId: 'e1',
          service: { durationMinutes: 30 },
        },
        {
          id: 'b2',
          businessId: 'biz-1',
          packagePurchaseId: 'p1',
          status: BookingStatus.CONFIRMED,
          startTime: new Date(start.getTime() + 3600000),
          employeeId: 'e1',
        },
      ];
      const packageDeps = buildDeps({
        bookingRepo: {
          findOne: jest.fn().mockResolvedValue(visit[0]),
          find: jest.fn().mockResolvedValue(visit),
        } as any,
      });

      expect(
        (
          await handleReschedulePackageVisitLogic(packageDeps, 'biz-1', {
            bookingId: 'b1',
          })
        ).success,
      ).toBe(false);

      const notPackageDeps = buildDeps({
        bookingRepo: {
          findOne: jest
            .fn()
            .mockResolvedValue({ id: 'x', businessId: 'biz-1' }),
        } as any,
      });
      expect(
        (
          await handleReschedulePackageVisitLogic(notPackageDeps, 'biz-1', {
            bookingId: 'x',
            date: '2026-06-12',
            timeSlot: '11:00',
          })
        ).success,
      ).toBe(false);

      const noActiveDeps = buildDeps({
        bookingRepo: {
          findOne: jest.fn().mockResolvedValue(visit[0]),
          find: jest
            .fn()
            .mockResolvedValue([
              { ...visit[0], status: BookingStatus.CANCELLED },
            ]),
        } as any,
      });
      expect(
        (
          await handleReschedulePackageVisitLogic(noActiveDeps, 'biz-1', {
            bookingId: 'b1',
            date: '2026-06-12',
            timeSlot: '11:00',
          })
        ).success,
      ).toBe(false);

      const pkgResult = await handleReschedulePackageVisitLogic(
        packageDeps,
        'biz-1',
        { bookingId: 'b1', date: '2026-06-12', timeSlot: '11:00' },
        'user-1',
      );
      expect(pkgResult.success).toBe(true);

      const msBooking = {
        id: 'b3',
        businessId: 'biz-1',
        multiServiceGroupId: 'g1',
        employeeId: 'e1',
      };
      const msDeps = buildDeps({
        bookingRepo: { findOne: jest.fn().mockResolvedValue(msBooking) } as any,
      });
      expect(
        (await handleRescheduleMultiServiceGroupLogic(msDeps, 'biz-1', {}))
          .success,
      ).toBe(false);

      const notGroupDeps = buildDeps({
        bookingRepo: {
          findOne: jest
            .fn()
            .mockResolvedValue({ id: 'x', businessId: 'biz-1' }),
        } as any,
      });
      expect(
        (
          await handleRescheduleMultiServiceGroupLogic(notGroupDeps, 'biz-1', {
            bookingId: 'x',
            date: '2026-06-12',
            timeSlot: '14:00',
          })
        ).success,
      ).toBe(false);

      const msResult = await handleRescheduleMultiServiceGroupLogic(
        msDeps,
        'biz-1',
        { bookingId: 'b3', date: '2026-06-12', timeSlot: '14:00' },
        'user-1',
      );
      expect(msResult.success).toBe(true);
    });
  });

  describe('handleMarkPaidLogic', () => {
    it('marks booking paid for cash and non-cash', async () => {
      const cashBooking = {
        id: 'b1',
        businessId: 'biz-1',
        metadata: { payAtVenue: true },
        customer: { name: 'Leo' },
      };
      const cashMethodBooking = {
        ...cashBooking,
        metadata: { paymentMethod: 'cash' },
      };
      const cardBooking = {
        ...cashBooking,
        metadata: { paymentMethod: 'card' },
      };
      const bookingService = { update: jest.fn(async () => ({})) };

      expect(
        (await handleMarkPaidLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);

      const cashDeps = buildDeps({
        bookingRepo: {
          findOne: jest.fn().mockResolvedValue(cashBooking),
        } as any,
        bookingService: bookingService as any,
      });
      const missingDeps = buildDeps({
        bookingRepo: { findOne: jest.fn().mockResolvedValue(null) } as any,
        bookingService: bookingService as any,
      });
      expect(
        (
          await handleMarkPaidLogic(missingDeps, 'biz-1', {
            bookingId: 'missing',
          })
        ).success,
      ).toBe(false);

      const cashResult = await handleMarkPaidLogic(
        cashDeps,
        'biz-1',
        { bookingId: 'b1' },
        'user-1',
      );
      expect(cashResult.success).toBe(true);

      const noMetaDeps = buildDeps({
        bookingRepo: {
          findOne: jest.fn().mockResolvedValue({
            id: 'b3',
            businessId: 'biz-1',
            metadata: null,
            customer: { name: 'Sam' },
          }),
        } as any,
        bookingService: bookingService as any,
      });
      await handleMarkPaidLogic(
        noMetaDeps,
        'biz-1',
        { bookingId: 'b3' },
        'user-1',
      );

      const noNameDeps = buildDeps({
        bookingRepo: {
          findOne: jest.fn().mockResolvedValue({
            id: 'b2',
            businessId: 'biz-1',
            metadata: {},
            customer: null,
          }),
        } as any,
        bookingService: bookingService as any,
      });
      const noName = await handleMarkPaidLogic(
        noNameDeps,
        'biz-1',
        { bookingId: 'b2' },
        'user-1',
      );
      expect(noName.summary).toContain('appointment');

      const cashMethodDeps = buildDeps({
        bookingRepo: {
          findOne: jest.fn().mockResolvedValue(cashMethodBooking),
        } as any,
        bookingService: bookingService as any,
      });
      await handleMarkPaidLogic(
        cashMethodDeps,
        'biz-1',
        { bookingId: 'b1' },
        'user-1',
      );

      const cardDeps = buildDeps({
        bookingRepo: {
          findOne: jest.fn().mockResolvedValue(cardBooking),
        } as any,
        bookingService: bookingService as any,
      });
      await handleMarkPaidLogic(
        cardDeps,
        'biz-1',
        { bookingId: 'b1' },
        'user-1',
      );
      expect(bookingService.update).toHaveBeenCalledWith(
        'b1',
        expect.objectContaining({
          metadata: expect.objectContaining({ paidVia: 'manual' }),
        }),
        'user-1',
      );
    });
  });

  describe('handleAssignBookingResourceLogic', () => {
    it('assigns resource by exact or partial name', async () => {
      const booking = { id: 'b1', businessId: 'biz-1' };
      const deps = buildDeps({
        bookingRepo: { findOne: jest.fn().mockResolvedValue(booking) } as any,
        resourcesService: {
          listResources: jest
            .fn()
            .mockResolvedValue([{ id: 'r1', name: 'Treatment Room 2' }]),
          assignToBooking: jest.fn(),
        },
      });

      expect(
        (await handleAssignBookingResourceLogic(deps, 'biz-1', {})).success,
      ).toBe(false);
      const missingDeps = buildDeps({
        bookingRepo: { findOne: jest.fn().mockResolvedValue(null) } as any,
        resourcesService: deps.resourcesService,
      });
      expect(
        (
          await handleAssignBookingResourceLogic(missingDeps, 'biz-1', {
            bookingId: 'missing',
            resourceName: 'Room',
          })
        ).success,
      ).toBe(false);
      expect(
        (
          await handleAssignBookingResourceLogic(deps, 'biz-1', {
            bookingId: 'b1',
            resourceName: 'Unknown',
          })
        ).success,
      ).toBe(false);

      const exactDeps = buildDeps({
        bookingRepo: { findOne: jest.fn().mockResolvedValue(booking) } as any,
        resourcesService: {
          listResources: jest
            .fn()
            .mockResolvedValue([{ id: 'r1', name: 'Room 2' }]),
          assignToBooking: jest.fn(),
        },
      });
      const exactMatch = await handleAssignBookingResourceLogic(
        exactDeps,
        'biz-1',
        { bookingId: 'b1', resourceName: 'Room 2' },
        'user-1',
      );
      expect(exactMatch.success).toBe(true);

      const result = await handleAssignBookingResourceLogic(
        deps,
        'biz-1',
        { bookingId: 'b1', resourceName: 'room 2' },
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(deps.resourcesService.assignToBooking).toHaveBeenCalled();
    });
  });

  describe('handleCreateMultiServiceBookingLogic', () => {
    const business = { settings: {} } as any;

    it('validates services, provider, and customer', async () => {
      const deps = buildDeps();
      expect(
        (
          await handleCreateMultiServiceBookingLogic(
            deps,
            'biz-1',
            {},
            business,
            employees,
            services,
            customers,
            resolveEmployee,
            resolveServices,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);

      expect(
        (
          await handleCreateMultiServiceBookingLogic(
            deps,
            'biz-1',
            { serviceNames: ['Haircut', 'Beard'] },
            business,
            employees,
            services,
            customers,
            resolveEmployee,
            resolveServices,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);

      expect(
        (
          await handleCreateMultiServiceBookingLogic(
            deps,
            'biz-1',
            {
              serviceNames: ['Haircut', 'Beard'],
              employeeName: 'Anna',
              date: '2026-06-12',
              timeSlot: '10:00',
            },
            business,
            employees,
            services,
            customers,
            resolveEmployee,
            resolveServices,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
    });

    it('creates multi-service booking', async () => {
      const deps = buildDeps();
      const result = await handleCreateMultiServiceBookingLogic(
        deps,
        'biz-1',
        {
          serviceNames: ['Haircut', 'Beard'],
          employeeName: 'Anna',
          customerName: 'Maria',
          date: '2026-06-12',
          timeSlot: '10:00',
        },
        business,
        employees,
        services,
        customers,
        resolveEmployee,
        resolveServices,
        resolveCustomer,
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(deps.bookingService.create).toHaveBeenCalled();
      expect(deps.multiServiceBookingsService.createGroup).toHaveBeenCalled();
    });

    it('resolves employee and customer by id', async () => {
      const deps = buildDeps();
      const result = await handleCreateMultiServiceBookingLogic(
        deps,
        'biz-1',
        {
          serviceNames: ['Haircut', 'Beard'],
          employeeId: 'e1',
          customerId: 'c1',
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
      expect(result.success).toBe(true);
    });
  });

  describe('handleCreatePackageBookingLogic', () => {
    const business = { settings: {} } as any;
    const pkg = {
      id: 'pkg-1',
      name: 'Spa Day',
      items: [{ service: services[0] }, { service: services[1] }],
    } as any;

    it('validates package, customer, and lines', async () => {
      const deps = buildDeps();
      const resolvePackage = jest.fn().mockResolvedValue(null);

      expect(
        (
          await handleCreatePackageBookingLogic(
            deps,
            'biz-1',
            {},
            business,
            employees,
            services,
            customers,
            resolveEmployee,
            resolveCustomer,
            resolvePackage,
          )
        ).success,
      ).toBe(false);

      expect(
        (
          await handleCreatePackageBookingLogic(
            deps,
            'biz-1',
            { packageName: 'Missing Package' },
            business,
            employees,
            services,
            customers,
            resolveEmployee,
            resolveCustomer,
            resolvePackage,
          )
        ).success,
      ).toBe(false);

      expect(
        (
          await handleCreatePackageBookingLogic(
            deps,
            'biz-1',
            { packageName: 'Spa Day' },
            business,
            employees,
            services,
            customers,
            resolveEmployee,
            resolveCustomer,
            jest.fn().mockResolvedValue(pkg),
          )
        ).success,
      ).toBe(false);

      expect(
        (
          await handleCreatePackageBookingLogic(
            deps,
            'biz-1',
            { packageName: 'Spa Day', customerName: 'Maria' },
            business,
            employees,
            services,
            customers,
            resolveEmployee,
            resolveCustomer,
            jest.fn().mockResolvedValue(pkg),
          )
        ).success,
      ).toBe(false);
    });

    it('creates package booking from packageLines with mixed employee resolution', async () => {
      const deps = buildDeps();
      const sparsePkg = {
        ...pkg,
        items: [{ service: services[0] }],
      };
      const lineOnly = await handleCreatePackageBookingLogic(
        deps,
        'biz-1',
        {
          packageName: 'Spa Day',
          customerName: 'Maria',
          packageLines: [
            {
              employeeName: 'Anna',
              serviceId: 's1',
              startTime: '2026-06-12T10:00:00.000Z',
            },
          ],
        },
        business,
        employees,
        services,
        customers,
        resolveEmployee,
        resolveCustomer,
        jest.fn().mockResolvedValue(sparsePkg),
        'user-1',
      );
      expect(lineOnly.success).toBe(true);
    });

    it('creates package booking from packageLines', async () => {
      const deps = buildDeps();
      const result = await handleCreatePackageBookingLogic(
        deps,
        'biz-1',
        {
          packageName: 'Spa Day',
          customerName: 'Maria',
          packageLines: [
            {
              employeeName: 'Anna',
              serviceId: 's1',
              startTime: '2026-06-12T10:00:00.000Z',
            },
            {
              employeeId: 'e1',
              serviceId: 's2',
              startTime: '2026-06-12T11:00:00.000Z',
            },
          ],
        },
        business,
        employees,
        services,
        customers,
        resolveEmployee,
        resolveCustomer,
        jest.fn().mockResolvedValue(pkg),
        'user-1',
      );
      expect(result.success).toBe(true);
      expect((result.details as any).bookingIds).toHaveLength(2);
    });

    it('creates package booking for customer by id', async () => {
      const deps = buildDeps();
      const result = await handleCreatePackageBookingLogic(
        deps,
        'biz-1',
        {
          packageName: 'Spa Day',
          customerId: 'c1',
          employeeName: 'Anna',
          date: '2026-06-12',
          timeSlot: '10:00',
        },
        business,
        employees,
        services,
        customers,
        resolveEmployee,
        resolveCustomer,
        jest.fn().mockResolvedValue(pkg),
        'user-1',
      );
      expect(result.success).toBe(true);
    });

    it('creates package booking from single block start', async () => {
      const deps = buildDeps();
      const result = await handleCreatePackageBookingLogic(
        deps,
        'biz-1',
        {
          packageName: 'Spa Day',
          customerName: 'Maria',
          employeeName: 'Anna',
          date: '2026-06-12',
          timeSlot: '10:00',
        },
        business,
        employees,
        services,
        customers,
        resolveEmployee,
        resolveCustomer,
        jest.fn().mockResolvedValue(pkg),
        'user-1',
      );
      expect(result.success).toBe(true);

      const pkgWithoutItems = { id: 'pkg-4', name: 'Bare Package' } as any;
      const bare = await handleCreatePackageBookingLogic(
        deps,
        'biz-1',
        {
          packageName: 'Bare Package',
          customerName: 'Maria',
          employeeName: 'Anna',
          date: '2026-06-12',
          timeSlot: '10:00',
        },
        business,
        employees,
        services,
        customers,
        resolveEmployee,
        resolveCustomer,
        jest.fn().mockResolvedValue(pkgWithoutItems),
        'user-1',
      );
      expect(bare.success).toBe(false);
    });

    it('skips invalid package lines and fails when nothing created', async () => {
      const deps = buildDeps();
      expect(
        (
          await handleCreatePackageBookingLogic(
            deps,
            'biz-1',
            {
              packageName: 'Spa Day',
              customerName: 'Maria',
              packageLines: [
                {
                  employeeName: 'Nobody',
                  serviceId: 's1',
                  startTime: '2026-06-12T10:00:00.000Z',
                },
                { serviceId: 's2', startTime: '2026-06-12T11:00:00.000Z' },
              ],
            },
            business,
            employees,
            services,
            customers,
            resolveEmployee,
            resolveCustomer,
            jest.fn().mockResolvedValue(pkg),
          )
        ).success,
      ).toBe(false);

      const emptyItemsPkg = { id: 'pkg-2', name: 'Empty', items: [] } as any;
      const nullServicePkg = {
        id: 'pkg-3',
        name: 'Sparse',
        items: [{ service: null }],
      } as any;
      await handleCreatePackageBookingLogic(
        deps,
        'biz-1',
        {
          packageName: 'Sparse',
          customerName: 'Maria',
          employeeName: 'Anna',
          date: '2026-06-12',
          timeSlot: '10:00',
        },
        business,
        employees,
        services,
        customers,
        resolveEmployee,
        resolveCustomer,
        jest.fn().mockResolvedValue(nullServicePkg),
      );
      expect(
        (
          await handleCreatePackageBookingLogic(
            deps,
            'biz-1',
            {
              packageName: 'Empty',
              customerName: 'Maria',
              employeeName: 'Anna',
              date: '2026-06-12',
              timeSlot: '10:00',
            },
            business,
            employees,
            services,
            customers,
            resolveEmployee,
            resolveCustomer,
            jest.fn().mockResolvedValue(emptyItemsPkg),
          )
        ).success,
      ).toBe(false);
    });

    it('fails when provider missing or lines invalid', async () => {
      const deps = buildDeps();
      expect(
        (
          await handleCreatePackageBookingLogic(
            deps,
            'biz-1',
            {
              packageName: 'Spa Day',
              customerName: 'Maria',
              employeeName: 'Unknown',
              date: '2026-06-12',
              timeSlot: '10:00',
            },
            business,
            employees,
            services,
            customers,
            resolveEmployee,
            resolveCustomer,
            jest.fn().mockResolvedValue(pkg),
          )
        ).success,
      ).toBe(false);

      expect(
        (
          await handleCreatePackageBookingLogic(
            deps,
            'biz-1',
            {
              packageName: 'Spa Day',
              customerName: 'Maria',
              packageLines: [{ employeeName: 'Anna' }],
            },
            business,
            employees,
            services,
            customers,
            resolveEmployee,
            resolveCustomer,
            jest.fn().mockResolvedValue(pkg),
          )
        ).success,
      ).toBe(false);
    });
  });
});
