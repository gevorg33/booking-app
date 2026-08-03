import { BookingStatus, PaymentStatus } from './entities/booking.entity.js';
import { SlotStatus } from '../schedule/entities/scheduling-slot.entity.js';
import { BookingService } from './booking.service.js';
import { API_BUG1_CUSTOMER_ACTOR_SCENARIOS } from './api-bug1-customer-actor.fixtures.js';

describe('api-bug.1 customer: actor on BookingService.update', () => {
  function createHarness() {
    const ensureMember = jest.fn().mockResolvedValue({ role: 'manager' });
    const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const booking = {
      id: 'booking-api1',
      businessId: 'biz-1',
      employeeId: 'emp-1',
      serviceId: 'svc-2',
      customerId: '36400df4-1111-4111-8111-111111111111',
      startTime: futureStart,
      endTime: new Date(futureStart.getTime() + 60 * 60 * 1000),
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.NOT_APPLICABLE,
      notes: null,
      metadata: {},
      employee: { name: 'Alex' },
      service: { name: 'Cut' },
      customer: { name: 'Pat' },
      linkedEmployeeIds: null as string[] | null,
    };

    const bookingRepo = {
      findOne: jest.fn().mockResolvedValue(booking),
      save: jest.fn(async (row: unknown) => row),
      createQueryBuilder: jest.fn(),
      manager: { findOne: jest.fn() },
    };
    const businessRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'biz-1', settings: {} }),
    };
    const serviceRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn().mockResolvedValue({
        id: 'svc-2',
        durationMinutes: 60,
        bufferMinutes: 0,
      }),
    };
    const employeeRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const phiFieldService = {
      encryptBookingForStorage: jest.fn(
        async (_business: unknown, row: unknown) => row,
      ),
      decryptBookingForStaff: jest.fn(
        async (_business: unknown, row: unknown) => row,
      ),
      auditBookingPhiWrite: jest.fn(),
    };
    const eventStore = { publish: jest.fn() };

    const service = new BookingService(
      bookingRepo as any,
      {
        createQueryBuilder: jest.fn(),
        save: jest.fn(async (slot: unknown) => slot),
      } as any,
      { find: jest.fn() } as any,
      serviceRepo as any,
      { findOne: jest.fn() } as any,
      businessRepo as any,
      employeeRepo as any,
      { findOne: jest.fn() } as any,
      {} as any,
      eventStore as any,
      { transaction: jest.fn() } as any,
      {} as any,
      { getRequiredResourceIds: jest.fn().mockResolvedValue([]) } as any,
      {} as any,
      phiFieldService as any,
      { ensureMember } as any,
      { refundBookingPayment: jest.fn().mockResolvedValue('skipped') } as any,
      { restoreRedemptionForBooking: jest.fn().mockResolvedValue(false) } as any,
    );

    jest
      .spyOn(service as any, 'releaseSlotsByWindow')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'reconcileStuckSlotsInWindow')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'validateBookingWindow')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'validateEmployeeCanPerformService')
      .mockResolvedValue(undefined);
    jest.spyOn(service as any, 'findSlotsInWindow').mockResolvedValue([
      {
        id: 'slot-1',
        appointmentCount: 0,
        maxAppointmentCount: 1,
        status: SlotStatus.AVAILABLE,
      },
    ]);

    return {
      service,
      ensureMember,
      phiFieldService,
      futureStart,
    };
  }

  it.each(
    API_BUG1_CUSTOMER_ACTOR_SCENARIOS.map((row) => [row.id, row] as const),
  )('update with %s does not leak Postgres uuid errors', async (_id, row) => {
    const { service, ensureMember, phiFieldService, futureStart } =
      createHarness();
    const newStart = new Date(futureStart.getTime() + 24 * 60 * 60 * 1000);
    const actor = row.actorId || undefined;

    await expect(
      service.update(
        'booking-api1',
        { startTime: newStart.toISOString() },
        actor,
      ),
    ).resolves.toBeDefined();

    if (row.expectEnsureMember) {
      expect(ensureMember).toHaveBeenCalled();
    } else {
      expect(ensureMember).not.toHaveBeenCalled();
      expect(phiFieldService.auditBookingPhiWrite).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          role: row.expectAuditRole,
          userId: null,
        }),
      );
    }
  });

  it('isStaffMemberUserId rejects customer: prefix (api-bug.1 guard)', () => {
    const { service } = createHarness();
    const isStaff = (service as any).isStaffMemberUserId.bind(service);
    expect(isStaff('customer:36400df4-1111-4111-8111-111111111111')).toBe(
      false,
    );
    expect(isStaff('not-a-uuid-actor')).toBe(false);
    expect(isStaff(undefined)).toBe(false);
    expect(isStaff('11111111-1111-4111-8111-111111111111')).toBe(true);
  });
});
