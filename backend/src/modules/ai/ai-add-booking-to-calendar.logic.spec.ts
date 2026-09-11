import { BookingStatus } from '../booking/entities/booking.entity.js';
import { handleAddBookingToCalendarLogic } from './ai-add-booking-to-calendar.logic.js';
import { ADD_BOOKING_TO_CALENDAR_PROMPTS } from './ai-add-booking-to-calendar.fixtures.js';

describe('ai-add-booking-to-calendar.logic (ai-cmd-customer-4.3.2)', () => {
  // `manager.transaction` — the manifest's `mock_missing_transaction` class.
  //
  // `handleAddBookingToCalendarLogic` mints a manage token via
  // `ensureBookingManageToken`, which opens `bookingRepo.manager.transaction`
  // and, inside it, locks the row with a query builder. The mock had no
  // `manager`, so every case died with "Cannot read properties of undefined
  // (reading 'transaction')" before reaching anything this suite is about — the
  // failures were about the mock, not the behaviour.
  //
  // Modelled on what the real transaction does rather than stubbed to a fixed
  // string: the callback receives a manager whose query builder returns the
  // booking `findOne` was primed with, so the token is minted, persisted onto
  // `metadata`, and — crucially — a second call returns the *same* token, which
  // is the property `ensureBookingManageToken` exists to guarantee.
  const manager = {
    // The locked read returns whatever the test primed on `findOne`, so a case
    // does not have to set the booking up twice for one logical row.
    createQueryBuilder: () => ({
      setLock: () => ({
        where: () => ({ getOne: async () => bookingRepo.findOne() }),
      }),
    }),
    save: jest.fn(async (_entity: unknown, row: any) => row),
  };
  const bookingRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(async (row) => row),
    manager: {
      transaction: async (cb: (m: typeof manager) => Promise<unknown>) =>
        cb(manager),
    },
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      slug: 'glow-salon',
      name: 'Glow Salon',
      address: '12 Main St',
    })),
  };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'FRONTEND_URL') return 'https://app.test';
      if (key === 'PUBLIC_API_URL') return 'https://api.test';
      return undefined;
    }),
  };

  const deps = { bookingRepo, businessRepo, configService } as any;

  const sampleBooking = {
    id: 'book-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    serviceId: 'svc-1',
    employeeId: 'emp-1',
    status: BookingStatus.CONFIRMED,
    startTime: new Date('2026-07-15T14:00:00Z'),
    endTime: new Date('2026-07-15T15:00:00Z'),
    metadata: {},
    service: { id: 'svc-1', name: 'Massage' },
    employee: { id: 'emp-1', name: 'Anna Kim' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.findOne.mockReset();
    bookingRepo.find.mockReset();
    bookingRepo.save.mockReset();
    bookingRepo.findOne.mockResolvedValue(sampleBooking);
    bookingRepo.find.mockResolvedValue([sampleBooking]);
  });

  it.each(
    ADD_BOOKING_TO_CALENDAR_PROMPTS.slice(0, 4).map(
      (row) => [row.id, row] as const,
    ),
  )('returns calendar links for $id', async (_id, row) => {
    const result = await handleAddBookingToCalendarLogic(
      deps,
      'biz-1',
      {
        format: row.format,
        bookingId: 'book-1',
        sessionCustomerId: 'cust-1',
      },
      row.prompt,
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('add_booking_to_calendar');
    expect(result.details?.bookingId).toBe('book-1');
    if (row.format === 'google' || row.format === 'all') {
      expect(String(result.details?.googleCalendarUrl)).toContain(
        'calendar.google.com',
      );
    }
    if (row.format === 'ics' || row.format === 'all') {
      expect(String(result.details?.icsDownloadUrl)).toContain('.ics');
    }
  });

  it('returns clarify when booking cannot be resolved', async () => {
    bookingRepo.findOne.mockResolvedValueOnce(null);
    const result = await handleAddBookingToCalendarLogic(
      deps,
      'biz-1',
      {},
      ADD_BOOKING_TO_CALENDAR_PROMPTS[0].prompt,
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns outlook-only link when format is outlook', async () => {
    const row = ADD_BOOKING_TO_CALENDAR_PROMPTS.find(
      (entry) => entry.id === 'outlook-calendar-customer',
    )!;
    const result = await handleAddBookingToCalendarLogic(
      deps,
      'biz-1',
      {
        format: row.format,
        bookingId: 'book-1',
        sessionCustomerId: 'cust-1',
      },
      row.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.details?.outlookCalendarUrl).toContain('outlook.live.com');
    expect(result.details?.googleCalendarUrl).toBeUndefined();
  });

  it('returns failure when business is missing', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);
    const result = await handleAddBookingToCalendarLogic(
      deps,
      'biz-1',
      { format: 'all', bookingId: 'book-1' },
      ADD_BOOKING_TO_CALENDAR_PROMPTS[0].prompt,
    );
    expect(result.success).toBe(false);
  });

  it('returns google-only link when format is google', async () => {
    const row = ADD_BOOKING_TO_CALENDAR_PROMPTS.find(
      (entry) => entry.id === 'google-calendar-customer',
    )!;
    const result = await handleAddBookingToCalendarLogic(
      deps,
      'biz-1',
      {
        format: row.format,
        bookingId: 'book-1',
        sessionCustomerId: 'cust-1',
      },
      row.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.details?.googleCalendarUrl).toContain('calendar.google.com');
    expect(result.details?.outlookCalendarUrl).toBeUndefined();
  });
});
