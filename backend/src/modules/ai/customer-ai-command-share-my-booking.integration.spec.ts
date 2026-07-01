import { rescueShareMyBookingIntent } from './ai-share-my-booking.util.js';
import { SHARE_MY_BOOKING_PROMPTS } from './ai-share-my-booking.fixtures.js';

describe('customer-ai-command share_my_booking integration (ai-cmd-customer-4.3.7)', () => {
  it.each(SHARE_MY_BOOKING_PROMPTS)(
    'rescues share_my_booking for $id',
    ({ prompt }) => {
      expect(rescueShareMyBookingIntent(prompt, 'unknown')?.action).toBe(
        'share_my_booking',
      );
    },
  );
});
