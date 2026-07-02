import {
  EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS,
  EXPLAIN_MANAGE_BOOKING_PAGE_RESCUE_SCENARIOS,
} from './ai-explain-manage-booking-page.fixtures.js';
import { EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_SCENARIOS } from './ai-explain-manage-booking-page-multilingual.fixtures.js';
import {
  buildExplainManageBookingPageNavigate,
  buildExplainManageBookingPageSummary,
  enrichExplainManageBookingPageParamsFromPrompt,
  inferManageBookingPageAspect,
  isExplainManageBookingPageIntent,
  isExplainManageBookingPagePrompt,
  parseExplainManageBookingPageFromPrompt,
  rescueExplainManageBookingPageIntent,
} from './ai-explain-manage-booking-page.util.js';
import { isSignInToManageBookingPrompt } from './ai-sign-in-to-manage-booking.util.js';
import { isRecoverLostManageLinkPrompt } from './ai-recover-lost-manage-link.util.js';

describe('ai-explain-manage-booking-page.util (ai-cmd-customer-4.20.7)', () => {
  it.each(EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS)(
    'detects prompt $id',
    ({ prompt, aspect }) => {
      expect(isExplainManageBookingPagePrompt(prompt)).toBe(true);
      expect(parseExplainManageBookingPageFromPrompt(prompt)).toMatchObject({
        aspect,
      });
    },
  );

  it.each(EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isExplainManageBookingPagePrompt(prompt)).toBe(true);
    },
  );

  it.each(EXPLAIN_MANAGE_BOOKING_PAGE_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainManageBookingPageIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'manage_booking_page',
      });
    },
  );

  it('does not steal sign-in-focused or recover-link prompts', () => {
    expect(
      isExplainManageBookingPagePrompt('Sign in to change my appointment'),
    ).toBe(false);
    expect(
      isSignInToManageBookingPrompt('Sign in to change my appointment'),
    ).toBe(true);
    expect(
      isExplainManageBookingPagePrompt(
        'My manage link is invalid — should I sign in?',
      ),
    ).toBe(false);
    expect(
      isSignInToManageBookingPrompt(
        'My manage link is invalid — should I sign in?',
      ),
    ).toBe(true);
    expect(
      isExplainManageBookingPagePrompt(
        'Resend manage link to john@example.com',
      ),
    ).toBe(false);
    expect(
      isRecoverLostManageLinkPrompt('Resend manage link to john@example.com'),
    ).toBe(true);
  });

  it('plain invalid manage link is explain, not sign-in', () => {
    expect(isExplainManageBookingPagePrompt('Invalid manage link')).toBe(true);
    expect(isSignInToManageBookingPrompt('Invalid manage link')).toBe(false);
  });

  it('returns null rescue when already classified correctly', () => {
    expect(
      rescueExplainManageBookingPageIntent(
        'What can I do on this manage page?',
        'explain_manage_booking_page',
      ),
    ).toBeNull();
  });

  it('recognizes explain_manage_booking_page intent', () => {
    expect(
      isExplainManageBookingPageIntent('explain_manage_booking_page'),
    ).toBe(true);
    expect(isExplainManageBookingPageIntent('sign_in_to_manage_booking')).toBe(
      false,
    );
  });

  it('builds navigate and summaries by aspect', () => {
    expect(inferManageBookingPageAspect('Invalid manage link')).toBe(
      'invalid_link',
    );
    expect(
      inferManageBookingPageAspect('How does package visit manage work?'),
    ).toBe('package_visit');
    expect(
      buildExplainManageBookingPageSummary({
        aspect: 'invalid_link',
        signedIn: false,
      }),
    ).toMatch(/invalid manage link/i);
    expect(
      buildExplainManageBookingPageSummary({
        aspect: 'package_visit',
        signedIn: false,
      }),
    ).toMatch(/package visits/i);
    expect(
      buildExplainManageBookingPageSummary({
        aspect: 'guest_token',
        signedIn: false,
      }),
    ).toMatch(/confirmation email/i);
    expect(buildExplainManageBookingPageNavigate('invalid_link', {})).toEqual({
      path: 'login',
      query: { reason: 'manage_booking' },
    });
    expect(
      buildExplainManageBookingPageNavigate('capabilities', {
        bookingId: 'b1',
        token: 'tok',
      }),
    ).toEqual({
      path: 'manage',
      query: { bookingId: 'b1', token: 'tok' },
    });
    expect(
      buildExplainManageBookingPageSummary({
        aspect: 'capabilities',
        signedIn: true,
      }),
    ).toMatch(/My appointments/i);
  });

  it('rejects direct cancel/reschedule without explain framing', () => {
    expect(isExplainManageBookingPagePrompt('Cancel my booking')).toBe(false);
    expect(
      isExplainManageBookingPagePrompt(
        'Can I cancel or reschedule on the manage page?',
      ),
    ).toBe(true);
  });

  it('enriches params from prompt aspect', () => {
    expect(
      parseExplainManageBookingPageFromPrompt('Invalid manage link', {
        aspect: 'all',
      })?.aspect,
    ).toBe('all');
    expect(
      enrichExplainManageBookingPageParamsFromPrompt({}, 'Invalid manage link'),
    ).toEqual({ aspect: 'invalid_link' });
  });

  it('infers aspects from heuristic cues', () => {
    expect(
      inferManageBookingPageAspect(
        'Guest manage token from confirmation email',
      ),
    ).toBe('guest_token');
    expect(
      inferManageBookingPageAspect('What actions can I take on manage?'),
    ).toBe('capabilities');
    expect(
      inferManageBookingPageAspect('Help overview of manage booking'),
    ).toBe('all');
  });

  it('rejects invalid manage link when user asks about sign-in', () => {
    expect(
      isExplainManageBookingPagePrompt(
        'Invalid manage link — should I sign in?',
      ),
    ).toBe(false);
  });

  it('handles edge cases and default summary branches', () => {
    expect(isExplainManageBookingPagePrompt('')).toBe(false);
    expect(
      isExplainManageBookingPagePrompt('Sign in to manage my booking now'),
    ).toBe(false);
    expect(
      buildExplainManageBookingPageSummary({ aspect: 'all', signedIn: false }),
    ).toMatch(/package visits/i);
    expect(
      buildExplainManageBookingPageNavigate('capabilities', {}),
    ).toBeUndefined();
    expect(
      enrichExplainManageBookingPageParamsFromPrompt(
        {},
        'What is the weather?',
      ),
    ).toEqual({});
  });
});
