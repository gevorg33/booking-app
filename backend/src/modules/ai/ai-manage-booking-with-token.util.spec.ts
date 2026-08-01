import {
  E2E134_GUEST_MANAGE_LINK_CANCEL_SCENARIOS,
} from './ai-e2e134-guest-manage-link.fixtures.js';
import {
  extractManageLinkCredentialsFromPrompt,
  hasManageLinkCredentialsInPrompt,
  rescueManageBookingWithTokenIntent,
} from './ai-manage-booking-with-token.util.js';

describe('ai-manage-booking-with-token.util', () => {
  it('extracts bookingId and token from manage URLs', () => {
    expect(
      extractManageLinkCredentialsFromPrompt(
        'https://x.com/manage?bookingId=abc&token=def',
      ),
    ).toEqual({ bookingId: 'abc', manageToken: 'def' });
    expect(hasManageLinkCredentialsInPrompt('cancel my booking')).toBe(false);
  });

  it.each(E2E134_GUEST_MANAGE_LINK_CANCEL_SCENARIOS.map((s) => [s.id, s]))(
    'rescues %s to expected token action',
    (_id, row) => {
      expect(hasManageLinkCredentialsInPrompt(row.prompt)).toBe(true);
      expect(
        rescueManageBookingWithTokenIntent(row.prompt, 'unknown')?.action,
      ).toBe(row.expectedAction);
      expect(
        rescueManageBookingWithTokenIntent(row.prompt, row.expectedAction),
      ).toBeNull();
    },
  );

  it('does not rescue without embedded credentials', () => {
    expect(
      rescueManageBookingWithTokenIntent('Please cancel my booking', 'unknown'),
    ).toBeNull();
  });

  describe('e2e-bug.102 — plain labelled-text credentials (no pasted URL)', () => {
    const bookingId = '2cd62efd-f405-4b86-8f24-eef29ce900ba';
    const manageToken = 'deadbeefcafefeed1234567890abcdef';

    it('extracts bookingId + token from "the booking id is X and the token is Y" phrasing', () => {
      expect(
        extractManageLinkCredentialsFromPrompt(
          `Please cancel my booking. The booking id is ${bookingId} and the manage token is ${manageToken}`,
        ),
      ).toEqual({ bookingId, manageToken });
    });

    it('extracts from labelled-field phrasing ("bookingId: X token: Y")', () => {
      expect(
        extractManageLinkCredentialsFromPrompt(
          `Cancel my booking. bookingId: ${bookingId} token: ${manageToken}`,
        ),
      ).toEqual({ bookingId, manageToken });
    });

    it('is case-insensitive on both the label and the hex value', () => {
      expect(
        extractManageLinkCredentialsFromPrompt(
          `Cancel my booking. The Booking ID is ${bookingId.toUpperCase()} and the Token is ${manageToken.toUpperCase()}`,
        ),
      ).toEqual({
        bookingId: bookingId.toUpperCase(),
        manageToken: manageToken.toUpperCase(),
      });
    });

    it('does not require both fields — extracts whichever is present', () => {
      expect(
        extractManageLinkCredentialsFromPrompt(
          `What is this booking? The booking id is ${bookingId}`,
        ),
      ).toEqual({ bookingId });
    });

    it('does not false-positive on ordinary prompts mentioning "booking id"/"token" with no value', () => {
      expect(hasManageLinkCredentialsInPrompt('What is my booking id?')).toBe(
        false,
      );
      expect(
        hasManageLinkCredentialsInPrompt('Do you need my token to log in?'),
      ).toBe(false);
    });

    it('rescues cancel/reschedule/explain the same as a pasted URL would, using only labelled free text', () => {
      expect(
        rescueManageBookingWithTokenIntent(
          `Please cancel my booking. The booking id is ${bookingId} and the manage token is ${manageToken}`,
          'unknown',
        )?.action,
      ).toBe('cancel_booking_with_token');
      expect(
        rescueManageBookingWithTokenIntent(
          `Reschedule my booking to next Friday 2pm. The booking id is ${bookingId} and the manage token is ${manageToken}`,
          'unknown',
        )?.action,
      ).toBe('reschedule_booking_with_token');
      expect(
        rescueManageBookingWithTokenIntent(
          `What is this booking? The booking id is ${bookingId} and the manage token is ${manageToken}`,
          'unknown',
        )?.action,
      ).toBe('explain_manage_booking_context');
    });
  });

  it('rescues from session credentials without pasted manage link (e2e-bug.106)', () => {
    const session = {
      bookingId: 'book-106',
      manageToken: 'tok-106',
      bookingStep: 'manage',
    };
    expect(
      rescueManageBookingWithTokenIntent(
        'Cancel this appointment',
        'booking_help',
        session,
      )?.action,
    ).toBe('cancel_booking_with_token');
    expect(
      rescueManageBookingWithTokenIntent(
        'Reschedule to next week',
        'booking_help',
        session,
      )?.action,
    ).toBe('reschedule_booking_with_token');
    expect(
      rescueManageBookingWithTokenIntent(
        'Cancel this appointment',
        'booking_help',
        { bookingStep: 'manage' },
      ),
    ).toBeNull();
  });

  it('e2e-bug.103 rescues package visit cancel/reschedule with manage credentials', () => {
    const session = { bookingId: 'pkg-1', manageToken: 'tok-1' };
    expect(
      rescueManageBookingWithTokenIntent(
        'Cancel my package visit',
        'reschedule_package_visit_self',
        session,
      )?.action,
    ).toBe('cancel_package_visit_with_token');
    expect(
      rescueManageBookingWithTokenIntent(
        'Move my spa day to Monday 10am',
        'create_package_booking',
        session,
      )?.action,
    ).toBe('reschedule_package_visit_with_token');
  });
});
