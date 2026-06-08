import type { DecomposedIntentStep } from './intent-decomposition.types.js';

export const MID_PLAN_CLARIFY_SESSION_KEY = '_midPlanClarify' as const;

export interface MidPlanClarifyProbeScenario {
  id: string;
  parentAction: 'goal_execution' | 'compound_intent';
  originalPrompt: string;
  steps: DecomposedIntentStep[];
  pauseStepIndex: number;
  followUpPrompt: string;
  followUpMemory: Record<string, string>;
  expectMergedField: string;
  expectMergedValue: string;
  expectPreservedStepIndex: number;
  expectPreservedField: string;
  expectPreservedValue: unknown;
}

/** parity-3.3 — mid-plan clarify merge preserves earlier goal/compound steps. */
export const MID_PLAN_CLARIFY_PROBE_SCENARIOS: MidPlanClarifyProbeScenario[] = [
  {
    id: 'goal-apply-schedule-template-slot',
    parentAction: 'goal_execution',
    originalPrompt:
      'Set up my new stylist Anna end-to-end from weekday template and assign haircut',
    steps: [
      {
        action: 'assign_employee_services',
        params: { employeeName: 'Anna', serviceNames: ['haircut'] },
        reasoning: 'Goal step 1',
      },
      {
        action: 'apply_schedule',
        params: { employeeName: 'Anna' },
        reasoning: 'Goal step 2',
      },
      {
        action: 'create_direct_schedule',
        params: { employeeName: 'Anna' },
        reasoning: 'Goal step 3',
      },
      {
        action: 'fill_unused_slots',
        params: { employeeName: 'Anna' },
        reasoning: 'Goal step 4',
      },
    ],
    pauseStepIndex: 1,
    followUpPrompt: 'weekday template this week',
    followUpMemory: { templateName: 'weekday', dateFrom: '2026-06-09' },
    expectMergedField: 'templateName',
    expectMergedValue: 'weekday',
    expectPreservedStepIndex: 0,
    expectPreservedField: 'serviceNames',
    expectPreservedValue: ['haircut'],
  },
  {
    id: 'compound-assign-missing-service',
    parentAction: 'compound_intent',
    originalPrompt: 'Assign services to Anna and apply weekday template this week',
    steps: [
      {
        action: 'assign_employee_services',
        params: { employeeName: 'Anna' },
        reasoning: 'Compound step 1',
      },
      {
        action: 'apply_schedule',
        params: { employeeName: 'Anna', templateName: 'weekday' },
        reasoning: 'Compound step 2',
      },
    ],
    pauseStepIndex: 0,
    followUpPrompt: 'haircut and color',
    followUpMemory: { serviceName: 'haircut' },
    expectMergedField: 'serviceName',
    expectMergedValue: 'haircut',
    expectPreservedStepIndex: 1,
    expectPreservedField: 'templateName',
    expectPreservedValue: 'weekday',
  },
];
