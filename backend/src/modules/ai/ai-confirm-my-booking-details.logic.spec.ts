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

  const MANAGE_TOKEN = 'tok-legit-aaaa-bbbb-cccc';

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
    metadata: { manageToken: MANAGE_TOKEN },
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

  describe('e2e-bug.128 / e2e-bug.96 guest manage-token IDOR', () => {
    it('rejects anonymous bookingId without manageToken (no leak)', async () => {
      const result = await handleConfirmMyBookingDetailsLogic(
        deps,
        'biz-1',
        { bookingId: 'book-1' },
        'what is this booking',
      );
      expect(result.success).toBe(false);
      expect(String(result.summary)).toMatch(/manage link/i);
      expect(result.details?.serviceName).toBeUndefined();
      expect(String(result.summary)).not.toMatch(/Massage|Anna/i);
      expect(bookingRepo.findOne).not.toHaveBeenCalled();
    });

    it('rejects anonymous bookingId with garbage manageToken', async () => {
      const result = await handleConfirmMyBookingDetailsLogic(
        deps,
        'biz-1',
        { bookingId: 'book-1', manageToken: '00000000-0000-0000-0000-000000000000' },
        'what is this booking',
      );
      expect(result.success).toBe(false);
      expect(String(result.summary)).toMatch(/manage link/i);
      expect(result.details?.serviceName).toBeUndefined();
      expect(String(result.summary)).not.toMatch(/Massage|Anna/i);
    });

    it('rejects wrong booking token for this bookingId', async () => {
      bookingRepo.findOne.mockResolvedValueOnce({
        ...sampleBooking,
        metadata: { manageToken: 'tok-other-booking' },
      });
      const result = await handleConfirmMyBookingDetailsLogic(
        deps,
        'biz-1',
        { bookingId: 'book-1', manageToken: MANAGE_TOKEN },
        'what is this booking',
      );
      expect(result.success).toBe(false);
      expect(result.details?.serviceName).toBeUndefined();
    });

    it('rejects signed-in caller for another customer bookingId', async () => {
      bookingRepo.findOne.mockResolvedValueOnce(null);
      const result = await handleConfirmMyBookingDetailsLogic(
        deps,
        'biz-1',
        {
          bookingId: 'book-stranger',
          sessionCustomerId: 'cust-attacker',
        },
        'summarize my booking',
      );
      expect(result.success).toBe(false);
      expect(bookingRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'book-stranger',
            businessId: 'biz-1',
            customerId: 'cust-attacker',
          }),
        }),
      );
      expect(result.details?.serviceName).toBeUndefined();
    });

    it('allows guest with matching manageToken', async () => {
      const result = await handleConfirmMyBookingDetailsLogic(
        deps,
        'biz-1',
        { bookingId: 'book-1', manageToken: MANAGE_TOKEN },
        'what is this booking',
      );
      expect(result.success).toBe(true);
      expect(result.details?.bookingId).toBe('book-1');
      expect(result.details?.serviceName).toBe('Massage');
    });

    it('allows guest credentials embedded in manage-link URL', async () => {
      const result = await handleConfirmMyBookingDetailsLogic(
        deps,
        'biz-1',
        {},
        `what's this booking? https://book.example/manage?bookingId=book-1&token=${MANAGE_TOKEN}`,
      );
      expect(result.success).toBe(true);
      expect(result.details?.bookingId).toBe('book-1');
    });
  });
});
