import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import { AgentType, PlanStatus } from '../../engine/agent/interfaces/agent.interfaces.js';

/** acc-5.7 — hard blast-radius caps per AI command. */
export const BLAST_RADIUS_CAPS = {
  maxBookings: 25,
  maxProviders: 5,
  maxDateRangeDays: 31,
} as const;

export interface BlastRadiusScenario {
  id: string;
  action: string;
  params: Record<string, unknown>;
  expectExceeds: boolean;
}

export const BLAST_RADIUS_PARAM_SCENARIOS: BlastRadiusScenario[] = [
  {
    id: 'cancel-thirty-bookings',
    action: 'cancel_bookings',
    params: { bookingIds: Array.from({ length: 30 }, (_, i) => `bk-${i}`) },
    expectExceeds: true,
  },
  {
    id: 'cancel-five-bookings',
    action: 'cancel_bookings',
    params: { bookingIds: ['a', 'b', 'c', 'd', 'e'] },
    expectExceeds: false,
  },
  {
    id: 'six-providers',
    action: 'clear_schedule',
    params: { employeeIds: ['1', '2', '3', '4', '5', '6'] },
    expectExceeds: true,
  },
  {
    id: 'wide-date-range',
    action: 'cancel_bookings',
    params: { dateFrom: '2026-01-01', dateTo: '2026-03-15' },
    expectExceeds: true,
  },
  {
    id: 'narrow-date-range',
    action: 'list_bookings',
    params: { dateFrom: '2026-06-01', dateTo: '2026-06-07' },
    expectExceeds: false,
  },
];

export interface PlanBlastRadiusScenario {
  id: string;
  plan: AgentPlan;
  expectExceeds: boolean;
  expectBookingCount?: number;
}

const basePlan = (
  steps: AgentPlan['steps'],
  overrides: Partial<AgentPlan> = {},
): AgentPlan => ({
  id: 'plan-br',
  agentType: AgentType.CANCELLATION_RECOVERY,
  businessId: 'biz-1',
  intent: 'cancel_bookings',
  reasoning: 'test',
  steps,
  constraints: [],
  riskAssessment: { level: 'high', factors: ['bulk cancel'] },
  status: PlanStatus.REQUIRES_APPROVAL,
  createdAt: new Date(),
  ...overrides,
});

export const BLAST_RADIUS_PLAN_SCENARIOS: PlanBlastRadiusScenario[] = [
  {
    id: 'plan-cancel-thirty',
    plan: basePlan([
      {
        id: 's1',
        action: 'cancel_bookings',
        description: 'Cancel many',
        params: {
          bookingIds: Array.from({ length: 30 }, (_, i) => `bk-${i}`),
        },
        dependsOn: [],
      },
    ]),
    expectExceeds: true,
    expectBookingCount: 30,
  },
  {
    id: 'plan-multi-create-under-cap',
    plan: basePlan(
      Array.from({ length: 3 }, (_, i) => ({
        id: `s${i}`,
        action: 'create_booking',
        description: `Book ${i}`,
        params: {
          employeeId: `e${i}`,
          startTime: `2026-06-10T0${i + 9}:00:00.000Z`,
        },
        dependsOn: [],
      })),
      { intent: 'create_booking' },
    ),
    expectExceeds: false,
    expectBookingCount: 3,
  },
  {
    id: 'plan-six-providers-clear',
    plan: basePlan([
      {
        id: 's1',
        action: 'clear_schedule',
        description: 'Clear six',
        params: { employeeIds: ['1', '2', '3', '4', '5', '6'] },
        dependsOn: [],
      },
    ]),
    expectExceeds: true,
  },
];

export const BLAST_RADIUS_EXECUTE_SCENARIOS: Array<{
  id: string;
  confirmed: boolean;
  params: Record<string, unknown>;
  expectOk: boolean;
}> = [
  {
    id: 'execute-blocked-without-confirm',
    confirmed: false,
    params: { bookingIds: Array.from({ length: 30 }, (_, i) => `bk-${i}`) },
    expectOk: false,
  },
  {
    id: 'execute-allowed-after-confirm',
    confirmed: true,
    params: { bookingIds: Array.from({ length: 30 }, (_, i) => `bk-${i}`) },
    expectOk: true,
  },
];
