/**
 * e2e-bug.93 — named provider reads must keep the employee name and not
 * collapse into check_providers_for_service / guest-checkout / specialty-topic clarify.
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
] as const;
