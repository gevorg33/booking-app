import type { AgentPlan, AgentPlanStep } from './agent.interfaces.js';
import { AgentType, PlanStatus } from './agent.interfaces.js';

/**
 * Build a complete `AgentPlanStep` for tests.
 *
 * F1 / e2e-bug.359 — specs write `{ id: '1' }` where a full step is expected,
 * because the assertion is about the step's *identity or count*, not its
 * contents. The literal is a valid subset, so constructing it satisfies the
 * type without changing what the test is about.
 *
 * That "valid subset" is the condition worth checking before reaching for a
 * builder: it is what separates this from `ResolvedCommand` and `Booking`,
 * where the literals carried fields of the **wrong type** and a builder turned
 * 16 errors into 32 by exposing them.
 */
export function makeAgentPlanStep(
  partial: Partial<AgentPlanStep> = {},
): AgentPlanStep {
  return {
    id: 'step-test',
    action: 'noop',
    description: '',
    params: {},
    dependsOn: [],
    ...partial,
  };
}

/**
 * Build a complete `AgentPlan` for tests.
 *
 * Needed alongside `makeAgentPlanStep`, not after it: wrapping the step
 * literals moved the complaint *outward* to the enclosing plan (`riskAssessment`
 * missing) and then inward again to `riskAssessment` itself (`factors`
 * missing). Builders only converge once every nested shape has one — the same
 * lesson `makeService` / `makeServiceCategory` / `makeEmployee` taught.
 */
export function makeAgentPlan(partial: Partial<AgentPlan> = {}): AgentPlan {
  return {
    id: 'plan-test',
    agentType: AgentType.SCHEDULING_OPTIMIZATION,
    businessId: 'biz-test',
    intent: 'test',
    reasoning: '',
    steps: [],
    constraints: [],
    riskAssessment: { level: 'low', factors: [] },
    status: PlanStatus.DRAFT,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}
