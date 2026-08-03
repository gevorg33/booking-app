/**
 * e2e-bug.79 — explain_subscription_vs_one_time was unreachable via the three
 * live customer phrasings (calendar / compare_services / usage_history steals).
 * e2e-bug.230 extended stealer list with confirm_my_booking_details +
 * choose_payment_method.
 */
export const E2E79_LIVE_SCENARIOS = [
  {
    id: 'e2e79-get-subscription-or-pay-per-visit',
    prompt: 'should I get the subscription or just pay per visit?',
    expectedAction: 'explain_subscription_vs_one_time' as const,
    misclassifiedActions: [
      'add_booking_to_calendar',
      'compare_services',
      'subscription_usage_history',
      'confirm_my_booking_details',
      'choose_payment_method',
      'unknown',
    ] as const,
  },
  {
    id: 'e2e79-difference-subscription-vs-one-time',
    prompt:
      'explain the difference between the subscription plan and paying one time',
    expectedAction: 'explain_subscription_vs_one_time' as const,
    misclassifiedActions: [
      'compare_services',
      'add_booking_to_calendar',
      'subscription_usage_history',
      'confirm_my_booking_details',
      'choose_payment_method',
      'unknown',
    ] as const,
  },
  {
    id: 'e2e79-monthly-plan-better-value',
    prompt:
      'is the Monthly Massage Plan subscription better value than paying per visit?',
    expectedAction: 'explain_subscription_vs_one_time' as const,
    misclassifiedActions: [
      'subscription_usage_history',
      'compare_services',
      'add_booking_to_calendar',
      'confirm_my_booking_details',
      'choose_payment_method',
      'unknown',
    ] as const,
  },
] as const;

/** Still true calendar / compare — must not regress. */
export const E2E79_NON_EXPLAIN_STILL_MATCHES = [
  {
    id: 'e2e79-still-add-to-calendar',
    prompt: 'Add my booking to Google Calendar',
    kind: 'calendar' as const,
  },
  {
    id: 'e2e79-still-compare-services',
    prompt: 'What is the difference between massage and facial?',
    kind: 'compare' as const,
  },
] as const;
