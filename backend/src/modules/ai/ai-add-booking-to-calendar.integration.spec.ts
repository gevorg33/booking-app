import { validateCommand } from './command-completion.validator.js';
import { handleAddBookingToCalendarLogic } from './ai-add-booking-to-calendar.logic.js';
import {
  ADD_BOOKING_TO_CALENDAR_PROMPTS,
  ADD_BOOKING_TO_CALENDAR_RESCUE_SCENARIOS,
} from './ai-add-booking-to-calendar.fixtures.js';
import { rescueAddBookingToCalendarIntent } from './ai-add-booking-to-calendar.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai add booking to calendar integration (ai-cmd-customer-4.3.2)', () => {
  // `manager.transaction` — the manifest's `mock_missing_transaction` class,
  // and the same gap its sibling `.logic.spec.ts` had.
  //
  // The handler mints a manage token via `ensureBookingManageToken`, which
  // opens `bookingRepo.manager.transaction` and locks the row inside it. With
  // no `manager` on the mock every case died with "Cannot read properties of
  // undefined (reading 'transaction')" before reaching the behaviour under
  // test, so all 22 failures were about the mock rather than the code.
  //
  // The locked read delegates to the same `findOne` the tests prime, so a case
  // sets its booking up once.
  const manager = {
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

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.findOne.mockResolvedValue({
      id: 'book-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-07-15T14:00:00Z'),
      endTime: new Date('2026-07-15T15:00:00Z'),
      metadata: {},
      service: { name: 'Massage' },
      employee: { name: 'Anna Kim' },
    });
  });

  it.each(ADD_BOOKING_TO_CALENDAR_PROMPTS)(
    'validates and executes $id',
    async ({ prompt, format }) => {
      const validation = validateCommand(
        makeResolvedCommand({
          action: 'add_booking_to_calendar',
          params: { format, bookingId: 'book-1' },
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleAddBookingToCalendarLogic(
        deps,
        'biz-1',
        { format, bookingId: 'book-1', sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('add_booking_to_calendar');
    },
  );

  it.each(ADD_BOOKING_TO_CALENDAR_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueAddBookingToCalendarIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'add_booking_calendar',
      });
    },
  );
});
