import type { AgentPlan, AgentPlanStep } from '../../engine/agent/interfaces/agent.interfaces.js';
import type { PlanTierId } from '../billing/plan-limits.js';
import type { AccessTier } from './access-control.matrix.js';
import {
  getEffectiveAllowedIntents,
  type AiSurface,
} from './ai-capability.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type {
  CompoundDecompositionResult,
  DecomposedIntentStep,
} from './intent-decomposition.types.js';
import {
  CAPABILITY_PLANNER_OUT_OF_SCOPE_PLAN,
  CAPABILITY_PLANNER_PROBE_SCENARIOS,
  type CapabilityPlannerBounds,
} from './ai-capability-bounded-planner.fixtures.js';

export {
  CAPABILITY_PLANNER_OUT_OF_SCOPE_PLAN,
  CAPABILITY_PLANNER_PROBE_SCENARIOS,
  type CapabilityPlannerBounds,
} from './ai-capability-bounded-planner.fixtures.js';

export interface CapabilityPlanValidation {
  ok: boolean;
  outOfScope: string[];
  allowedCount: number;
}

export interface CapabilityBoundedPlannerStatus {
  complete: boolean;
  errors: string[];
  probesChecked: number;
}

/** parity-3.1 — role/plan-filtered intent pool for decomposition + orchestration. */
export function resolvePlannerAllowedIntents(
  bounds: CapabilityPlannerBounds,
): readonly string[] {
  return getEffectiveAllowedIntents(
    bounds.surface,
    bounds.accessTier,
    bounds.planTierId ?? 'solo',
  );
}

export function toAllowedIntentSet(
  allowedIntents: readonly string[],
): ReadonlySet<string> {
  return new Set(allowedIntents);
}

export function isActionAllowedForPlanner(
  action: string,
  allowedIntents: readonly string[],
): boolean {
  if (
    action === 'unknown' ||
    action === 'error' ||
    action === 'security_blocked'
  ) {
    return true;
  }
  return allowedIntents.includes(action);
}

export function intersectAllowedActions(
  candidateActions: readonly string[],
  capabilityAllowed: readonly string[],
): string[] {
  const allowed = new Set(capabilityAllowed);
  return candidateActions.filter((action) => allowed.has(action));
}

export function filterDecomposedStepsToAllowedIntents(
  steps: readonly DecomposedIntentStep[],
  allowedIntents: readonly string[],
): DecomposedIntentStep[] {
  const allowed = new Set(allowedIntents);
  return steps.filter((step) => allowed.has(step.action));
}

export function filterAgentPlanStepsToAllowedIntents(
  steps: readonly AgentPlanStep[],
  allowedIntents: readonly string[],
): AgentPlanStep[] {
  const allowed = new Set(allowedIntents);
  return steps.filter((step) => allowed.has(step.action));
}

export function findOutOfScopePlanStepActions(
  plan: Pick<AgentPlan, 'steps'>,
  allowedIntents: readonly string[],
): string[] {
  const out: string[] = [];
  for (const step of plan.steps) {
    if (!isActionAllowedForPlanner(step.action, allowedIntents)) {
      out.push(step.action);
    }
  }
  return [...new Set(out)];
}

/** parity-3.1 — every plan step must be in the role's effective allowed-intent set. */
export function validatePlanAgainstAllowedIntents(
  plan: Pick<AgentPlan, 'steps'>,
  allowedIntents: readonly string[],
): CapabilityPlanValidation {
  const outOfScope = findOutOfScopePlanStepActions(plan, allowedIntents);
  return {
    ok: outOfScope.length === 0,
    outOfScope,
    allowedCount: allowedIntents.length,
  };
}

export function buildOutOfScopePlanSummary(outOfScope: readonly string[]): string {
  if (outOfScope.length === 0) {
    return 'Plan steps are within your role capabilities.';
  }
  const listed = outOfScope.map((action) => action.replace(/_/g, ' ')).join(', ');
  return `This plan includes actions outside your role (${listed}). Narrow the request or ask an owner/manager.`;
}

export function sanitizeCompoundDecomposition(
  result: CompoundDecompositionResult | null,
  allowedIntents: readonly string[],
): CompoundDecompositionResult | null {
  if (!result) return null;
  const filtered = filterDecomposedStepsToAllowedIntents(
    result.steps,
    allowedIntents,
  );
  if (filtered.length < 2) return null;
  return { ...result, steps: filtered };
}

export function assertCapabilityBoundedPlannerProbes(): CapabilityBoundedPlannerStatus {
  const errors: string[] = [];

  for (const probe of CAPABILITY_PLANNER_PROBE_SCENARIOS) {
    const allowed = resolvePlannerAllowedIntents(probe.bounds);
    if (probe.allowedAction && !allowed.includes(probe.allowedAction)) {
      errors.push(
        `${probe.id}: expected ${probe.allowedAction} in allowed set for ${probe.bounds.accessTier}/${probe.bounds.surface}`,
      );
    }
    if (probe.deniedAction && allowed.includes(probe.deniedAction)) {
      errors.push(
        `${probe.id}: ${probe.deniedAction} must be denied for ${probe.bounds.accessTier}/${probe.bounds.surface}`,
      );
    }
  }

  const staffAllowed = resolvePlannerAllowedIntents({
    surface: 'dashboard',
    accessTier: 'staff',
    planTierId: 'solo',
  });
  const staffPlan = {
    steps: CAPABILITY_PLANNER_OUT_OF_SCOPE_PLAN.steps,
  };
  const staffValidation = validatePlanAgainstAllowedIntents(
    staffPlan as unknown as { steps: AgentPlan['steps'] },
    staffAllowed,
  );
  if (staffValidation.ok) {
    errors.push('staff plan with list_employees must fail capability validation');
  }
  if (!staffValidation.outOfScope.includes('list_employees')) {
    errors.push('staff plan must flag list_employees as out-of-scope');
  }

  const ownerAllowed = resolvePlannerAllowedIntents({
    surface: 'dashboard',
    accessTier: 'owner',
    planTierId: 'solo',
  });
  const ownerOnlyPlan = {
    steps: [
      {
        id: 's1',
        action: 'list_employees',
        description: 'List staff',
        params: {},
        dependsOn: [],
      },
    ],
  };
  const ownerValidation = validatePlanAgainstAllowedIntents(
    ownerOnlyPlan,
    ownerAllowed,
  );
  if (!ownerValidation.ok) {
    errors.push('owner list_employees plan should pass capability validation');
  }

  return {
    complete: errors.length === 0,
    errors,
    probesChecked: CAPABILITY_PLANNER_PROBE_SCENARIOS.length + 2,
  };
}

export function formatCapabilityBoundedPlannerReport(
  status: CapabilityBoundedPlannerStatus,
): string {
  const lines = [
    'AI Capability-Bounded Planner (parity-3.1)',
    `Status: ${status.complete ? 'PASS' : 'FAIL'}`,
    `Probes checked: ${status.probesChecked}`,
  ];
  if (status.errors.length > 0) {
    lines.push('', 'Failures:');
    for (const error of status.errors) {
      lines.push(`  - ${error}`);
    }
  }
  return lines.join('\n');
}

/** Map AiSurface to CommandSurface (identical union values). */
export function plannerSurfaceToCommandSurface(
  surface: AiSurface,
): CommandSurface {
  return surface;
}
