import { ADD_BOOKING_TO_CALENDAR_PROMPTS } from './ai-add-booking-to-calendar.fixtures.js';
import { rescueAddBookingToCalendarIntent } from './ai-add-booking-to-calendar.util.js';

describe('customer-ai-command add_booking_to_calendar integration (ai-cmd-customer-4.3.2)', () => {
  it.each(
    ADD_BOOKING_TO_CALENDAR_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )('rescues add_booking_to_calendar for $id', (_id, row) => {
    expect(
      rescueAddBookingToCalendarIntent(row.prompt, 'unknown')?.action,
    ).toBe('add_booking_to_calendar');
  });
});
