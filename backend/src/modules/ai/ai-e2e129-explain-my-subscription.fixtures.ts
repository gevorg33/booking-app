/**
 * e2e-bug.129 — explain_my_subscription must win over dashboard billing /
 * AI-quota hallucinations that security_block on customer/public.
 */
export const E2E129_EXPLAIN_MY_SUBSCRIPTION_SCENARIOS = [
  {
    id: 'visits-left-plan',
    prompt: 'How many visits left on my plan?',
    expectedAction: 'explain_my_subscription' as const,
    misclassifiedActions: [
      'summarize_my_appointments',
      'open_billing_settings',
      'explain_ai_capabilities',
      'unknown',
      'my_subscriptions',
    ] as const,
    surface: 'customer' as const,
  },
  {
    id: 'visits-left-plan-public',
    prompt: 'How many visits left on my plan?',
    expectedAction: 'explain_my_subscription' as const,
    misclassifiedActions: [
      'open_billing_settings',
      'summarize_my_appointments',
      'unknown',
    ] as const,
    surface: 'public' as const,
  },
  {
    id: 'whats-on-subscription',
    prompt: "What's on my subscription?",
    expectedAction: 'explain_my_subscription' as const,
    misclassifiedActions: ['open_billing_settings', 'unknown'] as const,
    surface: 'customer' as const,
  },
  {
    id: 'credits-left-membership',
    prompt: 'How many credits are left on my plan?',
    expectedAction: 'explain_my_subscription' as const,
    misclassifiedActions: [
      'explain_ai_capabilities',
      'open_billing_settings',
    ] as const,
    surface: 'customer' as const,
  },
] as const;

/** Dashboard billing must still match real SaaS portal phrasing. */
export const E2E129_BILLING_STILL_MATCH = [
  {
    id: 'open-billing-settings',
    prompt: 'Open billing settings',
  },
  {
    id: 'what-plan-am-i-on',
    prompt: 'What plan am I on',
  },
  {
    id: 'manage-subscription-portal',
    prompt: 'Manage subscription and billing portal',
  },
] as const;
