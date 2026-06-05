import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import { buildPolicyRiskExplain, type PolicyPreviewLike } from './policy-risk-explain.util.js';
import {
  buildWizardSteps,
  shouldUseWizardMode,
  type WizardPlanStep,
} from './ai-wizard.util.js';

export type ExecutionTimelineEntry = {
  stepId: string;
  description: string;
  status: string;
  error?: string;
  canRetry?: boolean;
};

export type ApprovalAlertPayload = {
  alertType: 'conflict' | 'approval' | 'report';
  title: string;
  message: string;
  prompt?: string;
  taskId: string;
  route: string;
};

export function mapExecutionTimeline(task: {
  result?: { steps?: Array<{ stepId: string; status: string; error?: string }> };
  plan?: { steps?: Array<{ id: string; description?: string }> };
}): ExecutionTimelineEntry[] | undefined {
  const steps = task.result?.steps;
  if (!Array.isArray(steps) || steps.length === 0) return undefined;
  return steps.map((s) => {
    const planStep = task.plan?.steps?.find((p) => p.id === s.stepId);
    return {
      stepId: s.stepId,
      description: planStep?.description ?? s.stepId,
      status: s.status,
      error: s.error,
      canRetry: s.status === 'failed',
    };
  });
}

export function buildPendingApprovalDetails(input: {
  action: string;
  taskId: string;
  status: string;
  plan?: AgentPlan;
  planDiff?: WizardPlanStep[];
  policyPreview?: PolicyPreviewLike;
  employeeCount?: number;
  daySpan?: number;
}): Record<string, unknown> {
  const policyExplain = buildPolicyRiskExplain({
    policyPreview: input.policyPreview,
    plan: input.plan,
    employeeCount: input.employeeCount,
    daySpan: input.daySpan ?? 7,
  });
  const wizardMode = shouldUseWizardMode(input.action, input.planDiff);
  const wizardSteps = wizardMode && input.planDiff ? buildWizardSteps(input.planDiff) : undefined;

  return {
    taskId: input.taskId,
    status: input.status,
    plan: input.plan,
    requiresApproval: true,
    planDiff: input.planDiff,
    policyPreview: input.policyPreview,
    policyExplain,
    wizardMode,
    wizardSteps,
  };
}

export function buildApprovalAlertPayload(
  action: string,
  taskId: string,
  stepCount: number,
): ApprovalAlertPayload {
  const isConflict = action === 'resolve_conflicts';
  return {
    alertType: isConflict ? 'conflict' : 'approval',
    title: isConflict ? 'Scheduling conflict detected' : 'AI plan needs approval',
    message: isConflict
      ? 'Review conflicts and apply fixes from AI Ops.'
      : `Orchestrix prepared a ${stepCount}-step plan that requires your approval.`,
    prompt: isConflict ? 'Resolve scheduling conflicts this week' : undefined,
    taskId,
    route: '/dashboard/ai-ops',
  };
}
