import {
  AGENT_NON_UNDOABLE_ACTIONS,
  AGENT_UNDOABLE_ACTIONS,
} from '../../engine/agent/agent-task-undo.service.js';
import type { AgentPlanStep } from '../../engine/agent/interfaces/agent.interfaces.js';
import { GOAL_STEP_INTENT_LABELS } from './ai-goal-execution.fixtures.js';
import { isRegistryMutating } from './ai-command-registry.util.js';
import type { CommandResult } from './command-completion.types.js';
import { sanitizeParamsForPreview } from './ai-execution-confirm.util.js';
import {
  ATOMIC_ROLLBACK_BLOCKED_PROBE,
  ATOMIC_ROLLBACK_UNDOABLE_PROBE,
  MULTI_STEP_INTENT_LABELS,
  PLAN_PREVIEW_ROLLBACK_PROBES,
  type PlanPreviewRollbackProbe,
} from './ai-plan-preview-rollback.fixtures.js';

export {
  ATOMIC_ROLLBACK_BLOCKED_PROBE,
  ATOMIC_ROLLBACK_UNDOABLE_PROBE,
  MULTI_STEP_INTENT_LABELS,
  PLAN_PREVIEW_ROLLBACK_PROBES,
  type PlanPreviewRollbackProbe,
} from './ai-plan-preview-rollback.fixtures.js';

export interface PlanStepPreviewRow {
  index: number;
  action: string;
  label: string;
  paramSummary?: string;
}

export interface AtomicRollbackAssessment {
  supported: boolean;
  undoable: boolean;
  reason?: string;
  reversibleActions: string[];
  blockedActions: string[];
  workflowLogUndo: true;
}

