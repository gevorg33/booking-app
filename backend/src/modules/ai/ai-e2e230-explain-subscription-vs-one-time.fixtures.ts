/**
 * e2e-bug.230 — e2e-bug.79 residual: live public/customer paths still routed
 * "should I get the subscription or just pay per visit?" to
 * confirm_my_booking_details (and paraphrases to choose_payment_method).
 */
export const E2E230_LIVE_SCENARIOS = [
  {
    id: 'e2e230-get-subscription-or-pay-per-visit',
    prompt: 'should I get the subscription or just pay per visit?',
    expectedAction: 'explain_subscription_vs_one_time' as const,
    misclassifiedActions: [
      'confirm_my_booking_details',
      'choose_payment_method',
      'add_booking_to_calendar',
      'compare_services',
      'subscription_usage_history',
      'unknown',
    ] as const,
  },
  {
    id: 'e2e230-subscription-or-pay-per-visit-better',
    prompt: 'subscription or pay per visit which is better?',
    expectedAction: 'explain_subscription_vs_one_time' as const,
    misclassifiedActions: [
      'choose_payment_method',
      'confirm_my_booking_details',
      'unknown',
    ] as const,
  },
  {
    id: 'e2e230-difference-subscription-vs-one-time',
    prompt:
      'explain the difference between the subscription plan and paying one time',
    expectedAction: 'explain_subscription_vs_one_time' as const,
    misclassifiedActions: [
      'confirm_my_booking_details',
      'compare_services',
      'choose_payment_method',
      'unknown',
    ] as const,
  },
  {
    id: 'e2e230-monthly-plan-better-value',
    prompt:
      'is the Monthly Massage Plan subscription better value than paying per visit?',
    expectedAction: 'explain_subscription_vs_one_time' as const,
    misclassifiedActions: [
      'confirm_my_booking_details',
      'choose_payment_method',
      'unknown',
    ] as const,
  },
  {
    id: 'e2e230-should-i-subscribe-or-pay-once',
    prompt: 'Should I subscribe or just pay once per visit?',
    expectedAction: 'explain_subscription_vs_one_time' as const,
    misclassifiedActions: [
      'confirm_my_booking_details',
      'choose_payment_method',
      'unknown',
    ] as const,
  },
  {
    id: 'e2e230-membership-vs-one-time',
    prompt: 'Is membership better than paying one time?',
    expectedAction: 'explain_subscription_vs_one_time' as const,
    misclassifiedActions: [
      'confirm_my_booking_details',
      'choose_payment_method',
      'unknown',
    ] as const,
  },
] as const;

/** Still true booking-details / payment-options reads — must not regress. */
export const E2E230_NON_EXPLAIN_STILL_MATCHES = [
  {
    id: 'e2e230-still-confirm-time',
    prompt: 'What time is my appointment?',
    kind: 'confirm' as const,
  },
  {
    id: 'e2e230-still-just-booked',
    prompt: 'What did I just book?',
    kind: 'confirm' as const,
  },
  {
    id: 'e2e230-still-payment-options',
    prompt: 'Which payment methods can I use at checkout?',
    kind: 'payment_options' as const,
  },
] as const;
