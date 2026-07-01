import {
  EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS,
  EXPLAIN_MANAGE_BOOKING_PAGE_RESCUE_SCENARIOS,
} from './ai-explain-manage-booking-page.fixtures.js';
import { EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_SCENARIOS } from './ai-explain-manage-booking-page-multilingual.fixtures.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';

describe('customer explain_manage_booking_page integration (ai-cmd-customer-4.20.7)', () => {
  it.each(
    [
      ...EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS.filter(
        (row) => row.surface === 'customer',
      ),
      ...EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_SCENARIOS.filter(
        (row) => row.surface === 'customer',
      ),
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues explain_manage_booking_page for $0', (_id, prompt) => {
    expect(rescueSelfServiceBookingIntent(prompt, 'unknown')?.action).toBe(
      'explain_manage_booking_page',
    );
  });

  it.each(EXPLAIN_MANAGE_BOOKING_PAGE_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueSelfServiceBookingIntent(prompt, misclassifiedAction)?.action,
      ).toBe('explain_manage_booking_page');
    },
  );
});
