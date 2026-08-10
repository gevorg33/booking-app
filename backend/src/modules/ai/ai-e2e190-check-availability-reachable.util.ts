/**
 * e2e-bug.190 — `check_availability` must remain reachable on the customer
 * gateway that backs `/public/:slug/assistant` (PUBLIC_ONLY delegation).
 */

export const E2E190_CHECK_AVAILABILITY_PROMPTS = [
  {
    id: 'e2e190-check-availability-phrase',
    prompt: 'check availability for Swedish massage tomorrow',
    surface: 'customer' as const,
    classifiedAction: 'check_availability',
    expectedAction: 'check_availability',
  },
  {
    id: 'e2e190-what-times-available',
    prompt: 'What times are available for Swedish massage tomorrow?',
    surface: 'customer' as const,
    classifiedAction: 'check_availability',
    expectedAction: 'check_availability',
  },
  {
    id: 'e2e190-named-gevorg',
    prompt: 'Is Gevorg available for Swedish massage next Tuesday?',
    surface: 'customer' as const,
    classifiedAction: 'check_availability',
    expectedAction: 'check_availability',
  },
  {
    id: 'e2e190-open-slots-service',
    prompt: 'Open slots for a haircut on Friday',
    surface: 'customer' as const,
    classifiedAction: 'check_availability',
    expectedAction: 'check_availability',
  },
] as const;

/** Team-wide prompts may still use customer-native check_providers_for_service. */
export const E2E190_TEAM_WIDE_STAYS_PROVIDERS = [
  {
    id: 'e2e190-who-is-free',
    prompt: 'Who is free tomorrow evening for massage?',
    classifiedAction: 'check_providers_for_service',
    expectedAction: 'check_providers_for_service',
  },
  {
    id: 'e2e190-any-slots-classified-providers',
    prompt: 'Any slots for massage tomorrow?',
    classifiedAction: 'check_providers_for_service',
    expectedAction: 'check_providers_for_service',
  },
] as const;

/**
 * e2e-bug.190 — never hard-remap check_availability → check_providers_for_service.
 * Public-only handler owns the label on the live assistant gateway.
 */
export function resolveCustomerAvailabilityActionLabel(action: string): string {
  return action;
}

/** Prefer deterministic public execution so a second chat classify cannot steal the label. */
export function shouldExecuteCheckAvailabilityDeterministically(
  action: string,
): boolean {
  return action === 'check_availability';
}
