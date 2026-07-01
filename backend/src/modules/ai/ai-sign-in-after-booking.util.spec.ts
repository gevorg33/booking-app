import {
  SIGN_IN_AFTER_BOOKING_BOUNDARY_PROMPTS,
  SIGN_IN_AFTER_BOOKING_PROMPTS,
  SIGN_IN_AFTER_BOOKING_RESCUE_SCENARIOS,
} from './ai-sign-in-after-booking.fixtures.js';
import { SIGN_IN_AFTER_BOOKING_MULTILINGUAL_SCENARIOS } from './ai-sign-in-after-booking-multilingual.fixtures.js';
import {
  assembleSignInAfterBookingSummary,
  buildSignInAfterBookingNavigate,
  isSignInAfterBookingIntent,
  isSignInAfterBookingPrompt,
  parseSignInAfterBookingFromPrompt,
  rescueSignInAfterBookingIntent,
  resolveGuestMergeHintFromParams,
  resolveSignInAfterBookingAspect,
} from './ai-sign-in-after-booking.util.js';

describe('ai-sign-in-after-booking.util (ai-cmd-customer-4.12.5)', () => {
  it.each(SIGN_IN_AFTER_BOOKING_PROMPTS.map((row) => [row.id, row.prompt]))(
    'detects prompt %s',
    (_id, prompt) => {
      expect(isSignInAfterBookingPrompt(prompt)).toBe(true);
    },
  );

  it.each(
    SIGN_IN_AFTER_BOOKING_MULTILINGUAL_SCENARIOS.map((row) => [
      row.id,
      row.prompt,
    ]),
  )('detects multilingual prompt %s', (_id, prompt) => {
    expect(isSignInAfterBookingPrompt(prompt)).toBe(true);
  });

  it.each(SIGN_IN_AFTER_BOOKING_BOUNDARY_PROMPTS)(
    'rejects boundary prompt $id',
    ({ prompt }) => {
      expect(isSignInAfterBookingPrompt(prompt)).toBe(false);
    },
  );

  it.each(SIGN_IN_AFTER_BOOKING_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueSignInAfterBookingIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('parses aspects and builds merge hints', () => {
    expect(
      resolveSignInAfterBookingAspect('Sign in with Google after booking'),
    ).toBe('provider_sign_in');
    expect(
      parseSignInAfterBookingFromPrompt('Save this booking to my account')
        ?.aspect,
    ).toBe('save_to_account');
    expect(
      resolveGuestMergeHintFromParams({ guestEmail: 'alex@example.com' }),
    ).toMatch(/alex@example.com/);
    expect(
      assembleSignInAfterBookingSummary('skip_dismiss', {
        bookingId: 'book-1',
      }),
    ).toMatch(/Maybe later/i);
    expect(buildSignInAfterBookingNavigate('book-1')).toEqual({
      path: 'book',
      query: { confirmedBookingId: 'book-1' },
    });
  });

  it('recognizes sign_in_after_booking intent', () => {
    expect(isSignInAfterBookingIntent('sign_in_after_booking')).toBe(true);
    expect(
      rescueSignInAfterBookingIntent(
        'Save this booking to my account',
        'sign_in_after_booking',
      ),
    ).toBeNull();
  });

  it('detects Armenian and Cyrillic prompts', () => {
    expect(
      isSignInAfterBookingPrompt('Պահպանել այս ամրագրումը իմ հաշվում'),
    ).toBe(true);
    expect(
      isSignInAfterBookingPrompt('Сохранить эту запись в моём аккаунте'),
    ).toBe(true);
    expect(
      isSignInAfterBookingPrompt(
        'Как сохранить гостевую запись после бронирования?',
      ),
    ).toBe(true);
  });

  it('assembles signed-in and merge summaries', () => {
    expect(
      assembleSignInAfterBookingSummary('how_it_works', { signedIn: true }),
    ).toMatch(/already signed in/i);
    expect(
      assembleSignInAfterBookingSummary('merge_rules', {
        mergeHint: 'Sign in with the same email (a@b.com)',
      }),
    ).toMatch(/a@b.com/);
    expect(
      parseSignInAfterBookingFromPrompt('Why do you need my email?'),
    ).toBeNull();
  });

  it('resolves guest phone merge hints', () => {
    expect(
      resolveGuestMergeHintFromParams({ guestPhone: '+15551234567' }),
    ).toMatch(/\+15551234567/);
    expect(buildSignInAfterBookingNavigate()).toEqual({
      path: 'login',
      query: {},
    });
  });
});
