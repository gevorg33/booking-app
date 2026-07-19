/**
 * e2e-bug.103 — package-visit guest-token cancel/reschedule must be reachable
 * via NL (manage URL or session credentials), not guest_manage_visit /
 * package_visit_self / create_package_booking.
 */
export const E2E103_PACKAGE_VISIT_WITH_TOKEN_SCENARIOS = [
  {
    id: 'e2e103-cancel-package-visit-manage-url',
    prompt:
      'Cancel my package visit https://example.com/manage?bookingId=da94-4537-9c93-4cc8-b913-dbeda160dc2a&token=tok-pkg-103',
    misclassifiedAction: 'create_package_booking',
    expectedAction: 'cancel_package_visit_with_token' as const,
    bookingId: 'da94-4537-9c93-4cc8-b913-dbeda160dc2a',
    manageToken: 'tok-pkg-103',
  },
  {
    id: 'e2e103-reschedule-package-visit-manage-url',
    prompt:
      'Reschedule my package visit to Monday 10am https://example.com/manage?bookingId=pkg-book-103&token=tok-resched-103',
    misclassifiedAction: 'reschedule_package_visit_self',
    expectedAction: 'reschedule_package_visit_with_token' as const,
    bookingId: 'pkg-book-103',
    manageToken: 'tok-resched-103',
  },
  {
    id: 'e2e103-cancel-spa-day-manage-url',
    prompt:
      'Cancel my spa day https://book.test/manage?bookingId=spa-103&token=tok-spa-103',
    misclassifiedAction: 'cancel_package_visit_self',
    expectedAction: 'cancel_package_visit_with_token' as const,
    bookingId: 'spa-103',
    manageToken: 'tok-spa-103',
  },
  {
    id: 'e2e103-reschedule-spa-day-session',
    prompt: 'Move my spa day to Tuesday 2pm',
    misclassifiedAction: 'reschedule_package_visit_self',
    expectedAction: 'reschedule_package_visit_with_token' as const,
    session: {
      bookingId: 'spa-session-103',
      manageToken: 'tok-session-103',
      bookingStep: 'manage',
    },
  },
  {
    id: 'e2e103-cancel-my-package-session',
    prompt: 'Cancel my package',
    misclassifiedAction: 'create_package_booking',
    expectedAction: 'cancel_package_visit_with_token' as const,
    session: {
      bookingId: 'pkg-session-103',
      manageToken: 'tok-pkg-session-103',
    },
  },
] as const;

export const E2E102_PHONE_FALSE_POSITIVE_PROMPTS = [
  {
    id: 'e2e102-uuid-in-manage-url',
    prompt:
      'Reschedule my package visit https://example.com/manage?bookingId=da94-4537-9c93-4cc8-b913-dbeda160dc2a&token=tok-x',
  },
  {
    id: 'e2e102-bare-uuid-in-prompt',
    prompt:
      'Cancel my package visit bookingId da94-4537-9c93-4cc8-b913-dbeda160dc2a',
  },
] as const;

export type E2e103PackageVisitWithTokenScenario =
  (typeof E2E103_PACKAGE_VISIT_WITH_TOKEN_SCENARIOS)[number];
