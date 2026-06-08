import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';

export interface PlanVerifyScenario {
  id: string;
  surface?: ClassificationSurface;
  prompt: string;
  plan: AgentPlan;
  expectOk: boolean;
  expectMismatches?: string[];
}

const basePlan = (
  overrides: Partial<AgentPlan> & Pick<AgentPlan, 'intent' | 'steps'>,
): AgentPlan => ({
  id: 'p-base',
  agentType: 'cancellation_recovery' as AgentPlan['agentType'],
  businessId: 'b1',
  reasoning: 'test plan',
  constraints: [],
  riskAssessment: { level: 'high', factors: [] },
  status: 'validated' as AgentPlan['status'],
  createdAt: new Date(),
  ...overrides,
});

/** acc-5.2 — plan steps must match user prompt scope before workflow execution. */
export const PLAN_VS_PROMPT_SCENARIOS: PlanVerifyScenario[] = [
  {
    id: 'dash-cancel-maria-tomorrow-match',
    surface: 'dashboard',
    prompt: 'cancel all bookings for Maria tomorrow',
    plan: basePlan({
      intent: 'cancel all bookings for Maria tomorrow',
      steps: [
        {
          id: 's1',
          action: 'cancel_bookings',
          description: 'Cancel Maria bookings tomorrow',
          params: { customerName: 'Maria', date: '2026-06-08' },
          dependsOn: [],
        },
      ],
    }),
    expectOk: true,
  },
  {
    id: 'dash-cancel-scope-too-broad',
    surface: 'dashboard',
    prompt: 'cancel Maria bookings tomorrow',
    plan: basePlan({
      intent: 'cancel Maria bookings tomorrow',
      steps: [
        {
          id: 's1',
          action: 'cancel_bookings',
          description: 'Cancel every booking this week',
          params: { allAppointments: true, dateFrom: '2026-06-01', dateTo: '2026-06-07' },
          dependsOn: [],
        },
      ],
    }),
    expectOk: false,
    expectMismatches: ['plan cancels a broad scope but prompt looks narrower'],
  },
  {
    id: 'dash-wrong-provider-in-plan',
    surface: 'dashboard',
    prompt: 'cancel Gevorg bookings tomorrow',
    plan: basePlan({
      intent: 'cancel Gevorg bookings tomorrow',
      steps: [
        {
          id: 's1',
          action: 'cancel_bookings',
          description: 'Cancel Anna bookings',
          params: { employeeName: 'Anna', date: '2026-06-08' },
          dependsOn: [],
        },
      ],
    }),
    expectOk: false,
    expectMismatches: ['plan targets Anna but prompt does not mention them'],
  },
  {
    id: 'dash-service-not-in-prompt',
    surface: 'dashboard',
    prompt: 'clear schedule tomorrow for Gevorg',
    plan: basePlan({
      agentType: 'scheduling_optimization' as AgentPlan['agentType'],
      intent: 'clear schedule tomorrow for Gevorg',
      steps: [
        {
          id: 's1',
          action: 'clear_schedule',
          description: 'Clear massage blocks',
          params: { employeeName: 'Gevorg', serviceName: 'Massage', date: '2026-06-08' },
          dependsOn: [],
        },
      ],
    }),
    expectOk: false,
    expectMismatches: ['plan targets service "Massage" but prompt does not mention it'],
  },
  {
    id: 'dash-single-day-range-mismatch',
    surface: 'dashboard',
    prompt: 'cancel all bookings tomorrow',
    plan: basePlan({
      intent: 'cancel all bookings tomorrow',
      steps: [
        {
          id: 's1',
          action: 'cancel_bookings',
          description: 'Cancel week of bookings',
          params: { allAppointments: true, dateFrom: '2026-06-08', dateTo: '2026-06-14' },
          dependsOn: [],
        },
      ],
    }),
    expectOk: false,
    expectMismatches: ['plan spans a date range but prompt looks single-day'],
  },
  {
    id: 'dash-hide-vs-cancel-intent',
    surface: 'dashboard',
    prompt: 'hide Maria appointments from the calendar tomorrow',
    plan: basePlan({
      intent: 'hide Maria appointments from the calendar tomorrow',
      steps: [
        {
          id: 's1',
          action: 'cancel_bookings',
          description: 'Cancel Maria bookings',
          params: { customerName: 'Maria', date: '2026-06-08' },
          dependsOn: [],
        },
      ],
    }),
    expectOk: false,
    expectMismatches: ['plan cancels bookings but prompt asked to hide'],
  },
  {
    id: 'dash-all-providers-narrow-prompt',
    surface: 'dashboard',
    prompt: 'clear Gevorg schedule tomorrow',
    plan: basePlan({
      agentType: 'scheduling_optimization' as AgentPlan['agentType'],
      intent: 'clear Gevorg schedule tomorrow',
      steps: [
        {
          id: 's1',
          action: 'clear_schedule',
          description: 'Clear all providers',
          params: { allProviders: true, date: '2026-06-08' },
          dependsOn: [],
        },
      ],
    }),
    expectOk: false,
    expectMismatches: ['plan affects all providers but prompt looks narrower'],
  },
  {
    id: 'provider-cancel-own-tomorrow',
    surface: 'provider',
    prompt: 'cancel my appointments tomorrow',
    plan: basePlan({
      agentType: 'scheduling_optimization' as AgentPlan['agentType'],
      intent: 'cancel my appointments tomorrow',
      steps: [
        {
          id: 's1',
          action: 'cancel_bookings',
          description: 'Cancel provider bookings tomorrow',
          params: { date: '2026-06-08', scope: 'self' },
          dependsOn: [],
        },
      ],
    }),
    expectOk: true,
  },
  {
    id: 'public-book-nearest-slot',
    surface: 'public',
    prompt: 'book swedish massage tomorrow evening',
    plan: basePlan({
      agentType: 'scheduling_optimization' as AgentPlan['agentType'],
      intent: 'book swedish massage tomorrow evening',
      steps: [
        {
          id: 's1',
          action: 'create_booking',
          description: 'Book Swedish massage tomorrow evening',
          params: { serviceName: 'Swedish Massage', date: '2026-06-08' },
          dependsOn: [],
        },
      ],
    }),
    expectOk: true,
  },
  {
    id: 'customer-reschedule-wrong-service',
    surface: 'customer',
    prompt: 'reschedule my facial to tomorrow',
    plan: basePlan({
      agentType: 'scheduling_optimization' as AgentPlan['agentType'],
      intent: 'reschedule my facial to tomorrow',
      steps: [
        {
          id: 's1',
          action: 'reschedule_booking',
          description: 'Move massage appointment',
          params: { serviceName: 'Massage', date: '2026-06-08' },
          dependsOn: [],
        },
      ],
    }),
    expectOk: false,
    expectMismatches: ['plan targets service "Massage" but prompt does not mention it'],
  },
  {
    id: 'dash-multi-step-missing-cancel-intent',
    surface: 'dashboard',
    prompt: 'cancel Maria then notify her',
    plan: basePlan({
      intent: 'cancel Maria then notify her',
      steps: [
        {
          id: 's1',
          action: 'hide_bookings',
          description: 'Hide Maria bookings',
          params: { customerName: 'Maria' },
          dependsOn: [],
        },
        {
          id: 's2',
          action: 'notify_customers',
          description: 'Notify Maria',
          params: { customerName: 'Maria' },
          dependsOn: ['s1'],
        },
      ],
    }),
    expectOk: false,
    expectMismatches: ['plan step hide_bookings does not match cancel intent in prompt'],
  },
  {
    id: 'dash-broad-cancel-all-match',
    surface: 'dashboard',
    prompt: 'cancel every booking this week',
    plan: basePlan({
      intent: 'cancel every booking this week',
      steps: [
        {
          id: 's1',
          action: 'cancel_bookings',
          description: 'Cancel all bookings this week',
          params: { allAppointments: true, dateFrom: '2026-06-01', dateTo: '2026-06-07' },
          dependsOn: [],
        },
      ],
    }),
    expectOk: true,
  },
];

/** Back-compat alias for execution verification specs. */
export const PLAN_VERIFY_SCENARIOS = PLAN_VS_PROMPT_SCENARIOS;
