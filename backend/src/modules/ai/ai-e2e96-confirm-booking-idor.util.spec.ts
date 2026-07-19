import { BookingStatus } from '../booking/entities/booking.entity.js';
import { handleConfirmMyBookingDetailsLogic } from './ai-confirm-my-booking-details.logic.js';
import { E2E96_CONFIRM_BOOKING_IDOR_SCENARIOS } from './ai-e2e96-confirm-booking-idor.fixtures.js';

const MANAGE_TOKEN = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

describe('e2e-bug.96 confirm_my_booking_details IDOR', () => {
  const sampleBooking = {
    id: 'book-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    serviceId: 'svc-1',
    employeeId: 'emp-1',
    status: BookingStatus.CONFIRMED,
    startTime: new Date('2026-08-01T10:00:00.000Z'),
    endTime: new Date('2026-08-01T11:00:00.000Z'),
    metadata: { manageToken: MANAGE_TOKEN },
    service: { name: 'Massage' },
    employee: { name: 'Anna' },
  };

  function buildDeps() {
    const bookingRepo = {
      findOne: jest.fn().mockResolvedValue(sampleBooking),
      find: jest.fn().mockResolvedValue([sampleBooking]),
    };
    const businessRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'biz-1',
        name: 'Clinic',
        address: '1 Main St',
      }),
    };
    return {
      bookingRepo,
      businessRepo,
      deps: {
        bookingRepo,
        businessRepo,
      } as any,
    };
  }

  it.each(
    E2E96_CONFIRM_BOOKING_IDOR_SCENARIOS.map((row) => [row.id, row] as const),
  )('blocks leak for %s', async (_id, row) => {
    const { deps, bookingRepo } = buildDeps();
    if (row.expectOwnedQuery) {
      bookingRepo.findOne.mockResolvedValueOnce(null);
    }

    const result = await handleConfirmMyBookingDetailsLogic(
      deps,
      'biz-1',
      { ...row.params },
      row.prompt,
    );

    expect(result.success).toBe(false);
    expect(result.details?.serviceName).toBeUndefined();
    expect(result.details?.employeeName).toBeUndefined();
    expect(result.details?.startTime).toBeUndefined();
    expect(String(result.summary)).not.toMatch(/Massage|Anna|1 Main St/i);

    if (row.expectFindOneCalled) {
      expect(bookingRepo.findOne).toHaveBeenCalled();
    } else {
      expect(bookingRepo.findOne).not.toHaveBeenCalled();
    }

    if ('expectOwnedQuery' in row && row.expectOwnedQuery) {
      expect(bookingRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'book-stranger',
            businessId: 'biz-1',
            customerId: 'cust-attacker',
          }),
        }),
      );
    }
  });
});
