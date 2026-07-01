import { validateCommand } from './command-completion.validator.js';
import { handleAddBookingToCalendarLogic } from './ai-add-booking-to-calendar.logic.js';
import {
  ADD_BOOKING_TO_CALENDAR_PROMPTS,
  ADD_BOOKING_TO_CALENDAR_RESCUE_SCENARIOS,
} from './ai-add-booking-to-calendar.fixtures.js';
import { rescueAddBookingToCalendarIntent } from './ai-add-booking-to-calendar.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('ai add booking to calendar integration (ai-cmd-customer-4.3.2)', () => {
  const bookingRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(async (row) => row),
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
      const validation = validateCommand({
        action: 'add_booking_to_calendar',
        params: { format, bookingId: 'book-1' },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
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
