import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import {
  buildBlastRadiusConfirmResult,
  evaluateMultiStepBlastRadius,
  isBlastRadiusConfirmed,
} from './ai-blast-radius-cap.util.js';
import { isRegistryMutating } from './ai-command-registry.util.js';
import type { CommandResult } from './command-completion.types.js';
import { isExecutionConfirmed } from './ai-execution-confirm.util.js';
import {
  buildIntentGraduationStatus,
  requiresProposeOnlyExecution,
  resolveGraduationThresholdsFromContext,
  resolveIntentTrafficMetrics,
  shouldForcePlanApprovalForIntent,
  type IntentGraduationStatus,
  type IntentGraduationThresholds,
  type IntentTrafficMetrics,
} from './ai-intent-graduation.util.js';
import {
  buildPlanStepPreviewRows,
  type PlanStepPreviewRow,
} from './ai-plan-preview-rollback.util.js';
import {
  MULTI_STEP_SAFETY_DESTRUCTIVE_ACTIONS,
  MULTI_STEP_SAFETY_PROBES,
  type MultiStepSafetyProbe,
} from './ai-multi-step-safety.fixtures.js';
export {
  MULTI_STEP_SAFETY_DESTRUCTIVE_ACTIONS,
  MULTI_STEP_SAFETY_PROBES,
  type MultiStepSafetyProbe,
} from './ai-multi-step-safety.fixtures.js';

export type MultiStepDryRunReason =
  | 'propose_only_step'
  | 'destructive_multi_step'
  | 'parent_propose_only';

export interface MultiStepDryRunAssessment {
  required: boolean;
  reason?: MultiStepDryRunReason;
  proposeOnlySteps: string[];
  destructiveSteps: string[];
  graduationStatuses: IntentGraduationStatus[];
}

export interface MultiStepSafetyStatus {
  complete: boolean;
  errors: string[];
  probesChecked: number;
}

const READ_ONLY_COMPOUND_ACTIONS = new Set([
  'list_bookings',
  'show_appointments',
  'check_availability',
  'summarize_day',
  'summarize_bookings',
  'analyze_appointments',
  'analyze_services',
  'summarize_staff',
  'lookup_customer',
  'summarize_waitlist',
  'lookup_service_assignment',
  'list_services',
  'list_employees',
  'list_templates',
  'list_schedule_gaps',
  'summarize_utilization',
  'summarize_customers',
]);

export function isDestructiveMultiStepAction(action: string): boolean {
  return MULTI_STEP_SAFETY_DESTRUCTIVE_ACTIONS.has(action);
}

export function isDestructiveMultiStepPlan(
  steps: readonly { action: string }[],
): boolean {
  const destructive = steps
    .map((step) => step.action)
    .filter((action) => isDestructiveMultiStepAction(action));
  return destructive.length > 0 && steps.length >= 2;
}

export function hasMutatingMultiStepStep(
  steps: readonly { action: string }[],
): boolean {
  return steps.some(
    (step) =>
      isRegistryMutating(step.action) &&
      !READ_ONLY_COMPOUND_ACTIONS.has(step.action),
  );
}

export function assessMultiStepDryRun(input: {
  parentAction: string;
  subIntents: readonly { action: string }[];
  intentTraffic?: Record<string, IntentTrafficMetrics>;
  thresholds?: IntentGraduationThresholds;
  autoExecuteRequested: boolean;
  planApproved?: boolean;
}): MultiStepDryRunAssessment {
  const thresholds =
    input.thresholds ?? resolveGraduationThresholdsFromContext(undefined);
  const traffic = input.intentTraffic;
  const graduationStatuses: IntentGraduationStatus[] = [];
  const proposeOnlySteps: string[] = [];

  if (!input.autoExecuteRequested || input.planApproved) {
    return {
      required: false,
      proposeOnlySteps: [],
      destructiveSteps: [],
      graduationStatuses: [],
    };
  }

  const parentStatus = buildIntentGraduationStatus({
    action: input.parentAction,
    traffic: resolveIntentTrafficMetrics(traffic, input.parentAction),
    thresholds,
  });
  graduationStatuses.push(parentStatus);
  if (parentStatus.proposeOnly) {
    return {
      required: true,
      reason: 'parent_propose_only',
      proposeOnlySteps: [input.parentAction],
      destructiveSteps: [],
      graduationStatuses,
    };
  }

  for (const step of input.subIntents) {
    const status = buildIntentGraduationStatus({
      action: step.action,
      traffic: resolveIntentTrafficMetrics(traffic, step.action),
      thresholds,
    });
    graduationStatuses.push(status);
    if (status.proposeOnly) {
      proposeOnlySteps.push(step.action);
    }
  }

  if (proposeOnlySteps.length > 0) {
    return {
      required: true,
      reason: 'propose_only_step',
      proposeOnlySteps,
      destructiveSteps: input.subIntents
        .map((step) => step.action)
        .filter((action) => isDestructiveMultiStepAction(action)),
      graduationStatuses,
    };
  }

  const destructiveSteps = input.subIntents
    .map((step) => step.action)
    .filter((action) => isDestructiveMultiStepAction(action));
  if (
    isDestructiveMultiStepPlan(input.subIntents) &&
    hasMutatingMultiStepStep(input.subIntents)
  ) {
    return {
      required: true,
      reason: 'destructive_multi_step',
      proposeOnlySteps: [],
      destructiveSteps,
      graduationStatuses,
    };
  }

  return {
    required: false,
    proposeOnlySteps: [],
    destructiveSteps,
    graduationStatuses,
  };
}

