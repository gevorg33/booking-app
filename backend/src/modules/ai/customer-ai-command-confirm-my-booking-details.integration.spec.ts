import { CONFIRM_MY_BOOKING_DETAILS_PROMPTS } from './ai-confirm-my-booking-details.fixtures.js';
import { rescueConfirmMyBookingDetailsIntent } from './ai-confirm-my-booking-details.util.js';

describe('customer-ai-command confirm_my_booking_details integration (ai-cmd-customer-4.3.1)', () => {
  it.each(
    CONFIRM_MY_BOOKING_DETAILS_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )('rescues confirm_my_booking_details for $id', (_id, row) => {
    expect(
      rescueConfirmMyBookingDetailsIntent(row.prompt, 'unknown')?.action,
    ).toBe('confirm_my_booking_details');
  });
});
