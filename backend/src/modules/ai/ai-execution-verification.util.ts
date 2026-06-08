import type { CommandResult } from './command-completion.types.js';
import type { ResolvedCommand } from './command-completion.types.js';
import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import { PLAN_STALE_TTL_MS } from './ai-execution-verification.fixtures.js';
import { buildBlastRadiusCapGateResult } from './ai-blast-radius-cap.util.js';
import type { IntentTrafficMetrics } from './ai-intent-graduation.util.js';
import {
  buildResolutionClarifyResult,
  verifyResolutionConfidence,
  type ResolutionVerificationIssue,
  type ResolutionVerificationResult,
} from './ai-resolution-accuracy-guard.util.js';
import {
  buildPlanVsPromptGateResult,
} from './ai-plan-vs-prompt-check.util.js';
import {
  needsMutationPreviewDiff,
  buildMutationPreviewDiffResult,
} from './ai-mutation-preview-diff.util.js';
import { buildSyncExecuteRevalidationGate } from './ai-execute-idempotency.util.js';

export {
  BLAST_RADIUS_CAPS,
  BLAST_RADIUS_EXECUTE_SCENARIOS,
  BLAST_RADIUS_PARAM_SCENARIOS,
  BLAST_RADIUS_PLAN_SCENARIOS,
  assessBlastRadius,
  buildBlastRadiusCapGateResult,
  buildBlastRadiusConfirmResult,
  buildBlastRadiusExecuteSummary,
  evaluateBlastRadius,
  evaluateBlastRadiusFromParams,
  evaluateBlastRadiusFromPlan,
  isBlastRadiusConfirmed,
  validateBlastRadiusAtExecute,
  type BlastRadiusAssessment,
  type BlastRadiusExecuteValidation,
} from './ai-blast-radius-cap.util.js';

export {
  buildIntentGraduationStatus,
  buildIntentTrafficFromCommandMetrics,
  buildIntentTrafficFromTraceAnalytics,
  buildProposeOnlyResult,
  buildProposeOnlySummary,
  isIntentGraduatedForAutoExecute,
  readIntentTrafficFromContext,
  requiresProposeOnlyExecution,
  resolveGraduationThresholdsFromContext,
  resolveGraduatedAutoExecute,
  resolveIntentGraduationThresholds,
  resolveIntentTrafficMetrics,
  shouldForcePlanApprovalForIntent,
  validateIntentGraduationAtExecute,
  type IntentGraduationStatus,
  type IntentGraduationThresholds,
  type IntentTrafficMetrics,
} from './ai-intent-graduation.util.js';

export {
  BLAST_RADIUS_CAPS as BLAST_RADIUS_CAPS_FIXTURE,
  INTENT_GRADUATION_ACCURACY,
  INTENT_GRADUATION_MIN_SAMPLES,
  INTENT_GRADUATION_SCENARIOS,
  MEDIUM_RISK_PREVIEW_ACTIONS,
  PLAN_STALE_TTL_MS,
  PROPOSE_ONLY_UNTIL_GRADUATED,
} from './ai-execution-verification.fixtures.js';

export type { BlastRadiusScenario } from './ai-execution-verification.fixtures.js';

export { RESOLUTION_CONFIDENCE_THRESHOLD } from './ai-resolution-accuracy-guard.fixtures.js';

export type {
  ResolutionVerificationIssue,
  ResolutionVerificationResult,
} from './ai-resolution-accuracy-guard.util.js';

export {
  buildResolutionClarifyResult,
  verifyResolutionConfidence,
} from './ai-resolution-accuracy-guard.util.js';

export {
  buildPlanMismatchSummary,
  buildPlanVsPromptClarifyResult,
  buildPlanVsPromptGateResult,
  verifyPlanMatchesPrompt,
  type PlanVerificationResult,
} from './ai-plan-vs-prompt-check.util.js';

export interface ExecutionVerificationInput {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  enrichedParams: Record<string, unknown>;
  resolved?: ResolvedCommand;
  confidence?: number;
  sessionContext?: Record<string, unknown>;
  confirmed?: boolean;
  intentTraffic?: Record<string, IntentTrafficMetrics>;
  plan?: AgentPlan;
  planBuiltAt?: Date;
}

