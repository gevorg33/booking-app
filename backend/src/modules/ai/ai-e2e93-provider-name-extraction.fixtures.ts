/**
 * e2e-bug.93 — named provider reads must keep the employee name and not
 * collapse into check_providers_for_service / guest-checkout / specialty-topic
 * clarify / $0-budget / fake serviceName from "Is X available…".
 */
export const E2E93_PROVIDER_NAME_EXTRACTION_SCENARIOS = [
  {
    id: 'e2e93-mariam-available',
    prompt: 'When is Mariam available this week?',
    surface: 'public' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'explain_provider_availability',
    expectEmployeeName: 'Mariam',
  },
  {
    id: 'e2e93-karo-specialize',
    prompt: 'what does Karo specialize in?',
    surface: 'public' as const,
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_provider_specialty',
    expectProviderName: 'Karo',
    expectAspect: 'named_provider' as const,
  },
  {
    id: 'e2e93-mariam-profile',
    prompt: "tell me about Mariam's profile and experience",
    surface: 'public' as const,
    misclassifiedAction: 'explain_guest_checkout_fields',
    expectedAction: 'explain_professional_profile',
    expectProviderName: 'Mariam',
  },
  {
    id: 'e2e93-mariam-available-customer',
    prompt: 'When is Mariam available this week?',
    surface: 'customer' as const,
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_provider_availability',
    expectEmployeeName: 'Mariam',
  },
  {
    id: 'e2e93-karo-free-face-plasma',
    prompt: 'Is Karo Mazmanyan free tomorrow for Face Plasma?',
    surface: 'public' as const,
    misclassifiedAction: 'check_availability',
    expectedAction: 'explain_provider_availability',
    expectEmployeeName: 'Karo Mazmanyan',
  },
  {
    id: 'e2e93-jujo-available-no-day',
    prompt: 'When is Jujo Karapetyan available?',
    surface: 'public' as const,
    misclassifiedAction: 'check_availability',
    expectedAction: 'explain_provider_availability',
    expectEmployeeName: 'Jujo Karapetyan',
  },
  {
    id: 'e2e93-swedish-with-gevorg',
    prompt: 'check availability for Swedish massage with Gevorg tomorrow',
    surface: 'public' as const,
    // e2e-bug.190 keeps check_availability; name must still enrich.
    keepAction: 'check_availability' as const,
    expectEmployeeName: 'Gevorg',
  },
  {
    id: 'e2e93-gevorg-full-morning',
    prompt:
      'Is Gevorg Gasparyan available for Swedish massage tomorrow morning?',
    surface: 'public' as const,
    // e2e-bug.190 — "available for … massage" stays check_availability; name must enrich.
    keepAction: 'check_availability' as const,
    expectEmployeeName: 'Gevorg Gasparyan',
  },
  {
    id: 'e2e93-open-karo-profile',
    prompt: 'Open Karo Mazmanyan profile',
    surface: 'public' as const,
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_professional_profile',
    expectProviderName: 'Karo Mazmanyan',
  },
  {
    id: 'e2e93-open-gevorg-professional-profile',
    prompt: "Open Gevorg's professional profile",
    surface: 'public' as const,
    misclassifiedAction: 'explain_guest_checkout_fields',
    expectedAction: 'explain_professional_profile',
    expectProviderName: 'Gevorg',
  },
  {
    id: 'e2e93-mariam-available-tomorrow',
    prompt: 'Is Mariam Ohanyan available tomorrow?',
    surface: 'public' as const,
    misclassifiedAction: 'check_availability',
    expectedAction: 'explain_provider_availability',
    expectEmployeeName: 'Mariam Ohanyan',
  },
  {
    id: 'e2e93-whats-karo-availability',
    prompt: "What's Karo Mazmanyan's availability this week?",
    surface: 'public' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'explain_provider_availability',
    expectEmployeeName: 'Karo Mazmanyan',
  },
] as const;

/** Live / unit edge cases that assert enrichment side-effects (not only rescue). */
export const E2E93_PROVIDER_NAME_ENRICHMENT_SCENARIOS = [
  {
    id: 'e2e93-enrich-karo-not-budget-zero',
    prompt: 'Is Karo Mazmanyan free tomorrow for Face Plasma?',
    forbidMaxPrice: 0,
    expectEmployeeName: 'Karo Mazmanyan',
    expectServiceName: 'Face Plasma',
  },
  {
    id: 'e2e93-enrich-mariam-not-fake-service',
    prompt: 'Is Mariam Ohanyan available tomorrow?',
    forbidServiceNameIncludes: 'Mariam',
    expectEmployeeName: 'Mariam Ohanyan',
  },
  {
    id: 'e2e93-enrich-with-gevorg',
    prompt: 'check availability for Swedish massage with Gevorg tomorrow',
    expectEmployeeName: 'Gevorg',
  },
] as const;
