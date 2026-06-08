/** acc-5.8 — rolling traffic bar before an intent may auto-execute (ai-e5 aligned). */
export const INTENT_GRADUATION_MIN_SAMPLES = 20;
export const INTENT_GRADUATION_ACCURACY = 0.85;

/** acc-5.8 — ship propose-only / dry-run until graduation metrics pass. */
export const PROPOSE_ONLY_UNTIL_GRADUATED = new Set([
  'bulk_create_catalog',
  'staff_service_matrix',
  'import_services_from_menu',
  'payment_sweep',
  'day_replan',
  'sick_day_replan',
]);

export interface IntentGraduationScenario {
  id: string;
  action: string;
  traffic?: { samples: number; accurateRate: number };
  confidenceHigh?: number;
  expectProposeOnly: boolean;
  expectGraduated: boolean;
}

export const INTENT_GRADUATION_SCENARIOS: IntentGraduationScenario[] = [
  {
    id: 'payment-sweep-no-traffic',
    action: 'payment_sweep',
    expectProposeOnly: true,
    expectGraduated: false,
  },
  {
    id: 'payment-sweep-graduated',
    action: 'payment_sweep',
    traffic: { samples: 25, accurateRate: 0.9 },
    expectProposeOnly: false,
    expectGraduated: true,
  },
  {
    id: 'payment-sweep-low-accuracy',
    action: 'payment_sweep',
    traffic: { samples: 30, accurateRate: 0.7 },
    expectProposeOnly: true,
    expectGraduated: false,
  },
  {
    id: 'create-booking-not-propose-only',
    action: 'create_booking',
    expectProposeOnly: false,
    expectGraduated: true,
  },
  {
    id: 'day-replan-needs-samples',
    action: 'day_replan',
    traffic: { samples: 10, accurateRate: 0.95 },
    expectProposeOnly: true,
    expectGraduated: false,
  },
];

export const INTENT_TRAFFIC_BUILD_SCENARIOS = [
  {
    id: 'trace-analytics',
    input: {
      payment_sweep: { total: 24, accurate: 21, clarify: 2, failures: 1 },
    },
    expect: { samples: 24, accurateRate: 0.875 },
  },
  {
    id: 'command-metrics-fallback',
    input: {
      payment_sweep: { total: 10, success: 8, clarify: 1, approval: 1 },
    },
    expect: { samples: 10, accurateRate: 0.8 },
  },
] as const;
