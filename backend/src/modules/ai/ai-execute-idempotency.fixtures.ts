import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import { AgentType, PlanStatus } from '../../engine/agent/interfaces/agent.interfaces.js';
import type { ExecuteRevalidationIssue } from './ai-execute-idempotency.util.js';

export const EXECUTE_REVALIDATION_ACTIONS = [
  'create_booking',
  'reschedule_booking',
  'execute_reassignment',
  'fill_slot_from_waitlist',
] as const;

export interface IntraPlanDuplicateScenario {
  id: string;
  plan: AgentPlan;
  expectIssueKinds: ExecuteRevalidationIssue['kind'][];
}

const basePlan = (
  steps: AgentPlan['steps'],
  overrides: Partial<AgentPlan> = {},
): AgentPlan => ({
  id: 'plan-1',
  agentType: AgentType.SCHEDULING_OPTIMIZATION,
  businessId: 'biz-1',
  intent: 'create_booking',
  reasoning: 'test',
  steps,
  constraints: [],
  riskAssessment: { level: 'low', factors: [] },
  status: PlanStatus.VALIDATED,
  createdAt: new Date(),
  ...overrides,
});

export const INTRA_PLAN_DUPLICATE_SCENARIOS: IntraPlanDuplicateScenario[] = [
  {
    id: 'duplicate-create-same-slot',
    plan: basePlan([
      {
        id: 's1',
        action: 'create_booking',
        description: 'Book A',
        params: {
          employeeId: 'e1',
          serviceId: 'svc1',
          startTime: '2026-06-10T09:00:00.000Z',
        },
        dependsOn: [],
      },
      {
        id: 's2',
        action: 'create_booking',
        description: 'Book B',
        params: {
          employeeId: 'e1',
          serviceId: 'svc2',
          startTime: '2026-06-10T09:00:00.000Z',
        },
        dependsOn: [],
      },
    ]),
    expectIssueKinds: ['duplicate_plan_mutation'],
  },
  {
    id: 'duplicate-reschedule-same-booking',
    plan: basePlan([
      {
        id: 's1',
        action: 'reschedule_booking',
        description: 'Move once',
        params: { bookingId: 'bk-1', startTime: '2026-06-10T10:00:00.000Z' },
        dependsOn: [],
      },
      {
        id: 's2',
        action: 'reschedule_booking',
        description: 'Move again',
        params: { bookingId: 'bk-1', startTime: '2026-06-10T11:00:00.000Z' },
        dependsOn: [],
      },
    ]),
    expectIssueKinds: ['duplicate_plan_mutation'],
  },
  {
    id: 'single-create-no-duplicates',
    plan: basePlan([
      {
        id: 's1',
        action: 'create_booking',
        description: 'Book once',
        params: {
          employeeId: 'e1',
          serviceId: 'svc1',
          startTime: '2026-06-10T09:00:00.000Z',
        },
        dependsOn: [],
      },
    ]),
    expectIssueKinds: [],
  },
];

export const EXECUTE_REVALIDATION_SUMMARY_SCENARIOS: Array<{
  id: string;
  issues: ExecuteRevalidationIssue[];
  expectIncludes: string;
}> = [
  {
    id: 'stale-plan',
    issues: [{ kind: 'stale_plan', message: 'Plan is stale' }],
    expectIncludes: 'stale',
  },
  {
    id: 'slot-unavailable',
    issues: [
      {
        kind: 'slot_unavailable',
        message: 'Provider is not free at 09:00',
        stepId: 's1',
      },
    ],
    expectIncludes: 'not free',
  },
  {
    id: 'schedule-conflict',
    issues: [
      {
        kind: 'schedule_conflict',
        message: 'Reschedule conflict: 1 overlapping booking(s)',
        stepId: 's1',
      },
    ],
    expectIncludes: 'conflict',
  },
];
