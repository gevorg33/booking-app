import { AiBookingDepthService } from './ai-booking-depth.service.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';

describe('AiBookingDepthService (thin wrapper)', () => {
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
  const business = {
    id: 'biz-1',
    settings: { publicBooking: { acceptCashPayments: true } },
  } as any;

  const bookingRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    manager: {
      transaction: jest.fn(async (fn: (m: unknown) => Promise<void>) => fn({})),
    },
  };
  const businessRepo = { findOne: jest.fn().mockResolvedValue(business) };
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

  const service = new AiBookingDepthService(
    bookingRepo as any,
    businessRepo as any,
    packageRepo as any,
    bookingService as any,
    subscriptionsService as any,
    packagesService as any,
    multiServiceBookingsService as any,
    resourcesService as any,
  );

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

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.find.mockResolvedValue([]);
    bookingRepo.findOne.mockResolvedValue(null);
    subscriptionsService.getActiveForCustomerService.mockResolvedValue({
      id: 'sub-1',
    });
  });

  it('rescues booking intents', () => {
    expect(
      service.rescueBookingIntent('Book spa day package', 'unknown')?.action,
    ).toBe('create_package_booking');
  });

  it('prepares subscription and cash create params', async () => {
    const sub = await service.prepareSubscriptionCreditParams(
      'biz-1',
      { customerName: 'Maria', serviceName: 'Nail' },
      customers,
      services,
      resolveCustomer,
      resolveService,
    );
    expect(sub.ok).toBe(true);

    const cash = service.prepareCashCreateParams(
      { serviceName: 'Cut' },
      business.settings,
    );
    expect(cash.ok).toBe(true);
    expect(service.prepareCashCreateParams({}, {}).ok).toBe(false);
  });

  it('delegates list and policy handlers', async () => {
    bookingRepo.find.mockResolvedValueOnce([
      {
        id: 'b1',
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        metadata: { payAtVenue: true },
        startTime: new Date(),
      },
    ]);
    expect(
      (await service.handleListCashPending('biz-1', 'today', {})).action,
    ).toBe('list_cash_pending_bookings');
    expect(
      (await service.handleListPackageBookings('biz-1', 'week', {})).action,
    ).toBe('list_package_bookings');
    expect(
      (await service.handleListMultiServiceBookings('biz-1', 'today', {}))
        .action,
    ).toBe('list_multi_service_bookings');

    bookingRepo.findOne.mockResolvedValueOnce({
      id: 'b1',
      businessId: 'biz-1',
      startTime: new Date(Date.now() + 72 * 3600000),
      status: BookingStatus.CONFIRMED,
      metadata: {},
      customer: { name: 'Sofia' },
      service: { name: 'Massage' },
    });
    expect(
      (await service.handleExplainPolicy('biz-1', { bookingId: 'b1' })).action,
    ).toBe('explain_booking_policy');
    expect((await service.handleExplainPolicy('biz-1', {})).success).toBe(
      false,
    );
  });

  it('delegates mutate handlers', async () => {
    bookingRepo.findOne.mockResolvedValue({
      id: 'b1',
      businessId: 'biz-1',
      packagePurchaseId: 'p1',
      multiServiceGroupId: 'g1',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-06-10T10:00:00.000Z'),
      employeeId: 'e1',
      metadata: { payAtVenue: true },
      customer: { name: 'Leo' },
    });
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b1',
        businessId: 'biz-1',
        packagePurchaseId: 'p1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-10T10:00:00.000Z'),
        employeeId: 'e1',
      },
    ]);

    expect(
      (
        await service.handleCancelPackageVisit(
          'biz-1',
          { bookingId: 'b1' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleCancelMultiServiceGroup(
          'biz-1',
          { bookingId: 'b1' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleReschedulePackageVisit(
          'biz-1',
          { bookingId: 'b1', date: '2026-06-12', timeSlot: '11:00' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleRescheduleMultiServiceGroup(
          'biz-1',
          { bookingId: 'b1', date: '2026-06-12', timeSlot: '14:00' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (await service.handleMarkPaid('biz-1', { bookingId: 'b1' }, 'u1'))
        .success,
    ).toBe(true);
    expect(
      (
        await service.handleAssignResource(
          'biz-1',
          { bookingId: 'b1', resourceName: 'room 2' },
          'u1',
        )
      ).success,
    ).toBe(true);
  });

  it('delegates create package and multi-service bookings', async () => {
    const multi = await service.handleCreateMultiServiceBooking(
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
      'u1',
    );
    expect(multi.action).toBe('create_multi_service_booking');

    const pkg = await service.handleCreatePackageBooking(
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
      'u1',
    );
    expect(pkg.action).toBe('create_package_booking');
    expect(packageRepo.find).toHaveBeenCalled();
  });
});
