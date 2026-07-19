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
