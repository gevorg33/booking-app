import { ConflictException } from '@nestjs/common';
import { BookingStatus, PaymentStatus } from './entities/booking.entity.js';
import { SlotStatus } from '../schedule/entities/scheduling-slot.entity.js';
import { BookingService } from './booking.service.js';

function futureBookingIso(daysAhead = 14): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  d.setUTCHours(10, 50, 0, 0);
  return d.toISOString();
}

function createLockableQueryBuilder(getManyResult: unknown[] = []) {
  const qb: Record<string, jest.Mock> = {};
  const self = () => qb;
  qb.setLock = jest.fn(self);
  qb.where = jest.fn(self);
  qb.andWhere = jest.fn(self);
  qb.orderBy = jest.fn(self);
  qb.addOrderBy = jest.fn(self);
  qb.getMany = jest.fn().mockResolvedValue(getManyResult);
  return qb;
}

describe('BookingService same-visit multi-service create', () => {
  const bookingRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    save: jest.fn(async (booking) => booking),
    manager: { findOne: jest.fn() },
  };
  const slotRepo = {
    createQueryBuilder: jest.fn(),
    save: jest.fn(async (slot) => slot),
  };
  const schedulingPeriodRepo = { find: jest.fn() };
  const serviceRepo = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
  };
  const customerRepo = {
    findOne: jest.fn(),
  };
  const businessRepo = {
    findOne: jest.fn(),
  };
  const employeeRepo = { findOne: jest.fn() };
  const multiServiceGroupRepo = { findOne: jest.fn() };
  const schedulingEngine = {} as any;
  const eventStore = { publish: jest.fn() };
  const loyaltyAwardService = {} as any;
  const resourcesService = {
    getRequiredResourceIds: jest.fn().mockResolvedValue([]),
  };
  const subscriptionsService = {} as any;
  const phiFieldService = {
    encryptBookingForStorage: jest.fn(
      async (_business: unknown, booking: unknown) => booking,
    ),
    decryptBookingForStaff: jest.fn(
      async (_business: unknown, booking: unknown) => booking,
    ),
    auditBookingPhiWrite: jest.fn(),
  };
  const businessService = {
    ensureMember: jest.fn(),
  };

  const savedBooking = {
    id: 'booking-1',
    businessId: 'biz-1',
    employeeId: 'emp-1',
    serviceId: 'svc-2',
    startTime: new Date(futureBookingIso()),
    endTime: new Date(new Date(futureBookingIso()).getTime() + 60 * 60 * 1000),
    status: BookingStatus.CONFIRMED,
    paymentStatus: PaymentStatus.NOT_APPLICABLE,
  };

  let service: BookingService;
  let validateBookingWindow: jest.SpyInstance;
  let findSlotsInWindow: jest.SpyInstance;
  let transactionMock: jest.Mock;
  let slotLockQb: ReturnType<typeof createLockableQueryBuilder>;
  let bookingLockQb: ReturnType<typeof createLockableQueryBuilder>;

  beforeEach(() => {
    jest.clearAllMocks();

    slotLockQb = createLockableQueryBuilder([]);
    bookingLockQb = createLockableQueryBuilder([]);
    let qbCall = 0;
    transactionMock = jest.fn(async (cb) =>
      cb({
        createQueryBuilder: jest.fn(() => {
          qbCall += 1;
          // create(): slots FOR UPDATE first, then overlapping bookings FOR UPDATE
          return qbCall % 2 === 1 ? slotLockQb : bookingLockQb;
        }),
        create: (_entity: unknown, data: unknown) => data,
        save: async (_entity: unknown, data: Record<string, unknown>) => ({
          ...savedBooking,
          ...(data && typeof data === 'object' ? data : {}),
        }),
      }),
    );

    service = new BookingService(
      bookingRepo as any,
      slotRepo as any,
      schedulingPeriodRepo as any,
      serviceRepo as any,
      customerRepo as any,
      businessRepo as any,
      employeeRepo as any,
      multiServiceGroupRepo as any,
      schedulingEngine,
      eventStore as any,
      { transaction: transactionMock } as any,
      loyaltyAwardService,
      resourcesService as any,
      subscriptionsService,
      phiFieldService as any,
      businessService as any,
      { refundBookingPayment: jest.fn().mockResolvedValue('skipped') } as any,
      { restoreRedemptionForBooking: jest.fn().mockResolvedValue(false) } as any,
    );

    validateBookingWindow = jest
      .spyOn(service as any, 'validateBookingWindow')
      .mockRejectedValue(
        new Error(
          'The service provider does not offer this service for the entire requested time window.',
        ),
      );
    jest
      .spyOn(service as any, 'validateEmployeeCanPerformService')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'reconcileStuckSlotsInWindow')
      .mockResolvedValue(undefined);
    findSlotsInWindow = jest
      .spyOn(service as any, 'findSlotsInWindow')
      .mockResolvedValue([
        {
          id: 'slot-1',
          appointmentCount: 0,
          maxAppointmentCount: 1,
          status: SlotStatus.AVAILABLE,
        },
      ]);
    jest.spyOn(service, 'findOne').mockResolvedValue(savedBooking as any);

    const defaultService = {
      id: 'svc-2',
      durationMinutes: 60,
      bufferMinutes: 0,
      prepaymentMode: 'none',
    };
    serviceRepo.findOne.mockResolvedValue(defaultService);
    serviceRepo.findOneOrFail.mockResolvedValue(defaultService);
    businessRepo.findOne.mockResolvedValue({ timezone: 'UTC' });
    customerRepo.findOne.mockResolvedValue({ id: 'cust-1' });
    bookingRepo.findOne.mockResolvedValue(null);
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
  });

  it('skips per-segment schedule validation for same-visit multi-service segments', async () => {
    await service.create(
      'biz-1',
      {
        employeeId: 'emp-1',
        serviceId: 'svc-2',
        customerId: 'cust-1',
        startTime: futureBookingIso(),
        multiServiceGroupId: 'group-1',
      },
      undefined,
      { sameVisitMultiService: true },
    );

    expect(validateBookingWindow).not.toHaveBeenCalled();
    expect(findSlotsInWindow).not.toHaveBeenCalled();
    expect(transactionMock).toHaveBeenCalled();
    expect(slotLockQb.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(bookingLockQb.setLock).toHaveBeenCalledWith('pessimistic_write');
  });

  it('validates each segment when sameVisitMultiService is false', async () => {
    validateBookingWindow.mockResolvedValue(undefined);

    await service.create(
      'biz-1',
      {
        employeeId: 'emp-1',
        serviceId: 'svc-2',
        customerId: 'cust-1',
        startTime: futureBookingIso(),
      },
      undefined,
      { sameVisitMultiService: false },
    );

    expect(validateBookingWindow).toHaveBeenCalledTimes(1);
    expect(findSlotsInWindow).not.toHaveBeenCalled();
    expect(slotLockQb.setLock).toHaveBeenCalledWith('pessimistic_write');
  });

  it('fails the second segment when per-segment validation is enforced', async () => {
    await expect(
      service.create(
        'biz-1',
        {
          employeeId: 'emp-1',
          serviceId: 'svc-2',
          customerId: 'cust-1',
          startTime: futureBookingIso(),
          multiServiceGroupId: 'group-1',
        },
        undefined,
        { sameVisitMultiService: false },
      ),
    ).rejects.toThrow('does not offer this service');
  });

  it('skips per-segment schedule validation when rescheduling a same-visit block segment', async () => {
    validateBookingWindow.mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'releaseSlotsByWindow')
      .mockResolvedValue(undefined);
    const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const segmentStart = new Date(futureStart.getTime() + 65 * 60 * 1000);
    bookingRepo.findOne.mockResolvedValue({
      ...savedBooking,
      id: 'booking-2',
      startTime: futureStart,
      endTime: new Date(futureStart.getTime() + 30 * 60 * 1000),
      status: BookingStatus.CONFIRMED,
      packagePurchaseId: 'purchase-1',
    });

    await service.update(
      'booking-2',
      {
        startTime: segmentStart.toISOString(),
        employeeId: 'emp-1',
      },
      'user-1',
      {
        sameVisitBlockSegment: true,
        excludeBookingIds: ['booking-1', 'booking-2'],
      },
    );

    expect(validateBookingWindow).not.toHaveBeenCalled();
    expect(findSlotsInWindow).toHaveBeenCalledWith(
      'biz-1',
      'emp-1',
      expect.any(Date),
      expect.any(Date),
      undefined,
    );
  });

  it('api-bug.4 / e2e-bug.119 — create claims available slots under FOR UPDATE and rejects overlap', async () => {
    validateBookingWindow.mockResolvedValue(undefined);
    const freeSlot = {
      id: 'slot-1',
      status: SlotStatus.AVAILABLE,
      appointmentCount: 0,
      maxAppointmentCount: 1,
      serviceIds: null,
      serviceId: undefined,
    };
    slotLockQb.getMany.mockResolvedValue([freeSlot]);
    bookingLockQb.getMany.mockResolvedValue([]);

    await service.create(
      'biz-1',
      {
        employeeId: 'emp-1',
        serviceId: 'svc-2',
        customerId: 'cust-1',
        startTime: futureBookingIso(),
      },
      undefined,
      { sameVisitMultiService: false },
    );

    expect(slotLockQb.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(freeSlot.appointmentCount).toBe(1);
    expect(freeSlot.status).toBe(SlotStatus.BOOKED);

    // Second concurrent create sees an overlapping booking under the same lock path.
    slotLockQb = createLockableQueryBuilder([
      {
        id: 'slot-1',
        status: SlotStatus.BOOKED,
        appointmentCount: 1,
        maxAppointmentCount: 1,
        serviceIds: null,
      },
    ]);
    bookingLockQb = createLockableQueryBuilder([
      {
        id: 'booking-existing',
        startTime: new Date(futureBookingIso()),
        employee: { name: 'Alex' },
        customer: { name: 'Pat' },
      },
    ]);
    let qbCall = 0;
    transactionMock.mockImplementation(async (cb) =>
      cb({
        createQueryBuilder: jest.fn(() => {
          qbCall += 1;
          return qbCall % 2 === 1 ? slotLockQb : bookingLockQb;
        }),
        create: (_entity: unknown, data: unknown) => data,
        save: async (_entity: unknown, data: Record<string, unknown>) => ({
          ...savedBooking,
          ...(data && typeof data === 'object' ? data : {}),
        }),
      }),
    );

    await expect(
      service.create(
        'biz-1',
        {
          employeeId: 'emp-1',
          serviceId: 'svc-2',
          customerId: 'cust-2',
          startTime: futureBookingIso(),
        },
        undefined,
        { sameVisitMultiService: false },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('e2e-bug.119 — full micro-slot capacity rejects before insert (no shared slot_id)', async () => {
    validateBookingWindow.mockResolvedValue(undefined);
    slotLockQb.getMany.mockResolvedValue([
      {
        id: 'slot-full',
        status: SlotStatus.BOOKED,
        appointmentCount: 1,
        maxAppointmentCount: 1,
        serviceIds: null,
      },
    ]);
    // Even if overlapping-booking lookup is empty, capacity gate must 409.
    bookingLockQb.getMany.mockResolvedValue([]);

    await expect(
      service.create(
        'biz-1',
        {
          employeeId: 'emp-1',
          serviceId: 'svc-2',
          customerId: 'cust-2',
          startTime: futureBookingIso(),
        },
        undefined,
        { sameVisitMultiService: false },
      ),
    ).rejects.toThrow('Time slot is already booked');
  });

  it('api-bug.1 / e2e-bug.30 — customer: actor on update does not call ensureMember', async () => {
    jest
      .spyOn(service as any, 'releaseSlotsByWindow')
      .mockResolvedValue(undefined);
    validateBookingWindow.mockResolvedValue(undefined);
    const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newStart = new Date(futureStart.getTime() + 24 * 60 * 60 * 1000);
    bookingRepo.findOne.mockResolvedValue({
      ...savedBooking,
      id: 'booking-plain',
      startTime: futureStart,
      endTime: new Date(futureStart.getTime() + 60 * 60 * 1000),
      status: BookingStatus.CONFIRMED,
      notes: null,
      metadata: {},
      employee: { name: 'Alex' },
      service: { name: 'Cut' },
      customer: { name: 'Pat' },
    });
    serviceRepo.findOneOrFail.mockResolvedValue({
      id: 'svc-2',
      durationMinutes: 60,
      bufferMinutes: 0,
    });

    const customerActor =
      'customer:11111111-1111-1111-1111-111111111111';

    await expect(
      service.update(
        'booking-plain',
        { startTime: newStart.toISOString() },
        customerActor,
      ),
    ).resolves.toBeDefined();

    expect(businessService.ensureMember).not.toHaveBeenCalled();
    expect(phiFieldService.auditBookingPhiWrite).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      { role: 'customer', userId: null },
    );
  });
});
