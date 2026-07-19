/**
 * e2e-bug.90 — public discovery intents crashed with a raw 500 when
 * `PUBLIC_ASSISTANT_INTENTS` was undefined (circular-import race) and
 * `validatePublicAssistantAction` called `.includes` on it.
 */
export const E2E90_DISCOVERY_ACTIONS = [
  'list_services',
  'list_providers',
  'find_services_under_budget',
  'find_evening_weekend_slots',
  'list_public_promotions',
] as const;

export const E2E90_DISCOVERY_PROMPTS = [
  {
    id: 'e2e90-list-services',
    prompt: 'what services do you offer?',
    action: 'list_services',
  },
  {
    id: 'e2e90-list-providers',
    prompt: 'who are your providers?',
    action: 'list_providers',
  },
  {
    id: 'e2e90-budget',
    prompt: "show me services under $50",
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
] as const;
