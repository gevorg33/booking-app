import {
  E2E258_BOOKING_HELP_SCENARIOS,
  E2E258_LIVE_CASES,
  E2E258_STILL_CONFIRM_SCENARIOS,
} from './ai-e2e258-hy-how-to-book.fixtures.js';
import {
  isConfirmMyBookingDetailsPrompt,
  rescueConfirmMyBookingDetailsIntent,
} from './ai-confirm-my-booking-details.util.js';
import {
  isBookingHelpPrompt,
  rescuePublicBookingHelpIntent,
} from './ai-public-booking-guide.util.js';
import { CUSTOMER_PUBLIC_CONFIRM_MY_BOOKING_DETAILS_CLASSIFIER_RULES } from './ai-confirm-my-booking-details.util.js';

describe('e2e-bug.258 short Armenian how-to-book → booking_help', () => {
  it('classifier rules forbid booking_help how-to steal', () => {
    expect(
      CUSTOMER_PUBLIC_CONFIRM_MY_BOOKING_DETAILS_CLASSIFIER_RULES,
    ).toContain('NOT booking_help');
    expect(
      CUSTOMER_PUBLIC_CONFIRM_MY_BOOKING_DETAILS_CLASSIFIER_RULES,
    ).toContain('Ինչպես ամրագրել');
  });

  it('documents every live case id', () => {
    expect(E2E258_LIVE_CASES.map((c) => c.id)).toEqual([
      'e2e258-hy-short-how-book',
      'e2e258-hy-short-how-book-question-mark',
      'e2e258-hy-how-book-visit-no-step',
      'e2e258-hy-how-book-imperative',
      'e2e258-hy-full-step-by-step',
      'e2e258-ru-kak-zapisatsya',
      'e2e258-en-how-book-regression',
      'e2e258-hy-confirm-time',
      'e2e258-hy-confirm-summarize',
      'e2e258-hy-confirm-just-booked',
      'e2e258-hy-confirm-provider',
    ]);
  });

  it.each(E2E258_BOOKING_HELP_SCENARIOS.map((row) => [row.id, row] as const))(
    '$id: booking_help wins over confirm',
    (_id, row) => {
      expect(isBookingHelpPrompt(row.prompt)).toBe(true);
      expect(isConfirmMyBookingDetailsPrompt(row.prompt)).toBe(false);
      expect(
        rescueConfirmMyBookingDetailsIntent(row.prompt, 'unknown'),
      ).toBeNull();
      expect(
        rescuePublicBookingHelpIntent(row.prompt, 'confirm_my_booking_details'),
      ).toBe('booking_help');
      expect(rescuePublicBookingHelpIntent(row.prompt, 'unknown')).toBe(
        'booking_help',
      );
    },
  );

  it.each(E2E258_STILL_CONFIRM_SCENARIOS.map((row) => [row.id, row] as const))(
    '$id: confirm_my_booking_details still matches',
    (_id, row) => {
      expect(isBookingHelpPrompt(row.prompt)).toBe(false);
      expect(isConfirmMyBookingDetailsPrompt(row.prompt)).toBe(true);
      expect(
        rescueConfirmMyBookingDetailsIntent(row.prompt, 'unknown')?.action,
      ).toBe('confirm_my_booking_details');
      expect(
        rescuePublicBookingHelpIntent(row.prompt, 'confirm_my_booking_details'),
      ).toBe('confirm_my_booking_details');
    },
  );
});
