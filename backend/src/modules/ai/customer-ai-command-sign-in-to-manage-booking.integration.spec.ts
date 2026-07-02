import {
  SIGN_IN_TO_MANAGE_BOOKING_PROMPTS,
  SIGN_IN_TO_MANAGE_BOOKING_RESCUE_SCENARIOS,
} from './ai-sign-in-to-manage-booking.fixtures.js';
import { SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_SCENARIOS } from './ai-sign-in-to-manage-booking-multilingual.fixtures.js';
import { rescueSignInToManageBookingIntent } from './ai-sign-in-to-manage-booking.util.js';

describe('customer sign_in_to_manage_booking integration (ai-cmd-customer-4.17.2)', () => {
  it.each(
    [
      ...SIGN_IN_TO_MANAGE_BOOKING_PROMPTS,
      ...SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues sign_in_to_manage_booking for $0', (_id, prompt) => {
    expect(rescueSignInToManageBookingIntent(prompt, 'unknown')?.action).toBe(
      'sign_in_to_manage_booking',
    );
  });

  it.each(SIGN_IN_TO_MANAGE_BOOKING_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueSignInToManageBookingIntent(prompt, misclassifiedAction)?.action,
      ).toBe('sign_in_to_manage_booking');
    },
  );
});
