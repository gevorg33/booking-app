/**
 * e2e-bug.262 — public slots must not list startTimes that create would 409
 * for employee booking overlap (even when micro-slot capacity still looks open).
 */

export const E2E262_SOURCE_RULES = [
  {
    id: 'e2e262-source-overlap-comment',
    mustContain: 'e2e-bug.262',
  },
  {
    id: 'e2e262-source-has-active-booking-overlap-helper',
    mustContain: 'private async hasActiveBookingOverlap(',
  },
  {
    id: 'e2e262-source-fully-booked-conflict-message',
    mustContain:
      'All time slots in the requested window are already fully booked.',
  },
] as const;

export type E2e262ValidateCase = {
  id: string;
  description: string;
  overlapCount: number;
  expectConflict: boolean;
};

/** validateServiceFitsWindow when micro-slots are AVAILABLE */
export const E2E262_VALIDATE_WINDOW_CASES: readonly E2e262ValidateCase[] = [
  {
    id: 'e2e262-unit-overlap-blocks-window',
    description:
      'AVAILABLE micro-slots + active employee overlap → ConflictException',
    overlapCount: 1,
    expectConflict: true,
  },
  {
    id: 'e2e262-unit-no-overlap-allows-window',
    description: 'AVAILABLE micro-slots + no overlap → ok',
    overlapCount: 0,
    expectConflict: false,
  },
];

export const E2E262_LIVE_SCENARIOS = [
  {
    id: 'e2e262-live-zero-phantom-listed',
    description:
      'Every listed public slot for the provider has zero active employee overlaps',
  },
  {
    id: 'e2e262-live-listed-slot-books',
    description: 'A listed slot can be booked (201) — not a phantom chip',
  },
  {
    id: 'e2e262-live-winner-absent-from-slots',
    description: 'After book, winning startTime is absent from GET …/slots',
  },
  {
    id: 'e2e262-live-duration-overlap-neighbors-hidden',
    description:
      'Starts that overlap the booked window (e.g. +30m into a 60m booking) are not listed',
  },
  {
    id: 'e2e262-live-cancelled-does-not-block',
    description:
      'After cancel, the freed startTime reappears (or is bookable again)',
  },
  {
    id: 'e2e262-live-other-employee-same-time-ok',
    description:
      'A different employee can still list the same wall-clock start when free',
  },
  {
    id: 'e2e262-live-provider-slots-parity',
    description:
      'GET providers/:id/slots also omits overlap-blocked starts for that employee',
  },
] as const;
