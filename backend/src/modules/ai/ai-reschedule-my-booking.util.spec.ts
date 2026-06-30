import { BookingStatus } from '../booking/entities/booking.entity.js';
import { matchCustomerOwnedBooking } from './ai-cancel-my-booking.util.js';
import {
  buildRescheduleMyBookingAmbiguousSummary,
  buildRescheduleOwnedBookingMatchParams,
  enrichRescheduleMyBookingParamsFromPrompt,
  RESCHEDULE_MY_BOOKING_PROMPTS,
} from './ai-reschedule-my-booking.util.js';
import {
  isRescheduleMyBookingPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';

describe('ai-reschedule-my-booking.util (ai-cmd-customer-4.4.3)', () => {
  const sampleBookings = [
    {
      id: 'book-1',
      status: BookingStatus.CONFIRMED,
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      service: { name: 'Massage' },
      employee: { name: 'Maria' },
    },
    {
      id: 'book-2',
      status: BookingStatus.CONFIRMED,
      startTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      service: { name: 'Facial' },
      employee: { name: 'Alex' },
    },
  ];

  it('matches owned booking by service name without target date filter', () => {
    const enriched = enrichRescheduleMyBookingParamsFromPrompt(
      {},
      'Move my massage to Friday 3pm',
      'UTC',
    );
    const matched = matchCustomerOwnedBooking(
      sampleBookings,
      buildRescheduleOwnedBookingMatchParams(enriched),
      '',
      'UTC',
      { allowFirstWhenUnspecified: false },
    );
    expect(matched.booking?.id).toBe('book-1');
  });

  it('returns ambiguous when multiple bookings match filters', () => {
    const matched = matchCustomerOwnedBooking(
      sampleBookings,
      {},
      '',
      'UTC',
      { allowFirstWhenUnspecified: false },
    );
    expect(matched.booking).toBeNull();
    expect(matched.ambiguous).toHaveLength(2);
    expect(buildRescheduleMyBookingAmbiguousSummary(matched.ambiguous)).toContain(
      'several upcoming appointments',
    );
  });

  it.each(RESCHEDULE_MY_BOOKING_PROMPTS.map((row) => [row.id, row] as const))(
    'detects reschedule-my-booking prompt $id',
    (_id, row) => {
      expect(isRescheduleMyBookingPrompt(row.prompt)).toBe(true);
    },
  );

  it.each(RESCHEDULE_MY_BOOKING_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues reschedule-my-booking prompt $id from unknown',
    (_id, row) => {
      const rescued = rescueSelfServiceBookingIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
    },
  );

  it('enriches target date and time from move prompt', () => {
    const enriched = enrichRescheduleMyBookingParamsFromPrompt(
      {},
      'Move my visit to Friday 3pm',
      'UTC',
    );
    expect(enriched.date).toBeTruthy();
    expect(enriched.timeSlot).toBeTruthy();
  });

  it('does not steal staff reschedule bookings prompts', () => {
    expect(
      isRescheduleMyBookingPrompt('Reschedule all bookings for Anna'),
    ).toBe(false);
    expect(
      rescueSelfServiceBookingIntent(
        'Reschedule all bookings for Anna',
        'unknown',
      )?.action,
    ).not.toBe('reschedule_my_booking');
  });
});
