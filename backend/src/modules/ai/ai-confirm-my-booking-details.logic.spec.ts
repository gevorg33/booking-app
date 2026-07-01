import { BookingStatus } from '../booking/entities/booking.entity.js';
import { handleConfirmMyBookingDetailsLogic } from './ai-confirm-my-booking-details.logic.js';
import { CONFIRM_MY_BOOKING_DETAILS_PROMPTS } from './ai-confirm-my-booking-details.fixtures.js';

describe('ai-confirm-my-booking-details.logic (ai-cmd-customer-4.3.1)', () => {
  const bookingRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      name: 'Glow Salon',
      address: '12 Main St',
    })),
  };

  const deps = { bookingRepo, businessRepo } as any;

  const sampleBooking = {
    id: 'book-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    serviceId: 'svc-1',
    employeeId: 'emp-1',
    status: BookingStatus.CONFIRMED,
    startTime: new Date('2026-07-15T14:00:00Z'),
    endTime: new Date('2026-07-15T15:00:00Z'),
    service: { id: 'svc-1', name: 'Massage' },
    employee: { id: 'emp-1', name: 'Anna Kim' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.findOne.mockResolvedValue(sampleBooking);
    bookingRepo.find.mockResolvedValue([sampleBooking]);
  });

  it.each(
    CONFIRM_MY_BOOKING_DETAILS_PROMPTS.slice(0, 4).map(
      (row) => [row.id, row] as const,
    ),
  )('returns booking summary for $id', async (_id, row) => {
    const result = await handleConfirmMyBookingDetailsLogic(
      deps,
      'biz-1',
      {
        aspect: row.aspect,
        bookingId: 'book-1',
        sessionCustomerId: 'cust-1',
      },
      row.prompt,
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('confirm_my_booking_details');
    expect(result.details?.bookingId).toBe('book-1');
    expect(result.details?.serviceName).toBe('Massage');
    expect(String(result.summary)).toMatch(/Massage|Anna|appointment|booking/i);
  });

  it('returns clarify when booking cannot be resolved', async () => {
    bookingRepo.findOne.mockResolvedValueOnce(null);
    const result = await handleConfirmMyBookingDetailsLogic(
      deps,
      'biz-1',
      {},
      CONFIRM_MY_BOOKING_DETAILS_PROMPTS[0].prompt,
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
