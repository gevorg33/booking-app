import {
  E2E237_DATED_CANCEL_REBOOK_SCENARIOS,
  enrichRescheduleMyBookingParamsFromPrompt,
  buildRescheduleOwnedBookingMatchParams,
} from './ai-reschedule-my-booking.util.js';
import {
  isRescheduleMyBookingPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';
import { matchCustomerOwnedBooking } from './ai-cancel-my-booking.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('customer-ai-command reschedule_my_booking integration (e2e-bug.237)', () => {
  /**
   * e2e-bug.491's class — these bookings expired on a calendar.
   *
   * `buildRescheduleOwnedBookingMatchParams` only matches **upcoming** visits,
   * so once today passed 2026-08-18 both fixtures fell out of range and the
   * match returned nothing. The symptom is an assertion (an empty id list), not
   * a crash, which is why an error-class triage does not surface it.
   *
   * Relative to now, preserving the original 20-day gap and their order.
   */
  const inDays = (n: number): Date =>
    new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  const earlierVisit = inDays(10);
  const laterVisit = inDays(30);

  const upcomingSwedish = [
    {
      id: 'book-jul-29',
      status: BookingStatus.CONFIRMED,
      startTime: earlierVisit,
      service: { name: 'Swedish massage' },
      employee: { name: 'Gevorg' },
    },
    {
      id: 'book-aug-18',
      status: BookingStatus.CONFIRMED,
      startTime: laterVisit,
      service: { name: 'Swedish massage' },
      employee: { name: 'Gevorg' },
    },
  ];

  it.each(
    E2E237_DATED_CANCEL_REBOOK_SCENARIOS.map((row) => [row.id, row] as const),
  )(
    'e2e237 $id routes to reschedule and lists both Swedish visits',
    (_id, row) => {
      expect(isRescheduleMyBookingPrompt(row.prompt)).toBe(true);
      const rescued = rescueSelfServiceBookingIntent(
        row.prompt,
        row.misclassifiedAction,
      );
      expect(rescued?.action).toBe('reschedule_my_booking');

      const enriched = enrichRescheduleMyBookingParamsFromPrompt(
        { date: '2026-07-31' },
        row.prompt,
        'UTC',
      );
      // Destination Friday must not filter which visit to move.
      expect(enriched.fromDate).toBeUndefined();
      const matchParams = buildRescheduleOwnedBookingMatchParams(enriched);
      const matched = matchCustomerOwnedBooking(
        upcomingSwedish,
        matchParams,
        '',
        'UTC',
        { allowFirstWhenUnspecified: false },
      );
      expect(matched.booking).toBeNull();
      expect(matched.ambiguous.map((b) => b.id).sort()).toEqual([
        'book-aug-18',
        'book-jul-29',
      ]);
    },
  );
});