/** parity-3.6 — block auto-execute when any sub-step is propose-only or plan is destructive multi-step. */
export function resolveMultiStepGraduatedAutoExecute(input: {
  parentAction: string;
  subIntents: readonly { action: string }[];
  autoExecute: boolean;
  context?: Record<string, unknown>;
}): boolean {
  if (!input.autoExecute) return false;

  const thresholds = resolveGraduationThresholdsFromContext(input.context);
  const traffic = input.context?._intentTraffic as
    | Record<string, IntentTrafficMetrics>
    | undefined;

  if (
    shouldForcePlanApprovalForIntent({
      action: input.parentAction,
      traffic: resolveIntentTrafficMetrics(traffic, input.parentAction),
      thresholds,
      autoExecuteRequested: true,
    })
  ) {
    return false;
  }

  for (const step of input.subIntents) {
    if (
      shouldForcePlanApprovalForIntent({
        action: step.action,
        traffic: resolveIntentTrafficMetrics(traffic, step.action),
        thresholds,
        autoExecuteRequested: true,
      })
    ) {
      return false;
    }
  }

  if (
    isDestructiveMultiStepPlan(input.subIntents) &&
    hasMutatingMultiStepStep(input.subIntents)
  ) {
    return false;
  }

  return true;
}

export function buildMultiStepBlastRadiusGate(input: {
  parentAction: 'goal_execution' | 'compound_intent';
  prompt: string;
  subIntents: readonly { action: string; params: Record<string, unknown> }[];
  mergedPlan: AgentPlan;
  session?: { context?: Record<string, unknown> };
  pipelineTrace?: import('./command-completion.types.js').PipelineTrace[];
}): CommandResult | null {
  const confirmed =
    isExecutionConfirmed(input.session) ||
    isBlastRadiusConfirmed(input.session?.context);
  if (confirmed) return null;

  const assessment = evaluateMultiStepBlastRadius({
    subIntents: input.subIntents,
    mergedPlan: input.mergedPlan,
  });
  if (!assessment.exceedsCap) return null;

  const result = buildBlastRadiusConfirmResult({
    prompt: input.prompt,
    action: input.parentAction,
    params: {},
    assessment,
    reasoning: `Multi-step plan exceeds safe limits across ${input.subIntents.length} steps.`,
  });

  return {
    ...result,
    action: input.parentAction,
    details: {
      ...result.details,
      multiStepBlastRadius: true,
      multiStepPlan: true,
      planStepPreview: buildPlanStepPreviewRows(input.subIntents),
      permissionCheckedSteps: input.subIntents.map((step) => step.action),
      pipelineStage: 'clarify',
      ...(input.pipelineTrace ? { pipelineTrace: input.pipelineTrace } : {}),
    },
  };
}

export function buildMultiStepDryRunSummary(
  assessment: MultiStepDryRunAssessment,
  stepCount: number,
): string {
  if (assessment.reason === 'propose_only_step') {
    const labels = assessment.proposeOnlySteps
      .map((action) => action.replace(/_/g, ' '))
      .join(', ');
    return `This ${stepCount}-step plan includes actions still in propose-only mode (${labels}). Review the full step list and approve the workflow plan to execute.`;
  }
  if (assessment.reason === 'destructive_multi_step') {
    return `This ${stepCount}-step plan includes destructive changes across multiple steps. Review the full plan in dry-run mode and approve before executing.`;
  }
  return `This multi-step plan requires review before execution. Approve the workflow plan to proceed.`;
}

export function buildMultiStepDryRunGate(input: {
  parentAction: 'goal_execution' | 'compound_intent';
  prompt: string;
  subIntents: readonly {
    action: string;
    params?: Record<string, unknown>;
    reasoning?: string;
  }[];
  mergedPlan: AgentPlan;
  autoExecuteRequested: boolean;
  planApproved?: boolean;
  intentTraffic?: Record<string, IntentTrafficMetrics>;
  pipelineTrace?: import('./command-completion.types.js').PipelineTrace[];
  goalRecipeId?: string;
}): CommandResult | null {
  const dryRun = assessMultiStepDryRun({
    parentAction: input.parentAction,
    subIntents: input.subIntents,
    intentTraffic: input.intentTraffic,
    autoExecuteRequested: input.autoExecuteRequested,
    planApproved: input.planApproved,
  });
  if (!dryRun.required) return null;

  const stepRows = buildPlanStepPreviewRows(input.subIntents);
  const primaryStatus =
    dryRun.graduationStatuses.find((status) => status.proposeOnly) ??
    dryRun.graduationStatuses[0];

  return {
    success: true,
    action: input.parentAction,
    summary: buildMultiStepDryRunSummary(dryRun, input.subIntents.length),
    details: {
      requiresApproval: true,
      proposeOnly: true,
      dryRun: true,
      multiStepDryRun: true,
      multiStepPlan: true,
      destructiveMultiStep: dryRun.reason === 'destructive_multi_step',
      dryRunReason: dryRun.reason,
      proposeOnlySteps: dryRun.proposeOnlySteps,
      destructiveSteps: dryRun.destructiveSteps,
      confirmationPrompt: input.prompt,
      plan: input.mergedPlan,
      unifiedPreview: true,
      planStepPreview: stepRows,
      stepLabels: stepRows.map((row: PlanStepPreviewRow) => row.label),
      permissionCheckedSteps: input.subIntents.map((step) => step.action),
      graduationStatus: primaryStatus,
      goalExecution: input.parentAction === 'goal_execution',
      goalRecipeId: input.goalRecipeId,
      pipelineStage: 'plan',
      ...(input.pipelineTrace ? { pipelineTrace: input.pipelineTrace } : {}),
    },
  };
}

