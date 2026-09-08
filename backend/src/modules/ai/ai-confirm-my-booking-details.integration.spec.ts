import { validateCommand } from './command-completion.validator.js';
import { handleConfirmMyBookingDetailsLogic } from './ai-confirm-my-booking-details.logic.js';
import {
  CONFIRM_MY_BOOKING_DETAILS_PROMPTS,
  CONFIRM_MY_BOOKING_DETAILS_RESCUE_SCENARIOS,
} from './ai-confirm-my-booking-details.fixtures.js';
import { rescueConfirmMyBookingDetailsIntent } from './ai-confirm-my-booking-details.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai confirm my booking details integration (ai-cmd-customer-4.3.1)', () => {
  const bookingRepo = { findOne: jest.fn(), find: jest.fn() };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      name: 'Glow Salon',
      address: '12 Main St',
    })),
  };
  const deps = { bookingRepo, businessRepo } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.findOne.mockResolvedValue({
      id: 'book-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-07-15T14:00:00Z'),
      endTime: new Date('2026-07-15T15:00:00Z'),
      service: { name: 'Massage' },
      employee: { name: 'Anna Kim' },
    });
  });

  it.each(CONFIRM_MY_BOOKING_DETAILS_PROMPTS)(
    'validates and executes $id',
    async ({ prompt, aspect }) => {
      const validation = validateCommand(makeResolvedCommand({
        action: 'confirm_my_booking_details',
        params: { aspect, bookingId: 'book-1' },
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const result = await handleConfirmMyBookingDetailsLogic(
        deps,
        'biz-1',
        { aspect, bookingId: 'book-1', sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('confirm_my_booking_details');
    },
  );

  it.each(CONFIRM_MY_BOOKING_DETAILS_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueConfirmMyBookingDetailsIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'confirm_booking_details',
      });
    },
  );
});
