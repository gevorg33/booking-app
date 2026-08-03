/**
 * e2e-bug.189 — roster-only "who are your providers/specialists" must stay on
 * list_providers (not check_providers_for_service → "Specify which service…").
 */

export type ListProvidersPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'list_providers';
  rescueReason: 'list_providers_roster';
};

export const LIST_PROVIDERS_CLASSIFIER_RULES = `- list_providers: READ — roster of who works here (team / specialists / providers / stylists), without asking which service and without checking slots. Triggers: "Who are your providers?", "Who are your specialists?", "Who are your providers / specialists?", "who works here?", "list all specialists", "list providers", "show me your team", "what specialists do you have?". Navigate to professionals when useful. NOT check_providers_for_service / check_availability (who is free / available for a named service or day), NOT recommend_specialists (best/top/highest-rated), NOT list_provider_reviews (ratings/reviews), NOT explain_provider_specialty (named bio / who fits a topic).
- Examples:
  - "Who are your providers?" → list_providers
  - "Who are your specialists?" → list_providers
  - "list all specialists" → list_providers
  - "Who is available tomorrow for Swedish massage?" → check_providers_for_service (NOT list_providers)`;

export const LIST_PROVIDERS_PROMPTS: readonly ListProvidersPromptFixture[] = [
  {
    id: 'e2e189-who-are-your-providers',
    prompt: 'Who are your providers?',
    surface: 'public',
    expectedAction: 'list_providers',
    rescueReason: 'list_providers_roster',
  },
  {
    id: 'e2e189-who-are-your-specialists',
    prompt: 'Who are your specialists?',
    surface: 'public',
    expectedAction: 'list_providers',
    rescueReason: 'list_providers_roster',
  },
  {
    id: 'e2e189-who-are-your-providers-slash-specialists',
    prompt: 'Who are your providers / specialists?',
    surface: 'public',
    expectedAction: 'list_providers',
    rescueReason: 'list_providers_roster',
  },
  {
    id: 'e2e189-who-works-here',
    prompt: 'who works here?',
    surface: 'public',
    expectedAction: 'list_providers',
    rescueReason: 'list_providers_roster',
  },
  {
    id: 'e2e189-list-all-specialists',
    prompt: 'list all specialists',
    surface: 'public',
    expectedAction: 'list_providers',
    rescueReason: 'list_providers_roster',
  },
  {
    id: 'e2e189-list-providers',
    prompt: 'list providers',
    surface: 'public',
    expectedAction: 'list_providers',
    rescueReason: 'list_providers_roster',
  },
  {
    id: 'e2e189-show-me-your-team',
    prompt: 'show me your team',
    surface: 'public',
    expectedAction: 'list_providers',
    rescueReason: 'list_providers_roster',
  },
  {
    id: 'e2e189-what-specialists-do-you-have',
    prompt: 'what specialists do you have?',
    surface: 'public',
    expectedAction: 'list_providers',
    rescueReason: 'list_providers_roster',
  },
  {
    id: 'e2e189-who-are-your-stylists',
    prompt: 'Who are your stylists?',
    surface: 'customer',
    expectedAction: 'list_providers',
    rescueReason: 'list_providers_roster',
  },
  {
    id: 'e2e189-show-your-staff',
    prompt: 'Show your staff',
    surface: 'customer',
    expectedAction: 'list_providers',
    rescueReason: 'list_providers_roster',
  },
  {
    id: 'e2e189-list-all-providers-customer',
    prompt: 'List all providers',
    surface: 'customer',
    expectedAction: 'list_providers',
    rescueReason: 'list_providers_roster',
  },
  {
    id: 'e2e189-who-are-our-therapists',
    prompt: 'Who are our therapists?',
    surface: 'public',
    expectedAction: 'list_providers',
    rescueReason: 'list_providers_roster',
  },
] as const;

/** Misclassified → list_providers rescue cases (e2e-bug.189). */
export const LIST_PROVIDERS_RESCUE_SCENARIOS = [
  {
    id: 'e2e189-rescue-who-providers-from-check',
    prompt: 'Who are your providers?',
    surface: 'public' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'list_providers' as const,
  },
  {
    id: 'e2e189-rescue-who-specialists-from-check',
    prompt: 'Who are your specialists?',
    surface: 'public' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'list_providers' as const,
  },
  {
    id: 'e2e189-rescue-slash-from-check',
    prompt: 'Who are your providers / specialists?',
    surface: 'public' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'list_providers' as const,
  },
  {
    id: 'e2e189-rescue-list-all-specialists-from-unknown',
    prompt: 'list all specialists',
    surface: 'public' as const,
    misclassifiedAction: 'unknown',
    expectedAction: 'list_providers' as const,
  },
  {
    id: 'e2e189-rescue-who-providers-customer',
    prompt: 'Who are your providers?',
    surface: 'customer' as const,
    misclassifiedAction: 'check_providers_for_service',
    expectedAction: 'list_providers' as const,
  },
  {
    id: 'e2e189-rescue-show-team-from-unknown',
    prompt: 'show me your team',
    surface: 'customer' as const,
    misclassifiedAction: 'unknown',
    expectedAction: 'list_providers' as const,
  },
] as const;

/** Must NOT become list_providers (stay check_providers / other). */
export const LIST_PROVIDERS_NEGATIVE_PROMPTS = [
  {
    id: 'neg-who-available-massage',
    prompt: 'Who is available tomorrow for Swedish massage?',
  },
  {
    id: 'neg-check-who-free',
    prompt: 'check who is free tomorrow evening for permanent lashes',
  },
  {
    id: 'neg-recommend',
    prompt: 'Who do you recommend for a massage?',
  },
  {
    id: 'neg-reviews',
    prompt: 'What do reviews say about your providers?',
  },
  {
    id: 'neg-providers-for-service',
    prompt: 'Who are your providers for Swedish massage?',
  },
  {
    id: 'neg-book-timed',
    prompt: 'Book a Swedish massage with Gevorg tomorrow at 11am',
  },
] as const;