export function enrichMultiStepSafetyDetails(
  details: Record<string, unknown>,
  input: {
    subIntents: readonly { action: string; params?: Record<string, unknown> }[];
    mergedPlan: AgentPlan;
    parentAction: string;
    sessionContext?: Record<string, unknown>;
    autoExecuteRequested: boolean;
    planApproved?: boolean;
  },
): Record<string, unknown> {
  const blastRadius = evaluateMultiStepBlastRadius({
    subIntents: input.subIntents.map((step) => ({
      action: step.action,
      params: step.params ?? {},
    })),
    mergedPlan: input.mergedPlan,
  });
  const dryRun = assessMultiStepDryRun({
    parentAction: input.parentAction,
    subIntents: input.subIntents,
    intentTraffic: input.sessionContext?._intentTraffic as
      | Record<string, IntentTrafficMetrics>
      | undefined,
    thresholds: resolveGraduationThresholdsFromContext(input.sessionContext),
    autoExecuteRequested: input.autoExecuteRequested,
    planApproved: input.planApproved,
  });

  return {
    ...details,
    multiStepPlan: true,
    multiStepBlastRadius: blastRadius,
    blastRadius,
    multiStepDryRun: dryRun.required,
    dryRunReason: dryRun.reason,
    proposeOnlySteps: dryRun.proposeOnlySteps,
    destructiveSteps: dryRun.destructiveSteps,
    destructiveMultiStep: isDestructiveMultiStepPlan(input.subIntents),
    dryRun: dryRun.required || details.dryRun === true,
    proposeOnly: dryRun.required || details.proposeOnly === true,
  };
}

export function assertMultiStepSafetyProbes(): MultiStepSafetyStatus {
  const errors: string[] = [];

  for (const probe of MULTI_STEP_SAFETY_PROBES) {
    const mergedPlan = {
      steps: probe.steps.flatMap((step, index) => [
        {
          id: `s${index + 1}`,
          action:
            step.action === 'cancel_bookings'
              ? 'cancel_bookings'
              : step.action === 'hide_appointments_from_calendar'
                ? 'hide_appointments_from_calendar'
                : step.action,
          description: step.reasoning,
          params: step.params,
          dependsOn: [],
        },
      ]),
    } as unknown as AgentPlan;

    const blastGate = buildMultiStepBlastRadiusGate({
      parentAction: probe.parentAction,
      prompt: 'multi-step safety probe',
      subIntents: probe.steps,
      mergedPlan,
    });
    if (probe.expectBlastGate && !blastGate) {
      errors.push(`${probe.id}: expected blast-radius gate`);
    }
    if (!probe.expectBlastGate && blastGate) {
      errors.push(`${probe.id}: unexpected blast-radius gate`);
    }

    const dryRun = assessMultiStepDryRun({
      parentAction: probe.parentAction,
      subIntents: probe.steps,
      autoExecuteRequested: true,
    });
    if (dryRun.required !== probe.expectDryRun) {
      errors.push(
        `${probe.id}: expected dryRun=${probe.expectDryRun}, got ${dryRun.required}`,
      );
    }
    if (
      probe.proposeOnlyStep &&
      !dryRun.proposeOnlySteps.includes(probe.proposeOnlyStep)
    ) {
      errors.push(
        `${probe.id}: expected propose-only step ${probe.proposeOnlyStep}`,
      );
    }
  }

  const destructive = isDestructiveMultiStepPlan(
    MULTI_STEP_SAFETY_PROBES[2].steps,
  );
  if (!destructive) {
    errors.push('destructive multi-step probe must be flagged destructive');
  }

  if (!requiresProposeOnlyExecution('payment_sweep', undefined)) {
    errors.push('payment_sweep must be propose-only without traffic');
  }

  return {
    complete: errors.length === 0,
    errors,
    probesChecked: MULTI_STEP_SAFETY_PROBES.length + 1,
  };
}

export function formatMultiStepSafetyReport(status: MultiStepSafetyStatus): string {
  const lines = [
    'AI Multi-Step Safety (parity-3.6)',
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