export interface PlanPreviewRollbackStatus {
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

export function formatMultiStepIntentLabel(action: string): string {
  return (
    MULTI_STEP_INTENT_LABELS[action] ??
    GOAL_STEP_INTENT_LABELS[action] ??
    action.replace(/_/g, ' ')
  );
}

function formatParamSummary(params: Record<string, unknown>): string | undefined {
  const preview = sanitizeParamsForPreview(params);
  const parts = Object.entries(preview).map(([key, value]) => {
    const rendered = Array.isArray(value) ? value.join(', ') : String(value);
    return `${key}: ${rendered}`;
  });
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function buildPlanStepPreviewRows(
  steps: readonly {
    action: string;
    params?: Record<string, unknown>;
  }[],
): PlanStepPreviewRow[] {
  return steps.map((step, index) => ({
    index: index + 1,
    action: step.action,
    label: formatMultiStepIntentLabel(step.action),
    paramSummary: step.params ? formatParamSummary(step.params) : undefined,
  }));
}

export function hasMutatingMultiStep(
  steps: readonly { action: string }[],
): boolean {
  return steps.some(
    (step) =>
      isRegistryMutating(step.action) &&
      !READ_ONLY_COMPOUND_ACTIONS.has(step.action),
  );
}

/** parity-3.5 — multi-step mutate plans need unified preview before execute. */
export function needsMultiStepPlanPreview(
  steps: readonly { action: string }[],
  confirmed: boolean,
): boolean {
  if (confirmed || steps.length < 2) return false;
  return hasMutatingMultiStep(steps);
}

export function buildMultiStepPlanPreviewSummary(
  stepRows: readonly PlanStepPreviewRow[],
  totalSteps: number,
): string {
  const lines = stepRows.map((row) => {
    const detail = row.paramSummary ? ` (${row.paramSummary})` : '';
    return `${row.index}. ${row.label}${detail}`;
  });
  return [
    `Ready to run ${totalSteps} steps:`,
    ...lines,
    'Confirm below to execute the full plan. You can undo the whole workflow from the execution log afterward.',
  ].join('\n');
}

export function buildMultiStepPlanPreviewDetails(input: {
  parentAction: 'goal_execution' | 'compound_intent';
  prompt: string;
  steps: readonly {
    action: string;
    params?: Record<string, unknown>;
    reasoning?: string;
  }[];
  goalRecipeId?: string;
  atomicRollback?: AtomicRollbackAssessment;
}): Record<string, unknown> {
  const stepRows = buildPlanStepPreviewRows(input.steps);
  return {
    unifiedPreview: true,
    planStepPreview: stepRows,
    permissionCheckedSteps: input.steps.map((step) => step.action),
    stepLabels: stepRows.map((row) => row.label),
    requiresExecutionConfirmation: true,
    confirmationPrompt: input.prompt,
    goalExecution: input.parentAction === 'goal_execution',
    goalRecipeId: input.goalRecipeId,
    decomposed: true,
    pipelineStage: 'preview',
    atomicRollback: true,
    atomicRollbackSupported: input.atomicRollback?.supported ?? false,
    atomicRollbackReason: input.atomicRollback?.reason,
    undoable: input.atomicRollback?.undoable ?? false,
    reversibleStepActions: input.atomicRollback?.reversibleActions ?? [],
    blockedUndoActions: input.atomicRollback?.blockedActions ?? [],
    workflowLogUndo: true,
  };
}

/** parity-3.5 — assess one-tap undo for merged workflow execution log (ai-d7). */
export function assessAtomicRollbackSupport(
  agentSteps: readonly Pick<AgentPlanStep, 'action'>[],
): AtomicRollbackAssessment {
  const mutating = agentSteps.filter(
    (step) => !READ_ONLY_COMPOUND_ACTIONS.has(step.action),
  );
  const blocked = mutating
    .map((step) => step.action)
    .filter((action) => AGENT_NON_UNDOABLE_ACTIONS.has(action));
  const reversible = mutating
    .map((step) => step.action)
    .filter((action) => AGENT_UNDOABLE_ACTIONS.has(action));

  if (mutating.length === 0) {
    return {
      supported: false,
      undoable: false,
      reason: 'This plan makes no changes that can be reversed',
      reversibleActions: [],
      blockedActions: [],
      workflowLogUndo: true,
    };
  }

  if (blocked.length > 0) {
    const labels = [...new Set(blocked)].join(', ');
    return {
      supported: false,
      undoable: false,
      reason: `Undo is not supported for: ${labels}`,
      reversibleActions: reversible,
      blockedActions: blocked,
      workflowLogUndo: true,
    };
  }

  if (reversible.length === 0) {
    return {
      supported: false,
      undoable: false,
      reason: 'This plan has no supported undo actions',
      reversibleActions: [],
      blockedActions: [],
      workflowLogUndo: true,
    };
  }

  return {
    supported: true,
    undoable: true,
    reversibleActions: reversible,
    blockedActions: [],
    workflowLogUndo: true,
  };
}

export function buildMultiStepPlanPreviewResult(input: {
  parentAction: 'goal_execution' | 'compound_intent';
  prompt: string;
  steps: readonly {
    action: string;
    params?: Record<string, unknown>;
    reasoning?: string;
  }[];
  pipelineTrace?: import('./command-completion.types.js').PipelineTrace[];
  goalRecipeId?: string;
  atomicRollback?: AtomicRollbackAssessment;
}): CommandResult {
  const stepRows = buildPlanStepPreviewRows(input.steps);
  const details = buildMultiStepPlanPreviewDetails({
    parentAction: input.parentAction,
    prompt: input.prompt,
    steps: input.steps,
    goalRecipeId: input.goalRecipeId,
    atomicRollback: input.atomicRollback,
  });

  return {
    success: true,
    action: input.parentAction,
    summary: buildMultiStepPlanPreviewSummary(stepRows, input.steps.length),
    details: {
      ...details,
      ...(input.pipelineTrace ? { pipelineTrace: input.pipelineTrace } : {}),
    },
  };
}

/** parity-3.5 — gate execution until user confirms the full multi-step preview. */
export function buildMultiStepExecutionPreviewGate(input: {
  parentAction: 'goal_execution' | 'compound_intent';
  prompt: string;
  subIntents: readonly {
    action: string;
    params?: Record<string, unknown>;
    reasoning?: string;
  }[];
  mergedAgentSteps: readonly Pick<AgentPlanStep, 'action'>[];
  confirmed: boolean;
  pipelineTrace?: import('./command-completion.types.js').PipelineTrace[];
  goalDetails?: Record<string, unknown>;
}): CommandResult | null {
  if (!needsMultiStepPlanPreview(input.subIntents, input.confirmed)) {
    return null;
  }

  const atomicRollback = assessAtomicRollbackSupport(input.mergedAgentSteps);
  return buildMultiStepPlanPreviewResult({
    parentAction: input.parentAction,
    prompt: input.prompt,
    steps: input.subIntents,
    pipelineTrace: input.pipelineTrace,
    goalRecipeId:
      typeof input.goalDetails?.goalRecipeId === 'string'
        ? input.goalDetails.goalRecipeId
        : undefined,
    atomicRollback,
  });
}

export function enrichMultiStepExecutionRollbackDetails(
  details: Record<string, unknown>,
  input: {
    mergedAgentSteps: readonly Pick<AgentPlanStep, 'action'>[];
    taskId?: string;
  },
): Record<string, unknown> {
  const atomicRollback = assessAtomicRollbackSupport(input.mergedAgentSteps);
  return {
    ...details,
    taskId: input.taskId ?? details.taskId,
    atomicRollback: true,
    atomicRollbackSupported: atomicRollback.supported,
    atomicRollbackReason: atomicRollback.reason,
    undoable: atomicRollback.undoable,
    reversibleStepActions: atomicRollback.reversibleActions,
    blockedUndoActions: atomicRollback.blockedActions,
    workflowLogUndo: true,
  };
}

export function assertPlanPreviewRollbackProbes(): PlanPreviewRollbackStatus {
  const errors: string[] = [];

  for (const probe of PLAN_PREVIEW_ROLLBACK_PROBES) {
    const needsPreview = needsMultiStepPlanPreview(probe.steps, probe.confirmed);
    if (needsPreview !== probe.expectsPreview) {
      errors.push(
        `${probe.id}: expected needsPreview=${probe.expectsPreview}, got ${needsPreview}`,
      );
      continue;
    }
    if (probe.expectsPreview) {
      const preview = buildMultiStepPlanPreviewResult({
        parentAction: 'compound_intent',
        prompt: 'preview probe',
        steps: probe.steps,
        atomicRollback: assessAtomicRollbackSupport(
          probe.steps.map((step) => ({ action: step.action })),
        ),
      });
      if (!preview.details.requiresExecutionConfirmation) {
        errors.push(`${probe.id}: expected requiresExecutionConfirmation`);
      }
      if (!preview.details.unifiedPreview) {
        errors.push(`${probe.id}: expected unifiedPreview`);
      }
      const rows = preview.details.planStepPreview as PlanStepPreviewRow[] | undefined;
      if (!rows || rows.length < (probe.minPreviewSteps ?? 2)) {
        errors.push(`${probe.id}: expected planStepPreview rows`);
      }
    }
  }

  const undoable = assessAtomicRollbackSupport(
    ATOMIC_ROLLBACK_UNDOABLE_PROBE.agentSteps,
  );
  if (undoable.supported !== ATOMIC_ROLLBACK_UNDOABLE_PROBE.expectsSupported) {
    errors.push(`${ATOMIC_ROLLBACK_UNDOABLE_PROBE.id}: expected undoable plan`);
  }

  const blocked = assessAtomicRollbackSupport(
    ATOMIC_ROLLBACK_BLOCKED_PROBE.agentSteps,
  );
  if (blocked.supported !== ATOMIC_ROLLBACK_BLOCKED_PROBE.expectsSupported) {
    errors.push(`${ATOMIC_ROLLBACK_BLOCKED_PROBE.id}: expected blocked atomic undo`);
  }
  if (!blocked.blockedActions.includes(ATOMIC_ROLLBACK_BLOCKED_PROBE.blockedAction)) {
    errors.push(
      `${ATOMIC_ROLLBACK_BLOCKED_PROBE.id}: expected blocked ${ATOMIC_ROLLBACK_BLOCKED_PROBE.blockedAction}`,
    );
  }

  return {
    complete: errors.length === 0,
    errors,
    probesChecked: PLAN_PREVIEW_ROLLBACK_PROBES.length + 2,
  };
}

export function formatPlanPreviewRollbackReport(
  status: PlanPreviewRollbackStatus,
): string {
  const lines = [
    'AI Plan Preview + Atomic Rollback (parity-3.5)',
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
