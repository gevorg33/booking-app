/**
 * e2e-bug.90 — public discovery intents crashed with a raw 500 when
 * `PUBLIC_ASSISTANT_INTENTS` was undefined (circular-import race) and
 * `validatePublicAssistantAction` called `.includes` on it.
 *
 * Confirmed crashing intents from the audit: list_services, list_providers,
 * find_services_under_budget, list_provider_reviews (+ evening/weekend + promos).
 */
export const E2E90_DISCOVERY_ACTIONS = [
  'list_services',
  'list_providers',
  'find_services_under_budget',
  'find_evening_weekend_slots',
  'list_public_promotions',
  'list_provider_reviews',
] as const;

/** Live NL prompts that must return HTTP 2xx (never raw 500 / `.includes` crash). */
export const E2E90_DISCOVERY_PROMPTS = [
  {
    id: 'e2e90-list-services',
    prompt: 'what services do you offer?',
    action: 'list_services',
  },
  {
    id: 'e2e90-list-all-services',
    prompt: 'list all services',
    action: 'list_services',
  },
  {
    id: 'e2e90-list-providers',
    prompt: 'who are your providers?',
    action: 'list_providers',
  },
  {
    id: 'e2e90-list-all-specialists',
    prompt: 'list all specialists',
    action: 'list_providers',
  },
  {
    id: 'e2e90-list-providers-short',
    prompt: 'list providers',
    action: 'list_providers',
  },
  {
    id: 'e2e90-show-team',
    prompt: 'show me your team',
    action: 'list_providers',
  },
  {
    id: 'e2e90-budget-50',
    prompt: 'show me services under $50',
    action: 'find_services_under_budget',
  },
  {
    id: 'e2e90-budget-40',
    prompt: 'services under $40',
    action: 'find_services_under_budget',
  },
  {
    id: 'e2e90-evening-weekend',
    prompt: 'which services have evening or weekend slots?',
    action: 'find_evening_weekend_slots',
  },
  {
    id: 'e2e90-promotions',
    prompt: 'any promotions right now?',
    action: 'list_public_promotions',
  },
  {
    id: 'e2e90-provider-reviews',
    prompt: 'What do reviews say about Gevorg?',
    action: 'list_provider_reviews',
  },
] as const;

/** Strings that must never appear in a successful public assistant response. */
export const E2E90_CRASH_MARKERS = [
  "Cannot read properties of undefined (reading 'includes')",
  'Cannot read properties of undefined',
  'reading \'includes\'',
  'Internal server error',
] as const;
