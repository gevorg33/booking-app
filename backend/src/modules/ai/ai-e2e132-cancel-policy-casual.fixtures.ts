/**
 * e2e-bug.132 — casual cancel-policy phrasing must not route to
 * explain_package_savings ("deal" ≠ package deal).
 */
export const E2E132_CANCEL_POLICY_CASUAL_SCENARIOS = [
  {
    id: 'whats-the-deal-if-i-cancel',
    prompt: 'whats the deal if i cancel',
    expectedAction: 'explain_cancel_policy' as const,
    misclassifiedAction: 'explain_package_savings' as const,
    surface: 'public' as const,
  },
  {
    id: 'whats-the-deal-if-i-cancel-customer',
    prompt: "what's the deal if i cancel",
    expectedAction: 'explain_cancel_policy' as const,
    misclassifiedAction: 'explain_package_savings' as const,
    surface: 'customer' as const,
  },
  {
    id: 'what-happens-if-i-cancel',
    prompt: 'What happens if I cancel?',
    expectedAction: 'explain_cancel_policy' as const,
    misclassifiedAction: 'unknown' as const,
    surface: 'public' as const,
  },
  {
    id: 'formal-still-works',
    prompt: 'Could you please explain your cancellation policy?',
    expectedAction: 'explain_cancel_policy' as const,
    misclassifiedAction: 'explain_package_savings' as const,
    surface: 'public' as const,
  },
  {
    id: 'typo-cancelation-rulz',
    prompt: 'wut r ur cancelation rulz',
    expectedAction: 'explain_cancel_policy' as const,
    misclassifiedAction: 'unknown' as const,
    surface: 'public' as const,
  },
] as const;

export const E2E132_PACKAGE_SAVINGS_STILL_MATCH = [
  {
    id: 'bundle-deal',
    prompt: 'What is the deal on the deluxe bundle?',
  },
  {
    id: 'spa-package-worth',
    prompt: 'Is the spa day package worth buying vs separate services?',
  },
] as const;
