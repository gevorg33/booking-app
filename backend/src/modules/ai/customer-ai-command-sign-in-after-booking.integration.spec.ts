import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';
import { SIGN_IN_AFTER_BOOKING_PROMPTS } from './ai-sign-in-after-booking.fixtures.js';

describe('customer-ai-command sign_in_after_booking integration (ai-cmd-customer-4.12.5)', () => {
  it.each(SIGN_IN_AFTER_BOOKING_PROMPTS.map((row) => [row.id, row.prompt]))(
    'rescues sign_in_after_booking for $0',
    (_id, prompt) => {
      expect(rescueSelfServiceBookingIntent(prompt, 'unknown')?.action).toBe(
        'sign_in_after_booking',
      );
    },
  );
});
