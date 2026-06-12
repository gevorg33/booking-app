/**
 * pipe-1.13.3 / acc-3.14 — structural extractors must not host paraphrase intent detectors.
 * @see docs/FAST_INTENT_HEURISTICS_BOUNDARY.md
 */
export const STRUCTURAL_EXTRACTORS_PIPE_MARKER = 'pipe-1.13.3';

export const STRUCTURAL_EXTRACTORS_RELATIVE_FILE = 'ai-structural-extractors.ts';

/** Paraphrase symbols removed from structural extractors — must not reappear here. */
export const STRUCTURAL_EXTRACTORS_FORBIDDEN_PARAPHRASE_SYMBOLS = [
  'isFirstAvailableBookingPrompt',
  'isTeamWideProviderAvailabilityQuery',
  'isAnyProviderBookingPrompt',
  'isRecommendSpecialistsPrompt',
  'isBulkAllAppointmentsPrompt',
  'enrichBookingTimeHintsFromPrompt',
  'enrichPublicAssistantParamsFromPrompt',
  'resolveBookingMetric',
  'resolveStaffMetric',
  'resolveServiceMetric',
  'resolveAppointmentMetric',
  'resolveCustomerMetric',
] as const;
