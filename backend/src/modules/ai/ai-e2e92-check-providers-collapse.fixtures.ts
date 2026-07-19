/**
 * e2e-bug.92 — unrelated Section A prompts must not collapse into
 * check_providers_for_service (then fail asking for a service).
 */
export const E2E92_CHECK_PROVIDERS_COLLAPSE_SCENARIOS = [
  {
    id: 'e2e92-recommend-best-rated',
    prompt: 'best rated specialists for massage this week',
    surface: 'public' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'recommend_specialists',
  },
  {
    id: 'e2e92-reviews-providers',
    prompt: 'what do reviews say about your providers?',
    surface: 'public' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'list_provider_reviews',
  },
  {
    id: 'e2e92-book-haircut-3pm',
    prompt: 'can I book a haircut tomorrow at 3pm?',
    surface: 'public' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'book_appointment',
    expectServiceName: 'haircut',
  },
  {
    id: 'e2e92-mariam-available',
    prompt: 'When is Mariam available this week?',
    surface: 'public' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'explain_provider_availability',
    expectEmployeeName: 'Mariam',
  },
  {
    id: 'e2e92-any-provider-fine',
    prompt:
      "I don't care who does it, any provider works fine for the massage",
    surface: 'public' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'explain_any_provider_option',
  },
  {
    id: 'e2e92-recommend-customer',
    prompt: 'best rated specialists for massage this week',
    surface: 'customer' as const,
    misclassifiedAction: 'unknown',
    expectedAction: 'recommend_specialists',
  },
  {
    id: 'e2e92-book-customer',
    prompt: 'can I book a haircut tomorrow at 3pm?',
    surface: 'customer' as const,
    misclassifiedAction: 'unknown',
    expectedAction: 'book_appointment',
  },
] as const;
