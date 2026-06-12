import {
  CUSTOMER_INTENTS,
  DASHBOARD_INTENTS,
  PROVIDER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import { getCompoundRecipesForSurface } from './ai-command-registry.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { IntentCandidate } from './command-understanding.types.js';
import { DEFAULT_RERANK_RUNNER_UP_MARGIN } from './intent-candidate-rerank.util.js';

/** pipe-1.4.7 / acc-3.3 — dynamic intent shortlist before narrow LLM re-classify. */
export const NARROW_INTENT_SHORTLIST_PIPE_MARKER = 'pipe-1.4.7';

/** Max intents offered to the narrow classifier (acc-3.3). */
export const NARROW_INTENT_SHORTLIST_MAX = 10;

/** Re-export rerank ambiguity margin used to trigger narrow re-classify. */
export const NARROW_RECLASSIFY_MARGIN = DEFAULT_RERANK_RUNNER_UP_MARGIN;

const SURFACE_INTENT_LISTS: Record<CommandSurface, readonly string[]> = {
  dashboard: DASHBOARD_INTENTS,
  provider: PROVIDER_INTENTS,
  customer: CUSTOMER_INTENTS,
  public: PUBLIC_INTENTS,
};

/**
 * Commonly confused intents — seeded from availability disambiguation matrix.
 * Only neighbors valid on the surface are kept.
 */
const AMBIGUOUS_INTENT_NEIGHBORS: Record<string, readonly string[]> = {
  create_booking: [
    'check_providers_for_service',
    'check_availability',
    'book_nearest_slot',
    'lookup_service_assignment',
    'show_appointments',
    'reschedule_booking',
  ],
  book_nearest_slot: [
    'create_booking',
    'check_providers_for_service',
    'check_availability',
  ],
  book_appointment: ['check_availability', 'list_providers', 'list_services'],
  check_providers_for_service: [
    'create_booking',
    'book_nearest_slot',
    'check_availability',
    'lookup_service_assignment',
    'show_appointments',
  ],
  check_availability: [
    'create_booking',
    'book_nearest_slot',
    'check_providers_for_service',
    'lookup_service_assignment',
    'show_appointments',
    'book_appointment',
    'list_providers',
  ],
  lookup_service_assignment: [
    'check_providers_for_service',
    'check_availability',
    'list_employees',
    'show_appointments',
  ],
  show_appointments: [
    'list_bookings',
    'check_availability',
    'summarize_bookings',
    'create_booking',
  ],
  list_bookings: ['show_appointments', 'summarize_bookings', 'cancel_bookings'],
  create_direct_schedule: [
    'apply_schedule',
    'clear_schedule',
    'fill_unused_slots',
    'list_schedule_gaps',
    'setup_week_schedule',
  ],
  apply_schedule: [
    'create_direct_schedule',
    'fill_unused_slots',
    'list_schedule_gaps',
    'setup_week_schedule',
  ],
  clear_schedule: ['create_direct_schedule', 'hide_appointments_from_calendar'],
  fill_unused_slots: [
    'create_direct_schedule',
    'list_schedule_gaps',
    'apply_schedule',
  ],
  list_schedule_gaps: [
    'fill_unused_slots',
    'summarize_utilization',
    'create_direct_schedule',
  ],
  summarize_bookings: [
    'show_appointments',
    'list_bookings',
    'analyze_appointments',
  ],
  reschedule_booking: ['create_booking', 'cancel_bookings', 'check_availability'],
};

function surfaceIntentSet(surface: CommandSurface): Set<string> {
  return new Set(
    SURFACE_INTENT_LISTS[surface].filter((intent) => intent !== 'unknown'),
  );
}

/** Skip compound recipes that allow the entire surface (would flood the shortlist). */
const MAX_COMPOUND_RECIPE_STEPS = 15;

function expandFromCompoundRecipes(
  seedActions: readonly string[],
  surface: CommandSurface,
  surfaceAllowed: Set<string>,
  push: (action: string) => void,
): void {
  for (const recipe of getCompoundRecipesForSurface(surface)) {
    if (recipe.allowedStepIntentIds.length > MAX_COMPOUND_RECIPE_STEPS) {
      continue;
    }
    const touchesRecipe = seedActions.some((action) =>
      recipe.allowedStepIntentIds.includes(action),
    );
    if (!touchesRecipe) continue;
    for (const step of recipe.allowedStepIntentIds) {
      push(step);
    }
  }
}

function neighborActionsFor(
  action: string,
  surfaceAllowed: Set<string>,
): string[] {
  const neighbors = AMBIGUOUS_INTENT_NEIGHBORS[action] ?? [];
  return neighbors.filter((neighbor) => surfaceAllowed.has(neighbor));
}

/**
 * Build a surface-valid intent shortlist (≤10) from ambiguous rerank candidates.
 * Seeds from ranked top actions, expands confused neighbors + compound recipe steps.
 */
export function buildNarrowIntentShortlist(
  ranked: IntentCandidate[],
  surface: CommandSurface,
  options?: { max?: number },
): string[] {
  const max = options?.max ?? NARROW_INTENT_SHORTLIST_MAX;
  const surfaceAllowed = surfaceIntentSet(surface);
  if (!ranked.length || max <= 0) return [];

  const ordered: string[] = [];
  const seen = new Set<string>();

  const pushRanked = (action: string): void => {
    if (seen.has(action)) return;
    seen.add(action);
    ordered.push(action);
  };

  const pushExpanded = (action: string): void => {
    if (!surfaceAllowed.has(action) || seen.has(action)) return;
    seen.add(action);
    ordered.push(action);
  };

  const uniqueRanked = ranked.filter(
    (candidate, index, list) =>
      list.findIndex((entry) => entry.action === candidate.action) === index,
  );

  for (const candidate of uniqueRanked) {
    pushRanked(candidate.action);
    if (ordered.length >= max) return ordered.slice(0, max);
  }

  const seedForExpansion = uniqueRanked.slice(0, 2).map((c) => c.action);
  for (const action of seedForExpansion) {
    for (const neighbor of neighborActionsFor(action, surfaceAllowed)) {
      pushExpanded(neighbor);
      if (ordered.length >= max) return ordered.slice(0, max);
    }
  }

  expandFromCompoundRecipes(seedForExpansion, surface, surfaceAllowed, (action) => {
    pushExpanded(action);
    if (ordered.length >= max) return;
  });

  return ordered.slice(0, max);
}

/** Surface intents available for narrow shortlist (excludes unknown). */
export function resolveNarrowShortlistSurfaceIntents(
  surface: CommandSurface,
): string[] {
  return [...surfaceIntentSet(surface)].sort();
}
