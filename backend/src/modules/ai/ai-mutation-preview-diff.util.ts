import type { CommandResult } from './command-completion.types.js';
import { sanitizeParamsForPreview } from './ai-execution-confirm.util.js';
import { isHighRiskConfirmAction } from './ai-high-risk-confirm-clarify.util.js';
import { isRegistryMutating } from './ai-command-registry.util.js';
import {
  PARITY_26_CUSTOMER_PUBLIC_PREVIEW_EXEMPT,
  PARITY_26_PROVIDER_EPHEMERAL_MUTATIONS,
} from './ai-parity-2.6-read-mutate.fixtures.js';
import {
  buildMutationPreviewDiff,
  type PlanDiffStep,
} from './ai-plan-diff.util.js';
import { MEDIUM_RISK_PREVIEW_ACTIONS } from './ai-mutation-preview-diff.fixtures.js';

export { MEDIUM_RISK_PREVIEW_ACTIONS } from './ai-mutation-preview-diff.fixtures.js';
export type { PlanDiffStep } from './ai-plan-diff.util.js';
export {
  buildMutationPreviewDiff,
  buildPlanDiffFromAgentPlan,
  describeMutationImpact,
  formatMutationStepDescription,
} from './ai-plan-diff.util.js';

export interface MutationPreviewDiffInput {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  reasoning?: string;
  confirmed?: boolean;
}

/** acc-5.3 + parity-2.6 — ops mutations need calendar/catalog diff preview (high-risk uses plain confirm). */
export function needsMutationPreviewDiff(
  action: string,
  confirmed = false,
): boolean {
  if (confirmed || isHighRiskConfirmAction(action)) return false;
  if (
    PARITY_26_CUSTOMER_PUBLIC_PREVIEW_EXEMPT.has(action) ||
    PARITY_26_PROVIDER_EPHEMERAL_MUTATIONS.has(action)
  ) {
    return false;
  }
  if (MEDIUM_RISK_PREVIEW_ACTIONS.has(action)) return true;
  return isRegistryMutating(action);
}

/** @deprecated alias — acc-5.3 */
export const needsMediumRiskPreview = needsMutationPreviewDiff;

export function buildMutationPreviewDiffSteps(
  action: string,
  params: Record<string, unknown>,
): PlanDiffStep[] {
  return buildMutationPreviewDiff(action, params);
}

export function buildMutationPreviewDiffResult(
  input: MutationPreviewDiffInput,
): CommandResult {
  const planDiff = buildMutationPreviewDiffSteps(input.action, input.params);
  const previewParams = sanitizeParamsForPreview(input.params);
  const humanAction = input.action.replace(/_/g, ' ');

  return {
    success: true,
    action: input.action,
    summary: `Preview: this will ${humanAction}. Review the calendar/catalog diff below, then confirm to proceed.`,
    details: {
      requiresExecutionConfirmation: true,
      requiresPreviewDiff: true,
      clarifySource: 'mutation_preview_diff',
      confirmationPrompt: input.prompt,
      interpretedAction: input.action,
      previewParams,
      planDiff,
      reasoning: input.reasoning,
      pipelineStage: 'clarify',
    },
  };
}

/** @deprecated alias — acc-5.3 */
export const buildMediumRiskPreviewResult = buildMutationPreviewDiffResult;

export function buildMutationPreviewDiffGateResult(
  input: MutationPreviewDiffInput,
): CommandResult | null {
  if (!needsMutationPreviewDiff(input.action, input.confirmed)) return null;
  return buildMutationPreviewDiffResult(input);
}
