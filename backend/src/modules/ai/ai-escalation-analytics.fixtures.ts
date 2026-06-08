/** acc-6.7 — target escalation rate (human handoff / prompts). */
export const ESCALATION_RATE_TARGET = 0.01;

/** Weekly review + eval harvest sample size. */
export const ESCALATION_REVIEW_TOP_N = 10;

export const ESCALATION_ANALYTICS_SCENARIOS = [
  {
    id: 'no-escalations',
    total: 100,
    escalations: 0,
    expectRate: 0,
    expectMeetsTarget: true,
  },
  {
    id: 'under-target',
    total: 200,
    escalations: 1,
    expectRate: 0.005,
    expectMeetsTarget: true,
  },
  {
    id: 'over-target',
    total: 100,
    escalations: 3,
    expectRate: 0.03,
    expectMeetsTarget: false,
  },
] as const;
