import { handleSignInAfterBookingLogic } from './ai-sign-in-after-booking.logic.js';

describe('ai-sign-in-after-booking.logic (ai-cmd-customer-4.12.5)', () => {
  const deps = () => ({});

  it('clarifies when prompt is not post-booking sign-in', async () => {
    const result = await handleSignInAfterBookingLogic(
      deps() as any,
      'biz-1',
      {},
      'Why do you need my email on checkout?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('explains save-to-account flow with session booking context', async () => {
    const result = await handleSignInAfterBookingLogic(
      deps() as any,
      'biz-1',
      {
        sessionBookingId: 'book-99',
        guestEmail: 'guest@example.com',
      },
      'Save this booking to my account',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('sign_in_after_booking');
    expect(result.details.aspect).toBe('save_to_account');
    expect(result.summary).toMatch(/guest@example.com/);
    expect(result.details.navigate).toEqual({
      path: 'book',
      query: { confirmedBookingId: 'book-99' },
    });
  });

  it('notes when customer is already signed in', async () => {
    const result = await handleSignInAfterBookingLogic(
      deps() as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Explain the post-booking sign in prompt',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/already signed in/i);
    expect(result.details.signedIn).toBe(true);
  });
});