export {
  buildMutationPreviewDiffGateResult,
  buildMutationPreviewDiffResult,
  buildPlanDiffFromAgentPlan,
  describeMutationImpact,
  formatMutationStepDescription,
  needsMutationPreviewDiff,
  type PlanDiffStep,
} from './ai-mutation-preview-diff.util.js';

/** @deprecated alias */
export const needsMediumRiskPreview = needsMutationPreviewDiff;

/** @deprecated alias */
export const buildMediumRiskPreviewResult = buildMutationPreviewDiffResult;

export {
  applyPostExecAssertionToCommandResult,
  assertPostExecutionIntent,
  buildPostExecFailureSummary,
  buildPostExecRollbackDetails,
  extractExecutionPayload,
  shouldRunPostExecAssertion,
  type PostExecAssertionResult,
} from './ai-post-exec-assertion.util.js';

export {
  buildAutoRollbackUserSummary,
  buildPostExecFailureSummaryWithAutoRollback,
  extractAutoRollbackDetails,
  mergeAutoRollbackIntoResult,
  shouldAttemptAutoRollback,
  type AutoRollbackAttemptResult,
} from './ai-post-exec-auto-rollback.util.js';

export {
  buildExecuteRevalidationRejection,
  buildExecuteRevalidationSummary,
  buildSyncExecuteRevalidationGate,
  detectIntraPlanDuplicateMutations,
  extractPlanMutationSteps,
  isTaskAlreadyExecuted,
  revalidatePlanBeforeExecute,
  type ExecuteRevalidationIssue,
  type ExecuteRevalidationResult,
} from './ai-execute-idempotency.util.js';

/** acc-5.6 — stale plans must not auto-execute. */
export function isStaleExecutionPlan(
  planBuiltAt: Date | undefined,
  nowMs = Date.now(),
): boolean {
  if (!planBuiltAt) return false;
  return nowMs - planBuiltAt.getTime() > PLAN_STALE_TTL_MS;
}

export function buildStalePlanRejection(action: string): CommandResult {
  return {
    success: false,
    action,
    summary:
      'This plan is stale — please run the command again so I can re-check availability before executing.',
    details: {
      needsClarification: true,
      stalePlan: true,
      pipelineStage: 'validate',
    },
  };
}

/** Unified pre-execution gate (acc-5.1, 5.3, 5.7). Propose-only (acc-5.8) is enforced after plan build. */
export function buildExecutionVerificationGate(
  input: ExecutionVerificationInput,
): CommandResult | null {
  const executeGate = buildSyncExecuteRevalidationGate(
    input.plan,
    input.action,
    input.planBuiltAt,
  );
  if (executeGate) return executeGate;

  if (input.plan) {
    const planGate = buildPlanVsPromptGateResult({
      prompt: input.prompt,
      plan: input.plan,
      action: input.action,
    });
    if (planGate) return planGate;
  }

  if (input.resolved) {
    const resolution = verifyResolutionConfidence(input.resolved);
    if (!resolution.ok) {
      return buildResolutionClarifyResult(input.resolved, resolution);
    }
  }

  if (!input.confirmed) {
    const blastGate = buildBlastRadiusCapGateResult({
      prompt: input.prompt,
      action: input.action,
      params: input.enrichedParams,
      plan: input.plan,
      confirmed: input.confirmed,
      reasoning: input.resolved?.reasoning,
    });
    if (blastGate) return blastGate;
  }

  if (
    needsMutationPreviewDiff(
      input.action,
      input.confirmed ?? input.sessionContext?.confirmed === true,
    )
  ) {
    return buildMutationPreviewDiffResult({
      prompt: input.prompt,
      action: input.action,
      params: input.enrichedParams,
      reasoning: input.resolved?.reasoning,
      confirmed: input.confirmed ?? input.sessionContext?.confirmed === true,
    });
  }

  return null;
}
