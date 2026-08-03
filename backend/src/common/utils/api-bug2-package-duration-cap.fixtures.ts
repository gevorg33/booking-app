/**
 * api-bug.2 / e2e-bug.107 — curated packages skip multi-service maxDurationMinutes;
 * ad-hoc multi-service carts still enforce the cap.
 */
export const API_BUG2_DURATION_CAP_SCENARIOS = [
  {
    id: 'api2-adhoc-over-cap-rejected',
    serviceDurations: [60, 90, 60],
    turnoverBufferMinutes: 5,
    maxDurationMinutes: 180,
    skipDurationCap: false,
    expectValid: false,
    expectErrorIncludes: 'exceeds the 180 minute limit',
  },
  {
    id: 'api2-adhoc-under-cap-allowed',
    serviceDurations: [60, 90],
    turnoverBufferMinutes: 5,
    maxDurationMinutes: 180,
    skipDurationCap: false,
    expectValid: true,
    expectErrorIncludes: null,
  },
  {
    id: 'api2-package-over-cap-skipped',
    serviceDurations: [60, 90, 60, 75, 30],
    turnoverBufferMinutes: 5,
    maxDurationMinutes: 180,
    skipDurationCap: true,
    expectValid: true,
    expectErrorIncludes: null,
  },
  {
    id: 'api2-package-exact-cap-boundary',
    serviceDurations: [90, 85],
    turnoverBufferMinutes: 5,
    maxDurationMinutes: 180,
    skipDurationCap: false,
    expectValid: true,
    expectErrorIncludes: null,
  },
  {
    id: 'api2-adhoc-one-minute-over-rejected',
    serviceDurations: [90, 86],
    turnoverBufferMinutes: 5,
    maxDurationMinutes: 180,
    skipDurationCap: false,
    expectValid: false,
    expectErrorIncludes: 'exceeds the 180 minute limit',
  },
  {
    id: 'api2-skip-cap-even-when-far-over',
    serviceDurations: [120, 120, 120],
    turnoverBufferMinutes: 10,
    maxDurationMinutes: 60,
    skipDurationCap: true,
    expectValid: true,
    expectErrorIncludes: null,
  },
] as const;

export type ApiBug2DurationCapScenario =
  (typeof API_BUG2_DURATION_CAP_SCENARIOS)[number];

/** Live QA matrix for public package vs ad-hoc multi-service duration parity. */
export const API_BUG2_LIVE_SCENARIOS = [
  {
    id: 'api2-live-pkg-suggest-block',
    kind: 'package' as const,
    path: 'suggest-block',
    expectOk: true,
    forbidDurationError: true,
  },
  {
    id: 'api2-live-pkg-bookable-dates',
    kind: 'package' as const,
    path: 'bookable-dates',
    expectOk: true,
    forbidDurationError: true,
  },
  {
    id: 'api2-live-pkg-block-slots',
    kind: 'package' as const,
    path: 'block-slots',
    expectOk: true,
    forbidDurationError: true,
  },
  {
    id: 'api2-live-pkg-suggest-slots',
    kind: 'package' as const,
    path: 'suggest-slots',
    expectOk: true,
    forbidDurationError: true,
  },
  {
    id: 'api2-live-pkg-providers',
    kind: 'package' as const,
    path: 'providers',
    expectOk: true,
    forbidDurationError: true,
  },
  {
    id: 'api2-live-pkg-quote',
    kind: 'package' as const,
    path: 'quote',
    expectOk: true,
    forbidDurationError: true,
  },
  {
    id: 'api2-live-pkg-book-past-duration-gate',
    kind: 'package' as const,
    path: 'book',
    expectOk: true,
    forbidDurationError: true,
  },
  {
    id: 'api2-live-pkg-checkout-over-cap',
    kind: 'package' as const,
    path: 'checkout',
    expectOk: true,
    forbidDurationError: true,
  },
  {
    id: 'api2-live-ms-preview-over-cap',
    kind: 'multi' as const,
    path: 'preview',
    expectOk: false,
    forbidDurationError: false,
    expectDurationError: true,
  },
  {
    id: 'api2-live-ms-suggest-block-over-cap',
    kind: 'multi' as const,
    path: 'suggest-block',
    expectOk: false,
    forbidDurationError: false,
    expectDurationError: true,
  },
  {
    id: 'api2-live-ms-providers-over-cap',
    kind: 'multi' as const,
    path: 'providers',
    expectOk: false,
    forbidDurationError: false,
    expectDurationError: true,
  },
  {
    id: 'api2-live-ms-under-cap-suggest',
    kind: 'multi-under' as const,
    path: 'suggest-block',
    expectOk: true,
    forbidDurationError: true,
  },
  {
    id: 'api2-live-ms-partial-over-preview',
    kind: 'multi-partial' as const,
    path: 'preview',
    expectOk: false,
    forbidDurationError: false,
    expectDurationError: true,
  },
  {
    id: 'api2-live-frontend-api-parity-block-slots',
    kind: 'package' as const,
    path: 'block-slots',
    expectOk: true,
    forbidDurationError: true,
  },
] as const;

export type ApiBug2LiveScenario = (typeof API_BUG2_LIVE_SCENARIOS)[number];
