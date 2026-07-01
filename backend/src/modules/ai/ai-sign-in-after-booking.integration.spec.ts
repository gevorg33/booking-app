import { handleSignInAfterBookingLogic } from './ai-sign-in-after-booking.logic.js';
import {
  SIGN_IN_AFTER_BOOKING_PROMPTS,
  SIGN_IN_AFTER_BOOKING_RESCUE_SCENARIOS,
} from './ai-sign-in-after-booking.fixtures.js';
import { rescueSignInAfterBookingIntent } from './ai-sign-in-after-booking.util.js';

describe('ai-sign-in-after-booking integration (ai-cmd-customer-4.12.5)', () => {
  it.each(
    SIGN_IN_AFTER_BOOKING_PROMPTS.slice(0, 3).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles sign_in_after_booking for $0', async (_id, prompt) => {
    const result = await handleSignInAfterBookingLogic(
      {} as any,
      'biz-1',
      { sessionBookingId: 'book-1', guestEmail: 'guest@example.com' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('sign_in_after_booking');
  });

  it.each(SIGN_IN_AFTER_BOOKING_RESCUE_SCENARIOS)(
    'pipeline rescues sign_in_after_booking for $id',
    ({ prompt, misclassifiedAction }) => {
      const rescued = rescueSignInAfterBookingIntent(
        prompt,
        misclassifiedAction,
      );
      expect(rescued?.action).toBe('sign_in_after_booking');
    },
  );
});
