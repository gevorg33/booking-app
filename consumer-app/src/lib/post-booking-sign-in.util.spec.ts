import { describe, expect, it } from 'vitest';
import {
  BOOKING_ACTIVATION_ROUTE_SCENARIOS,
  GUEST_MERGE_HINT_SCENARIOS,
  POST_BOOKING_SIGN_IN_PROMPT_SCENARIOS,
} from './post-booking-sign-in.fixtures.js';
import {
  bookingActivationNeverRequiresSignIn,
  bookingCompletedAsGuest,
  buildPostBookingSignInCopy,
  hasShownPostBookingSignInPrompt,
  readPostBookingSignInDecision,
  recordPostBookingSignInDecision,
  resolveGuestAccountMergeHint,
  resolvePostBookingSignInAnalyticsProps,
  shouldPromptPostBookingSignIn,
} from './post-booking-sign-in.util.js';

describe('post-booking-sign-in.util', () => {
  it.each(POST_BOOKING_SIGN_IN_PROMPT_SCENARIOS)(
    'shouldPromptPostBookingSignIn $id',
    ({ input, expectPrompt }) => {
      expect(shouldPromptPostBookingSignIn(input)).toBe(expectPrompt);
    },
  );

  it.each(BOOKING_ACTIVATION_ROUTE_SCENARIOS)(
    'bookingActivationNeverRequiresSignIn $id',
    ({ path, expectNoAuthWall }) => {
      expect(bookingActivationNeverRequiresSignIn(path)).toBe(expectNoAuthWall);
    },
  );

  it.each(GUEST_MERGE_HINT_SCENARIOS)('resolveGuestAccountMergeHint $id', ({ contact, expectIncludes }) => {
    expect(resolveGuestAccountMergeHint(contact)).toContain(expectIncludes);
  });

  it('bookingCompletedAsGuest reflects missing session token', () => {
    expect(bookingCompletedAsGuest(false)).toBe(true);
    expect(bookingCompletedAsGuest(true)).toBe(false);
  });

  it('buildPostBookingSignInCopy returns localized strings', () => {
    const copy = buildPostBookingSignInCopy('en');
    expect(copy.title.length).toBeGreaterThan(0);
    expect(copy.google).toContain('Google');
  });

  it('persists post-booking sign-in decisions per booking', () => {
    localStorage.clear();
    recordPostBookingSignInDecision('bk-1', 'skipped');
    expect(hasShownPostBookingSignInPrompt('bk-1')).toBe(true);
    expect(readPostBookingSignInDecision('bk-1')).toBe('skipped');
  });

  it('resolvePostBookingSignInAnalyticsProps includes booking id', () => {
    expect(
      resolvePostBookingSignInAnalyticsProps({
        bookingId: 'bk-9',
        provider: 'google',
        decision: 'completed',
      }),
    ).toEqual({
      bookingId: 'bk-9',
      onboardingStep: 'google',
      firstRunRedirect: 'completed',
    });
  });
});
