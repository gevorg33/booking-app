import { BookingStatus, PaymentStatus } from './entities/booking.entity.js';
import { SlotStatus } from '../schedule/entities/scheduling-slot.entity.js';
import { BookingService } from './booking.service.js';
import { E2E97_GUEST_ACTOR_SCENARIOS } from './ai-e2e97-guest-reschedule-actor.fixtures.js';

/**
 * Unlike the api-bug.1 multi-service harness, this suite does NOT mock
 * `findOne` — that was hiding e2e-bug.97's crash in resolveStaffPhiContext.
 */
describe('e2e-bug.30 / e2e-bug.97 guest customer: actor on reschedule update', () => {
  function createHarness() {
    const ensureMember = jest.fn().mockResolvedValue({ role: 'manager' });
    const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const booking = {
      id: 'booking-plain',
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
      booking,
    };
  }

  it.each(
    E2E97_GUEST_ACTOR_SCENARIOS.map((row) => [row.id, row] as const),
  )('update with %s does not leak Postgres uuid errors', async (_id, row) => {
    const { service, ensureMember, phiFieldService, futureStart } =
      createHarness();
    const newStart = new Date(futureStart.getTime() + 24 * 60 * 60 * 1000);

    await expect(
      service.update(
        'booking-plain',
        { startTime: newStart.toISOString() },
        row.actorId,
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
        row.actorId.startsWith('customer:')
          ? { role: 'customer', userId: null }
          : { role: 'public', userId: null },
      );
    }
  });
});
