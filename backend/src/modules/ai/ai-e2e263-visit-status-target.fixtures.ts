/**
 * e2e-bug.263 — mark_visit_in_progress / mark_visit_complete must not
 * bulk-mutate every matching day appointment when untargeted.
 */

export type E2e263TargetGateCase = {
  id: string;
  matchedCount: number;
  expectClarify: boolean;
};

export const E2E263_TARGET_GATE_CASES: readonly E2e263TargetGateCase[] = [
  {
    id: 'e2e263-gate-zero-matches',
    matchedCount: 0,
    expectClarify: false,
  },
  {
    id: 'e2e263-gate-single-match-ok',
    matchedCount: 1,
    expectClarify: false,
  },
  {
    id: 'e2e263-gate-multi-match-clarify',
    matchedCount: 2,
    expectClarify: true,
  },
  {
    id: 'e2e263-gate-five-match-clarify',
    matchedCount: 5,
    expectClarify: true,
  },
];

export const E2E263_LIVE_SCENARIOS = [
  {
    id: 'e2e263-live-untargeted-in-progress-clarify',
    prompt: 'Start appointment now',
    expectAction: 'mark_visit_in_progress',
    expectClarify: true,
  },
  {
    id: 'e2e263-live-untargeted-complete-clarify',
    prompt: 'Mark visit complete',
    expectAction: 'mark_visit_complete',
    expectClarify: true,
  },
  {
    id: 'e2e263-live-untargeted-mark-in-progress-clarify',
    prompt: 'Mark in progress',
    expectAction: 'mark_visit_in_progress',
    expectClarify: true,
  },
  {
    id: 'e2e263-live-begin-visit-clarify',
    prompt: 'Begin the visit',
    expectAction: 'mark_visit_in_progress',
    expectClarify: true,
  },
  {
    id: 'e2e263-live-hy-start-clarify',
    prompt: 'Սկսիր սպասարկումը',
    expectAction: 'mark_visit_in_progress',
    expectClarify: true,
  },
  {
    id: 'e2e263-live-ru-start-clarify',
    prompt: 'Начни обслуживание',
    expectAction: 'mark_visit_in_progress',
    expectClarify: true,
  },
  {
    id: 'e2e263-live-named-client-updates-one',
    prompt: "Start E2E263 Target's appointment",
    expectAction: 'mark_visit_in_progress',
    expectSingleUpdate: true,
  },
  {
    id: 'e2e263-live-session-bookingId-updates-one',
    prompt: 'Start appointment now',
    expectAction: 'mark_visit_in_progress',
    expectSingleUpdate: true,
    useSessionBookingId: true,
  },
  {
    id: 'e2e263-live-single-match-may-update',
    prompt: 'Start appointment now',
    expectAction: 'mark_visit_in_progress',
    expectSingleOrClarify: true,
  },
] as const;
