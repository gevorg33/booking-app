import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  buildCancelMyBookingAmbiguousSummary,
  CANCEL_MY_BOOKING_PROMPTS,
  enrichCancelMyBookingParamsFromPrompt,
  matchCustomerOwnedBooking,
} from './ai-cancel-my-booking.util.js';
import { isCancelMyBookingPrompt } from './ai-self-service-booking.util.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';

describe('ai-cancel-my-booking.util (ai-cmd-customer-4.4.2)', () => {
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

  it('matches owned booking by service name', () => {
    const matched = matchCustomerOwnedBooking(
      sampleBookings,
      { serviceName: 'Massage' },
      "Cancel tomorrow's massage",
      'UTC',
      { allowFirstWhenUnspecified: false },
    );
    expect(matched.booking?.id).toBe('book-1');
  });

  it('returns ambiguous when multiple bookings match filters', () => {
    const matched = matchCustomerOwnedBooking(
      sampleBookings,
      {},
      'Cancel my booking',
      'UTC',
      { allowFirstWhenUnspecified: false },
    );
    expect(matched.booking).toBeNull();
    expect(matched.ambiguous).toHaveLength(2);
    expect(buildCancelMyBookingAmbiguousSummary(matched.ambiguous)).toContain(
      'several upcoming appointments',
    );
  });

  it.each(CANCEL_MY_BOOKING_PROMPTS.map((row) => [row.id, row] as const))(
    'detects cancel-my-booking prompt $id',
    (_id, row) => {
      expect(isCancelMyBookingPrompt(row.prompt)).toBe(true);
    },
  );

  it.each(CANCEL_MY_BOOKING_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues cancel-my-booking prompt $id from unknown',
    (_id, row) => {
      const rescued = rescueSelfServiceBookingIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
    },
  );

  it('enriches serviceName from cancel prompt', () => {
    expect(
      enrichCancelMyBookingParamsFromPrompt({}, "Cancel tomorrow's massage")
        .serviceName,
    ).toBeTruthy();
  });

  it('does not steal staff cancel bookings prompts', () => {
    expect(isCancelMyBookingPrompt('Cancel all bookings for Anna')).toBe(false);
    expect(
      rescueSelfServiceBookingIntent('Cancel all bookings for Anna', 'unknown')
        ?.action,
    ).not.toBe('cancel_my_booking');
  });
});
