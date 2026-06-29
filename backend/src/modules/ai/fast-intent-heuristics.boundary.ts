/**
 * pipe-1.2.3 / acc-3.14 — single source of truth for the fast-heuristics boundary gate.
 * @see docs/FAST_INTENT_HEURISTICS_BOUNDARY.md
 */
export const FAST_INTENT_HEURISTICS_BOUNDARY_DOC =
  'docs/FAST_INTENT_HEURISTICS_BOUNDARY.md';

/** Required in every gated production file (proves authors read the boundary). */
export const FAST_HEURISTIC_BOUNDARY_MARKER = 'pipe-1.2.3';

/** Production files subject to the acc-3.14 guard (no new paraphrase regex). */
export const FAST_HEURISTIC_BOUNDARY_RELATIVE_FILES = [
  'fast-intent-heuristics.service.ts',
  'fast-intent-heuristics.util.ts',
] as const;

/** Delegation imports allowed in fast-heuristics modules (routing + structural only). */
export const FAST_HEURISTIC_ALLOWED_IMPORT_MODULES = [
  'command-complexity-router.service',
  'intent-decomposition.service',
  'ai-intent-disambiguation.util',
  'ai-dashboard-ops.util',
  'ai-product-guide.util',
  'command-understanding.types',
  'fast-intent-heuristics.util',
  'fast-intent-heuristics.boundary',
  'ai-command-registry.types',
] as const;

/** Must not appear in fast-heuristics production files — paraphrase / rescue / semantic layers. */
export const FAST_HEURISTIC_FORBIDDEN_IMPORT_SUBSTRINGS = [
  'ai-intent-heuristics',
  'ai-intent-rescue',
  'ai-semantic-intent',
  'ai-intent-rescue.service',
  'dashboard-revenue-analytics.util',
  'ai-operations.util',
  'ai-scheduling.util',
] as const;

/**
 * acc-3.14 paraphrase-sensitive detectors — never call or import from fast heuristics.
 * Migrate meaning to semantic anchors; keep structural flags in post-classify enrich only.
 */
export const FAST_HEURISTIC_FORBIDDEN_PARAPHRASE_SYMBOLS = [
  'isFirstAvailableBookingPrompt',
  'isBookNearestSlotPrompt',
  'isTeamWideProviderAvailabilityQuery',
  'isCheckProvidersForServicePrompt',
  'isAnyProviderBookingPrompt',
  'isCapacityRebalancePrompt',
  'isTotalEarningsPrompt',
  'isTopStaffRevenuePrompt',
  'isRevenueForecastPrompt',
  'rescuePaymentsIntent',
  'rescueSchedulingIntent',
  'rescueOperationsIntent',
] as const;
