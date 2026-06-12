/**
 * @deprecated pipe-1.13.3 — compatibility re-exports only. Import from:
 * - `ai-structural-extractors.ts` — dates, times, entities, status
 * - `ai-booking-param-hints.util.ts` — post-classify booking param hints
 * - `ai-metric-resolvers.util.ts` — metric paraphrase (pending semantic migration)
 * - `booking-first-available.semantic.util.ts` / `team-wide-availability.semantic.util.ts` — intent meaning
 */
export * from './ai-structural-extractors.js';
export * from './ai-booking-param-hints.util.js';
export * from './ai-metric-resolvers.util.js';
export {
  isFirstAvailableBookingPrompt,
  impliesBookingFirstAvailableFromSemantic,
} from './booking-first-available.semantic.util.js';
export {
  isTeamWideProviderAvailabilityQuery,
  impliesTeamWideAvailabilityFromSemantic,
} from './team-wide-availability.semantic.util.js';
export {
  isTopStaffRevenuePrompt,
  isTotalEarningsPrompt,
} from './dashboard-revenue-analytics.util.js';
