import { EXPLAIN_BOOKING_DATE_FORMAT_PROMPTS } from './ai-booking-date-format.fixtures.js';
import {
  isBookingDateFormatIntent,
  isExplainBookingDateFormatPrompt,
  rescueBookingDateFormatIntent,
} from './ai-booking-date-format.util.js';

describe('ai-booking-date-format.util (ai-cmd-fmt-4)', () => {
  it.each(EXPLAIN_BOOKING_DATE_FORMAT_PROMPTS)(
    'detects explain prompt $id',
    ({ prompt }) => {
      expect(isExplainBookingDateFormatPrompt(prompt)).toBe(true);
      expect(rescueBookingDateFormatIntent(prompt, 'unknown')).toEqual({
        action: 'explain_booking_date_format',
        rescueReason: 'explain_booking_date_format',
      });
    },
  );

  it('does not rescue when action is already explain_booking_date_format', () => {
    expect(
      rescueBookingDateFormatIntent(
        EXPLAIN_BOOKING_DATE_FORMAT_PROMPTS[0].prompt,
        'explain_booking_date_format',
      ),
    ).toBeNull();
  });

  it('does not route dashboard salon settings to booking date format', () => {
    expect(
      isExplainBookingDateFormatPrompt('What date format does our salon use?'),
    ).toBe(false);
    expect(
      isExplainBookingDateFormatPrompt(
        'Explain our date and time format settings',
      ),
    ).toBe(false);
  });

  it('recognizes booking date format intent id', () => {
    expect(isBookingDateFormatIntent('explain_booking_date_format')).toBe(true);
    expect(isBookingDateFormatIntent('explain_business_date_format')).toBe(
      false,
    );
  });
});
