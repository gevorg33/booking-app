/**
 * e2e-bug.106 — public manage/checkout/multi pages must thread URL context so
 * guest-token cancel/reschedule and checkout amount/cash prompts do not fall
 * through to the generic booking_help funnel.
 */
export const E2E106_PUBLIC_PAGE_CONTEXT_SCENARIOS = [
  {
    id: 'e2e-bug-106-manage-cancel-this-appointment',
    prompt: 'Cancel this appointment',
    misclassifiedAction: 'booking_help',
    expectedAction: 'cancel_booking_with_token',
    session: {
      bookingStep: 'manage',
      bookingId: 'book-106',
      manageToken: 'tok-106',
      pathname: '/book/demo/manage',
    },
  },
  {
    id: 'e2e-bug-106-manage-reschedule-next-week',
    prompt: 'Reschedule to next week',
    misclassifiedAction: 'booking_help',
    expectedAction: 'reschedule_booking_with_token',
    session: {
      bookingStep: 'manage',
      bookingId: 'book-106',
      manageToken: 'tok-106',
      pathname: '/book/demo/manage',
    },
  },
  {
    id: 'e2e-bug-106-manage-reschedule-free-typed',
    prompt: 'reschedule this booking to tomorrow at 3pm',
    misclassifiedAction: 'booking_help',
    expectedAction: 'reschedule_booking_with_token',
    session: {
      bookingStep: 'manage',
      bookingId: 'book-106',
      manageToken: 'tok-106',
      pathname: '/book/demo/manage',
    },
  },
  {
    id: 'e2e-bug-106-manage-no-credentials-no-rescue',
    prompt: 'Cancel this appointment',
    misclassifiedAction: 'booking_help',
    expectedAction: null,
    session: {
      bookingStep: 'manage',
      pathname: '/book/demo/manage',
    },
  },
] as const;

export type E2e106PublicPageContextScenario =
  (typeof E2E106_PUBLIC_PAGE_CONTEXT_SCENARIOS)[number];
