/**
 * e2e-bug.234 — manage-page AI must use URL-threaded bookingId+manageToken for
 * guest cancel/reschedule (customer gateway path; e2e-bug.106 residual).
 */
export const E2E234_MANAGE_PAGE_SESSION = {
  bookingStep: 'manage',
  bookingId: 'book-234-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  manageToken: 'tok-234-manage-secret',
  pathname: '/book/demo/manage',
  slug: 'demo',
} as const;

export const E2E234_MANAGE_TOKEN_PAGE_SCENARIOS = [
  {
    id: 'e2e234-reschedule-my-booking-dated',
    prompt: 'Reschedule my booking to July 31 at 10:00',
    misclassifiedAction: 'reschedule_my_booking',
    expectedAction: 'reschedule_booking_with_token' as const,
    session: E2E234_MANAGE_PAGE_SESSION,
  },
  {
    id: 'e2e234-reschedule-with-manage-token-phrase',
    prompt:
      'Reschedule this booking with my manage token to August 3 at 15:00',
    misclassifiedAction: 'reschedule_booking_with_token',
    expectedAction: 'reschedule_booking_with_token' as const,
    session: E2E234_MANAGE_PAGE_SESSION,
    requireCredentialsInParams: true,
  },
  {
    id: 'e2e234-cancel-this-appointment',
    prompt: 'Cancel this appointment',
    misclassifiedAction: 'cancel_my_booking',
    expectedAction: 'cancel_booking_with_token' as const,
    session: E2E234_MANAGE_PAGE_SESSION,
  },
  {
    id: 'e2e234-reschedule-to-next-week-chip',
    prompt: 'Reschedule to next week',
    misclassifiedAction: 'guide_user_flow',
    expectedAction: 'reschedule_booking_with_token' as const,
    session: E2E234_MANAGE_PAGE_SESSION,
  },
  {
    id: 'e2e234-reschedule-free-typed',
    prompt: 'reschedule this booking to tomorrow at 3pm',
    misclassifiedAction: 'booking_help',
    expectedAction: 'reschedule_booking_with_token' as const,
    session: E2E234_MANAGE_PAGE_SESSION,
  },
  {
    id: 'e2e234-cancel-my-booking',
    prompt: 'Cancel my booking',
    misclassifiedAction: 'cancel_my_booking',
    expectedAction: 'cancel_booking_with_token' as const,
    session: E2E234_MANAGE_PAGE_SESSION,
  },
  {
    id: 'e2e234-no-token-no-rescue',
    prompt: 'Reschedule my booking to July 31 at 10:00',
    misclassifiedAction: 'reschedule_my_booking',
    expectedAction: null,
    session: {
      bookingStep: 'manage',
      bookingId: E2E234_MANAGE_PAGE_SESSION.bookingId,
      pathname: '/book/demo/manage',
    },
  },
] as const;

export type E2e234ManageTokenPageScenario =
  (typeof E2E234_MANAGE_TOKEN_PAGE_SCENARIOS)[number];
