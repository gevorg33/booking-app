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
  const upcomingSwedish = [
    {
      id: 'book-jul-29',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-07-29T10:00:00.000Z'),
      service: { name: 'Swedish massage' },
      employee: { name: 'Gevorg' },
    },
    {
      id: 'book-aug-18',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-08-18T10:00:00.000Z'),
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
