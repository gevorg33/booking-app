import {
  applyProviderMobilePromptHints,
  decomposeProviderMobileCompoundPrompt,
  disambiguateProviderMobileAction,
  inheritProviderPushFollowUpContext,
  isConfirmBookingFromPushPrompt,
  isProviderMobileCompoundPrompt,
  resolveProviderPushActionIdFromPrompt,
} from './ai-provider-mobile-hints.util.js';

describe('ai-provider-mobile-hints.util', () => {
  const lastPush = {
    bookingId: 'book-push-1',
    pushType: 'booking_created',
    title: 'New appointment',
  };

  it('detects confirm-from-push phrasing', () => {
    expect(
      isConfirmBookingFromPushPrompt(
        'Confirm this booking from the push notification',
      ),
    ).toBe(true);
    expect(isConfirmBookingFromPushPrompt('confirm it')).toBe(true);
  });

  it('maps NL to push deep-link action ids', () => {
    expect(
      resolveProviderPushActionIdFromPrompt(
        'Confirm appointment from push notification',
      ),
    ).toBe('confirm');
    expect(
      resolveProviderPushActionIdFromPrompt('Mark booking paid from push'),
    ).toBe('mark_paid');
    expect(
      resolveProviderPushActionIdFromPrompt(
        'Reschedule from push notification',
      ),
    ).toBe('suggest_reschedule');
  });

  it('disambiguates update_bookings to confirm_booking_from_push', () => {
    expect(
      disambiguateProviderMobileAction(
        'Confirm this booking from the push',
        'update_bookings',
        { lastPush },
      )?.action,
    ).toBe('confirm_booking_from_push');
  });

  it('disambiguates scoped package list intents', () => {
    expect(
      disambiguateProviderMobileAction(
        'Show my package appointments today',
        'list_package_bookings',
      )?.action,
    ).toBe('list_package_appointments_today');
  });

  it('inherits bookingId from lastPush for follow-up', () => {
    const params: Record<string, any> = {};
    inheritProviderPushFollowUpContext(
      params,
      { lastPush, bookingId: 'book-push-1' },
      'confirm_booking_from_push',
      'confirm it',
    );
    expect(params.bookingId).toBe('book-push-1');
  });

  it('enriches confirm params with status', () => {
    const params: Record<string, any> = { bookingId: 'book-1' };
    applyProviderMobilePromptHints(
      'confirm_booking_from_push',
      params,
      'confirm booking from push',
    );
    expect(params.status).toBe('confirmed');
    expect(params.pushActionId).toBe('confirm');
  });

  it('decomposes open booking + confirm compound', () => {
    const steps = decomposeProviderMobileCompoundPrompt(
      'Open booking from push and confirm it',
    );
    expect(steps.map((s) => s.action)).toEqual([
      'open_booking_from_push',
      'confirm_booking_from_push',
    ]);
    expect(isProviderMobileCompoundPrompt(steps[0].segment)).toBe(false);
  });

  it('decomposes explain push + mark paid compound', () => {
    const steps = decomposeProviderMobileCompoundPrompt(
      'Explain last push and mark booking paid',
    );
    expect(steps.map((s) => s.action)).toEqual([
      'explain_last_push',
      'mark_paid',
    ]);
  });
});
