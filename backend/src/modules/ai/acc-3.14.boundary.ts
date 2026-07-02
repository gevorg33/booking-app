/**
 * acc-3.14 — booking param hints + metric resolvers must delegate paraphrase meaning to semantic utils.
 * @see docs/FAST_INTENT_HEURISTICS_BOUNDARY.md
 */
export const ACC_3_14_PIPE_MARKER = 'acc-3.14';

export const BOOKING_PARAM_HINTS_RELATIVE_FILE =
  'ai-booking-param-hints.util.ts';
export const METRIC_RESOLVERS_RELATIVE_FILE = 'ai-metric-resolvers.util.ts';

/** Paraphrase detectors — must live in *.semantic.util.ts, not param-hints / metric resolvers. */
export const ACC_3_14_FORBIDDEN_LOCAL_PARAPHRASE_SYMBOLS = [
  'isAnyProviderBookingPrompt',
  'isRecommendSpecialistsPrompt',
  'resolveBookingMetricFromSemantic',
  'resolveStaffMetricFromSemantic',
  'resolveServiceMetricFromSemantic',
  'resolveCustomerMetricFromSemantic',
  'resolveAppointmentMetricFromSemantic',
] as const;

/** Legacy regex metric paraphrase patterns — must not reappear in metric resolvers. */
export const ACC_3_14_FORBIDDEN_METRIC_REGEX_PATTERNS = [
  /\\bhow\\s+many\\b/i,
  /\\btotal\\s+earnings\\b/i,
  /\\bno[-\\s]?shows?\\b/i,
  /\\btop\\s+\\d+\\s+specialists\\s+by\\s+revenue\\b/i,
] as const;
