import type { PlanTierId } from '../billing/plan-limits.js';
import { normalizeActorRole, type AiSurface } from './ai-capability.matrix.js';
import {
  isActionAllowedForPlanner,
  resolvePlannerAllowedIntents,
  type CapabilityPlannerBounds,
} from './ai-capability-bounded-planner.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  PER_STEP_PERMISSION_ESCALATION_PROBES,
  PER_STEP_RUNTIME_BOUNDS_PROBE,
  type PerStepPermissionEscalationProbe,
} from './ai-per-step-permission-recheck.fixtures.js';

export {
  PER_STEP_PERMISSION_ESCALATION_PROBES,
  PER_STEP_RUNTIME_BOUNDS_PROBE,
  type PerStepPermissionEscalationProbe,
} from './ai-per-step-permission-recheck.fixtures.js';

export interface PerStepPermissionDenied {
  stepIndex: number;
  action: string;
  bounds: CapabilityPlannerBounds;
}

export interface PerStepPermissionRecheckStatus {
  complete: boolean;
  errors: string[];
  probesChecked: number;
}

/** parity-3.4 — resolve current role/plan bounds from session at execute time. */
export function resolvePlannerBoundsFromSession(
  sessionContext?: Record<string, unknown>,
  surface: AiSurface = 'dashboard',
): CapabilityPlannerBounds {
  return {
    surface,
    accessTier: normalizeActorRole(
      (sessionContext?._accessTier as string | undefined) ??
        (sessionContext?._actorRole as string | undefined) ??
        (sessionContext?._membershipRole as string | undefined) ??
        'owner',
    ),
    planTierId:
      (sessionContext?._planTierId as PlanTierId | undefined) ?? 'solo',
  };
}

/** parity-3.4 — re-check one step against live tier + surface + plan before running it. */
export function validateStepPermissionAtExecute(
  action: string,
  bounds: CapabilityPlannerBounds,
): { ok: true } | { ok: false; deniedAction: string } {
  const allowed = resolvePlannerAllowedIntents(bounds);
  if (!isActionAllowedForPlanner(action, allowed)) {
    return { ok: false, deniedAction: action };
  }
  return { ok: true };
}

export function findFirstDeniedStepAtExecute(
  steps: readonly { action: string }[],
  bounds: CapabilityPlannerBounds,
): PerStepPermissionDenied | null {
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const check = validateStepPermissionAtExecute(steps[stepIndex].action, bounds);
    if (!check.ok) {
      return {
        stepIndex,
        action: check.deniedAction,
        bounds,
      };
    }
  }
  return null;
}

export function buildPerStepPermissionDeniedSummary(
  deniedAction: string,
  stepIndex: number,
  totalSteps: number,
): string {
  const label = deniedAction.replace(/_/g, ' ');
  return `Step ${stepIndex + 1} of ${totalSteps} (${label}) is outside your role. I stopped before running it — ask an owner/manager or narrow the request.`;
}

export function buildPerStepPermissionDeniedCommandResult(input: {
  parentAction: 'goal_execution' | 'compound_intent';
  deniedAction: string;
  stepIndex: number;
  totalSteps: number;
  bounds: CapabilityPlannerBounds;
  pipelineTrace?: import('./command-completion.types.js').PipelineTrace[];
}): CommandResult {
  return {
    success: false,
    action: input.parentAction,
    summary: buildPerStepPermissionDeniedSummary(
      input.deniedAction,
      input.stepIndex,
      input.totalSteps,
    ),
    details: {
      perStepPermissionRecheckFailed: true,
      privilegeEscalationBlocked: true,
      deniedStepIndex: input.stepIndex,
      deniedAction: input.deniedAction,
      plannerBounds: input.bounds,
      pipelineStage: 'execute',
      requiresExecutionConfirmation: false,
      ...(input.pipelineTrace ? { pipelineTrace: input.pipelineTrace } : {}),
    },
  };
}

export function assertPerStepPermissionRecheckProbes(): PerStepPermissionRecheckStatus {
  const errors: string[] = [];

  for (const probe of PER_STEP_PERMISSION_ESCALATION_PROBES) {
    for (let i = 0; i < probe.allowedBeforeDenial; i++) {
      const early = validateStepPermissionAtExecute(
        probe.steps[i].action,
        probe.bounds,
      );
      if (!early.ok) {
        errors.push(
          `${probe.id}: step ${i} (${probe.steps[i].action}) should pass execute-time check`,
        );
      }
    }

    const denied = findFirstDeniedStepAtExecute(probe.steps, probe.bounds);
    if (!denied) {
      errors.push(`${probe.id}: expected execute-time denial`);
      continue;
    }
    if (denied.stepIndex !== probe.deniedAtStepIndex) {
      errors.push(
        `${probe.id}: expected denial at step ${probe.deniedAtStepIndex}, got ${denied.stepIndex}`,
      );
    }
    if (denied.action !== probe.deniedAction) {
      errors.push(
        `${probe.id}: expected denied action ${probe.deniedAction}, got ${denied.action}`,
      );
    }
  }

  const runtimeProbe = PER_STEP_RUNTIME_BOUNDS_PROBE;
  const planTimeDenied = findFirstDeniedStepAtExecute(
    runtimeProbe.steps,
    runtimeProbe.planTimeBounds,
  );
  if (planTimeDenied) {
    errors.push(
      `${runtimeProbe.id}: owner bounds should allow plan through step 1`,
    );
  }
  const executeDenied = findFirstDeniedStepAtExecute(
    runtimeProbe.steps,
    runtimeProbe.executeTimeBounds,
  );
  if (!executeDenied || executeDenied.stepIndex !== runtimeProbe.deniedAtStepIndex) {
    errors.push(
      `${runtimeProbe.id}: staff execute-time bounds must block list_employees`,
    );
  }

  return {
    complete: errors.length === 0,
    errors,
    probesChecked:
      PER_STEP_PERMISSION_ESCALATION_PROBES.length +
      1,
  };
}

export function formatPerStepPermissionRecheckReport(
  status: PerStepPermissionRecheckStatus,
): string {
  const lines = [
    'AI Per-Step Permission Re-check (parity-3.4)',
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
