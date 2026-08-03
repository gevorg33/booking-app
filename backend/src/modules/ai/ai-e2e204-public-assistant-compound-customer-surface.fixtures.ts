/**
 * e2e-bug.204 — public_assistant_compound must be reachable on the live
 * /public/:slug/assistant path (AiGateway surface: customer), not only on
 * surfaces: ['public'].
 */

export type E2E204CompoundCase = {
  id: string;
  prompt: string;
  orderedActions: readonly string[];
  /** Previously observed single-intent steal before the surface fix. */
  formerSteal?: string;
};

export type E2E204NegativeCase = {
  id: string;
  prompt: string;
  /** Allowed single actions (compound forbidden). */
  allowActions?: readonly string[];
};

/** Registry examplePrompts + live-critical paraphrases. */
export const E2E204_COMPOUND_MUST_REACH: readonly E2E204CompoundCase[] = [
  {
    id: 'registry-list-providers-check-availability',
    prompt: 'List providers and check availability',
    orderedActions: ['list_providers', 'check_availability'],
    formerSteal: 'check_providers_for_service',
  },
  {
    id: 'registry-discover-packages-recommend',
    prompt: 'Discover packages and recommend specialists',
    orderedActions: ['discover_packages', 'recommend_specialists'],
    formerSteal: 'discover_packages',
  },
  {
    id: 'registry-book-appointment-business-info',
    prompt: 'Book appointment and show business info',
    orderedActions: ['book_appointment', 'business_info'],
    formerSteal: 'book_multi_service',
  },
  {
    id: 'registry-find-under-50-list-providers',
    prompt: 'Find services under $50 and list providers',
    orderedActions: ['find_services_under_budget', 'list_providers'],
  },
  {
    id: 'registry-list-providers-booking-help',
    prompt: 'List providers and walk me through booking',
    orderedActions: ['list_providers', 'booking_help'],
  },
  {
    id: 'paraphrase-show-then-check',
    prompt: 'Show providers and then check availability',
    orderedActions: ['list_providers', 'check_availability'],
  },
  {
    id: 'paraphrase-browse-packages-recommend',
    prompt: 'Browse packages and recommend specialists',
    orderedActions: ['discover_packages', 'recommend_specialists'],
  },
  {
    id: 'paraphrase-book-salon-info',
    prompt: 'Book an appointment and show salon info',
    orderedActions: ['book_appointment', 'business_info'],
  },
];

/** Single-intent controls — must NOT become public_assistant_compound. */
export const E2E204_NEGATIVE_MUST_STAY_SINGLE: readonly E2E204NegativeCase[] = [
  {
    id: 'neg-list-providers-alone',
    prompt: 'List providers',
    allowActions: ['list_providers'],
  },
  {
    id: 'neg-discover-packages-alone',
    prompt: 'Discover packages',
    allowActions: ['discover_packages'],
  },
  {
    id: 'neg-book-appointment-alone',
    prompt: 'Book appointment tomorrow',
  },
  {
    id: 'neg-check-availability-alone',
    prompt: 'Check availability for massage',
  },
];

export const E2E204_RECIPE_ID = 'public_assistant_compound';
export const E2E204_GOLDEN_CUSTOMER_ID = 'customer_public_assistant_compound';
export const E2E204_GOLDEN_PUBLIC_ID = 'public_public_assistant_compound';
