import {
  CUSTOMER_PUBLIC_SIGN_IN_TO_MANAGE_BOOKING_CLASSIFIER_RULES,
  buildSignInToManageBookingNavigate,
  buildSignInToManageBookingSummary,
  hasSignInToManageBookingCue,
  enrichSignInToManageBookingParamsFromPrompt,
  isSignInToManageBookingPrompt,
  parseSignInToManageBookingFromPrompt,
  rescueSignInToManageBookingIntent,
} from './ai-sign-in-to-manage-booking.util.js';
import {
  SIGN_IN_TO_MANAGE_BOOKING_PROMPTS,
  SIGN_IN_TO_MANAGE_BOOKING_RESCUE_SCENARIOS,
} from './ai-sign-in-to-manage-booking.fixtures.js';
import { SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_SCENARIOS } from './ai-sign-in-to-manage-booking-multilingual.fixtures.js';
import { isRecoverLostManageLinkPrompt } from './ai-recover-lost-manage-link.util.js';
import { isGetManageLinkPrompt } from './ai-get-manage-link.util.js';

describe('ai-sign-in-to-manage-booking.util (ai-cmd-customer-4.17.2)', () => {
  it('exports classifier rules for sign_in_to_manage_booking', () => {
    expect(
      CUSTOMER_PUBLIC_SIGN_IN_TO_MANAGE_BOOKING_CLASSIFIER_RULES,
    ).toContain('sign_in_to_manage_booking');
  });

  it.each(
    SIGN_IN_TO_MANAGE_BOOKING_PROMPTS.map((row) => [row.id, row] as const),
  )('detects manage sign-in prompt for $0', (_id, row) => {
    expect(isSignInToManageBookingPrompt(row.prompt)).toBe(true);
    expect(parseSignInToManageBookingFromPrompt(row.prompt)?.aspect).toBe(
      row.aspect ?? expect.any(String),
    );
    expect(rescueSignInToManageBookingIntent(row.prompt, 'unknown')).toEqual({
      action: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
    });
  });

  it.each(
    SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual manage sign-in prompt for $0', (_id, row) => {
    expect(isSignInToManageBookingPrompt(row.prompt)).toBe(true);
  });

  it.each(
    SIGN_IN_TO_MANAGE_BOOKING_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues $0 from misclassified action', (_id, row) => {
    expect(
      rescueSignInToManageBookingIntent(row.prompt, row.misclassifiedAction),
    ).toEqual({
      action: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
    });
  });

  it('does not steal recover_lost_manage_link resend prompts', () => {
    expect(
      isSignInToManageBookingPrompt('Resend manage link to john@example.com'),
    ).toBe(false);
    expect(
      isRecoverLostManageLinkPrompt('Resend manage link to john@example.com'),
    ).toBe(true);
  });

  it('does not steal plain invalid manage link explain prompts', () => {
    expect(isSignInToManageBookingPrompt('Invalid manage link')).toBe(false);
  });

  it('covers helper paths and navigate', () => {
    expect(
      hasSignInToManageBookingCue('Sign in to change my appointment'),
    ).toBe(true);
    expect(
      parseSignInToManageBookingFromPrompt(
        'How do I sign in to manage my booking?',
      )?.aspect,
    ).toBe('how_to');
    expect(
      parseSignInToManageBookingFromPrompt(
        'Sign in to manage from your account',
      )?.aspect,
    ).toBe('account_path');
    expect(buildSignInToManageBookingNavigate('how_to', false)).toEqual({
      path: 'login',
      query: { reason: 'manage_booking' },
    });
    expect(
      buildSignInToManageBookingNavigate('manage_hint', false, {
        bookingId: 'b1',
        token: 'tok',
      }),
    ).toEqual({
      path: 'manage',
      query: { bookingId: 'b1', token: 'tok' },
    });
    expect(
      buildSignInToManageBookingSummary({
        aspect: 'invalid_link',
        signedIn: false,
      }),
    ).toMatch(/invalid or expired/i);
    expect(
      buildSignInToManageBookingSummary({
        aspect: 'manage_hint',
        signedIn: true,
      }),
    ).toMatch(/signed in/i);
    expect(
      buildSignInToManageBookingSummary({
        aspect: 'account_path',
        signedIn: false,
      }),
    ).toMatch(/Google, Apple, or phone/i);
    expect(
      buildSignInToManageBookingSummary({ aspect: 'all', signedIn: false }),
    ).toMatch(/valid manage link/i);
    expect(
      enrichSignInToManageBookingParamsFromPrompt(
        {},
        'Manage booking page telling me to sign in',
      ),
    ).toEqual({ aspect: 'manage_hint' });
    expect(isSignInToManageBookingPrompt('Do I need an account?')).toBe(false);
    expect(buildSignInToManageBookingNavigate('all', false)).toEqual({
      path: 'login',
      query: { reason: 'manage_booking' },
    });
  });

  it('returns null rescue when already classified correctly', () => {
    expect(
      rescueSignInToManageBookingIntent(
        'Sign in to change my appointment',
        'sign_in_to_manage_booking',
      ),
    ).toBeNull();
  });
});
