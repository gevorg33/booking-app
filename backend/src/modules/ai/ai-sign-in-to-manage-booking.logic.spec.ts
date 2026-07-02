import { handleSignInToManageBookingLogic } from './ai-sign-in-to-manage-booking.logic.js';
import { SIGN_IN_TO_MANAGE_BOOKING_PROMPTS } from './ai-sign-in-to-manage-booking.fixtures.js';
import { SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_SCENARIOS } from './ai-sign-in-to-manage-booking-multilingual.fixtures.js';

describe('ai-sign-in-to-manage-booking.logic (ai-cmd-customer-4.17.2)', () => {
  it.each(
    SIGN_IN_TO_MANAGE_BOOKING_PROMPTS.map((row) => [row.id, row] as const),
  )('handles prompt $0', async (_id, row) => {
    const result = await handleSignInToManageBookingLogic(
      'biz-1',
      {},
      row.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('sign_in_to_manage_booking');
  });

  it('navigates guests to login for manage hint', async () => {
    const result = await handleSignInToManageBookingLogic(
      'biz-1',
      {},
      'Sign in to change my appointment',
    );
    expect(result.details?.navigate).toEqual({
      path: 'login',
      query: { reason: 'manage_booking' },
    });
  });

  it('navigates signed-in users to account', async () => {
    const result = await handleSignInToManageBookingLogic(
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Manage link says sign in',
    );
    expect(result.details?.signedIn).toBe(true);
    expect(result.details?.navigate).toEqual({ path: 'account', query: {} });
  });

  it.each(
    SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('handles multilingual prompt $0', async (_id, row) => {
    const result = await handleSignInToManageBookingLogic(
      'biz-1',
      {},
      row.prompt,
    );
    expect(result.success).toBe(true);
  });

  it('fails clarify when prompt does not match', async () => {
    const result = await handleSignInToManageBookingLogic(
      'biz-1',
      {},
      'What is the weather today?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
