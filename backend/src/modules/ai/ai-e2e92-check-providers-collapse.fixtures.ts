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
  {
    id: 'e2e92-gevorg-abs-date',
    prompt: 'Is Gevorg available for Swedish massage on August 15, 2026?',
    surface: 'customer' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'explain_provider_availability',
    expectEmployeeName: 'Gevorg',
  },
  {
    id: 'e2e92-check-avail-with-gevorg',
    prompt: 'check availability for Swedish massage with Gevorg tomorrow',
    surface: 'customer' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'explain_provider_availability',
    expectEmployeeName: 'Gevorg',
  },
] as const;

/** Live prompts: must not land on failed "Specify which service…". */
export const E2E92_LIVE_PROMPTS = [
  {
    id: 'e2e92-live-recommend',
    prompt: 'Who do you recommend for a massage?',
    expectAction: 'recommend_specialists',
  },
  {
    id: 'e2e92-live-gevorg-week',
    prompt: 'When is Gevorg available this week?',
    expectAction: 'explain_provider_availability',
  },
  {
    id: 'e2e92-live-reviews',
    prompt: 'What do reviews say about Gevorg?',
    expectAction: 'list_provider_reviews',
  },
  {
    id: 'e2e92-live-specialty',
    prompt: "What is Gevorg's specialty?",
    expectAction: 'explain_provider_specialty',
  },
  {
    id: 'e2e92-live-who-works',
    prompt: 'who works here?',
    expectAction: 'list_providers',
  },
  {
    id: 'e2e92-live-book-swedish',
    prompt: 'Book a Swedish massage with Gevorg tomorrow at 11am',
    expectAction: 'book_appointment',
  },
  {
    id: 'e2e92-live-any-provider-fine',
    prompt:
      "I don't care who does it, any provider works fine for the massage",
    expectAction: 'explain_any_provider_option',
  },
  {
    id: 'e2e92-live-abs-date',
    prompt: 'Is Gevorg available for Swedish massage on August 15, 2026?',
    forbidAction: 'check_providers_for_service',
    forbidSummary: 'Specify which service',
  },
  {
    id: 'e2e92-live-with-gevorg',
    prompt: 'check availability for Swedish massage with Gevorg tomorrow',
    forbidAction: 'check_providers_for_service',
    forbidSummary: 'Specify which service',
  },
  {
    id: 'e2e92-live-any-provider-swedish-tomorrow',
    prompt: 'any provider is fine for Swedish massage tomorrow',
    // Soft: useful discovery OK if success; must not ask for missing service.
    forbidSummary: 'Specify which service',
  },
] as const;
