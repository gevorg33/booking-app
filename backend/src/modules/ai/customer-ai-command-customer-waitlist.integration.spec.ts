import {
  CHECK_WAITLIST_STATUS_PROMPTS,
  JOIN_WAITLIST_PROMPTS,
} from './ai-customer-waitlist.fixtures.js';
import { rescueCustomerWaitlistIntent } from './ai-customer-waitlist.util.js';
import { SELF_SERVICE_BOOKING_MUTATE_INTENTS } from './ai-self-service-booking.util.js';

describe('customer-ai-command customer waitlist integration (ai-cmd-customer-4.4.7)', () => {
  it.each(
    JOIN_WAITLIST_PROMPTS.filter((row) => row.surface === 'customer').map(
      (row) => [row.id, row] as const,
    ),
  )('rescues join_waitlist for customer $id', (_id, row) => {
    expect(
      rescueCustomerWaitlistIntent(row.prompt, 'check_availability')?.action,
    ).toBe('join_waitlist');
  });

  it.each(
    CHECK_WAITLIST_STATUS_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )('rescues check_waitlist_status for customer $id', (_id, row) => {
    expect(
      rescueCustomerWaitlistIntent(row.prompt, 'list_waitlist_entries')?.action,
    ).toBe('check_waitlist_status');
  });

  it('registers join_waitlist as self-service mutate intent', () => {
    expect(SELF_SERVICE_BOOKING_MUTATE_INTENTS).toContain('join_waitlist');
  });
});
