/** n99-2.8 — ambiguous/destructive still clarifies; never auto-guess on no-clarify path. */

import type { CommandResult } from './command-completion.types.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import { evaluateBlastRadiusFromParams } from './ai-blast-radius-cap.util.js';
import { buildHighRiskConfirmClarifyResult } from './ai-high-risk-confirm-clarify.util.js';
import { isHighRiskConfirmAction } from './ai-high-risk-confirm-clarify.util.js';
import { buildHonestFailureClarifyResult } from './ai-honest-failure-clarify.util.js';
import { buildSuggestedActionFallbackClarifyResult } from './ai-suggested-action-fallback.util.js';
import {
  N99_AMBIGUOUS_DESTRUCTIVE_SCENARIOS,
  type N99AmbiguousDestructiveScenario,
  type NoClarifyGuardReason,
} from './ai-n99-ambiguous-destructive-clarify.fixtures.js';

export {
  N99_AMBIGUOUS_DESTRUCTIVE_SCENARIOS,
  N99_NO_CLARIFY_GUARDRAIL_SCENARIOS,
} from './ai-n99-ambiguous-destructive-clarify.fixtures.js';
export type {
  N99AmbiguousDestructiveScenario,
  NoClarifyGuardReason,
} from './ai-n99-ambiguous-destructive-clarify.fixtures.js';

export const NO_CLARIFY_GUARDRAIL_CLARIFY_SOURCE = 'no_clarify_guardrail';

const SCOPED_DESTRUCTIVE_ACTIONS = new Set([
  'cancel_bookings',
  'cancel_booking',
  'mark_paid',
]);

function hasExplicitDestructiveScope(
  action: string,
  params: Record<string, unknown>,
): boolean {
  if (!SCOPED_DESTRUCTIVE_ACTIONS.has(action)) return false;
  if (typeof params.bookingId === 'string' && params.bookingId) return true;
  if (Array.isArray(params.bookingIds) && params.bookingIds.length > 0) {
    return true;
  }
  return false;
}

export interface NoClarifyGuardInput {
  action: string;
  actionConfidence?: number;
  params: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  surface?: ClassificationSurface;
}

export interface NoClarifyGuardrailClarifyInput extends NoClarifyGuardInput {
  prompt: string;
  surface: ClassificationSurface;
  reasoning?: string;
  shortlist?: string[];
}

/** n99-2.8 — never auto-guess destructive or low-confidence actions on the no-clarify path. */
export function shouldBlockNoClarifyExecution(
  input: NoClarifyGuardInput,
): { blocked: boolean; reason?: NoClarifyGuardReason } {
  const confidence = input.actionConfidence ?? 0.85;
  const confirmed = input.sessionContext?.confirmed === true;

  if (input.action === 'unknown') {
    return { blocked: true, reason: 'ambiguous_or_unknown' };
  }
  if (confidence < 0.65) {
    return { blocked: true, reason: 'low_action_confidence' };
  }
  if (!confirmed) {
    const blast = evaluateBlastRadiusFromParams(input.action, input.params);
    if (blast.exceedsCap) {
      return { blocked: true, reason: 'blast_radius_over_cap' };
    }
  }
  if (isHighRiskConfirmAction(input.action) && !confirmed) {
    if (confidence < 0.82 || input.params.allAppointments === true) {
      return { blocked: true, reason: 'high_risk_action' };
    }
    if (hasExplicitDestructiveScope(input.action, input.params)) {
      return { blocked: false };
    }
    return { blocked: true, reason: 'destructive_scope_unconfirmed' };
  }
  return { blocked: false };
}

/** @deprecated alias — n99-2.8 */
export const shouldBlockNoClarifyAutofill = shouldBlockNoClarifyExecution;

export function isNoClarifyGuardrailBlockReason(
  reason: string | undefined,
): reason is NoClarifyGuardReason {
  return (
    reason === 'ambiguous_or_unknown' ||
    reason === 'low_action_confidence' ||
    reason === 'high_risk_action' ||
    reason === 'destructive_scope_unconfirmed' ||
    reason === 'blast_radius_over_cap'
  );
}

function attachNoClarifyGuardrailMetadata(
  result: CommandResult,
  reason: NoClarifyGuardReason,
): CommandResult {
  return {
    ...result,
    details: {
      ...result.details,
      needsClarification: true,
      clarify: true,
      clarifySource: NO_CLARIFY_GUARDRAIL_CLARIFY_SOURCE,
      noClarifyGuardReason: reason,
      countsTowardClarifySuccess: true,
      pipelineStage: 'clarify',
    },
  };
}

/** Build clarify result for guardrail blocks — counts toward n99-1, not no-clarify failures. */
export function buildNoClarifyGuardrailClarifyResult(
  input: NoClarifyGuardrailClarifyInput,
  reason: NoClarifyGuardReason,
): CommandResult | null {
  if (
    reason === 'high_risk_action' ||
    reason === 'destructive_scope_unconfirmed' ||
    reason === 'blast_radius_over_cap'
  ) {
    const highRisk = buildHighRiskConfirmClarifyResult({
      prompt: input.prompt,
      action: input.action,
      params: input.params,
      reasoning: input.reasoning,
      sessionContext: input.sessionContext,
    });
    if (highRisk) {
      return attachNoClarifyGuardrailMetadata(highRisk, reason);
    }
  }

  if (reason === 'ambiguous_or_unknown') {
    const fallback = buildSuggestedActionFallbackClarifyResult({
      prompt: input.prompt,
      surface: input.surface,
      action: input.action,
      params: input.params,
      reasoning: input.reasoning,
      confidence: input.actionConfidence,
      sessionContext: input.sessionContext,
      shortlist: input.shortlist,
    });
    if (fallback) {
      return attachNoClarifyGuardrailMetadata(fallback, reason);
    }
  }

  const honest = buildHonestFailureClarifyResult({
    prompt: input.prompt,
    surface: input.surface,
    action: input.action,
    params: input.params,
    reasoning: input.reasoning,
    confidence: input.actionConfidence,
    sessionContext: input.sessionContext,
    shortlist: input.shortlist,
  });
  if (honest) {
    return attachNoClarifyGuardrailMetadata(honest, reason);
  }

  return {
    success: false,
    action: input.action,
    summary: 'I need a bit more detail before I can do that safely.',
    details: {
      needsClarification: true,
      clarify: true,
      clarifySource: NO_CLARIFY_GUARDRAIL_CLARIFY_SOURCE,
      noClarifyGuardReason: reason,
      countsTowardClarifySuccess: true,
      partialParams: input.params,
      pipelineStage: 'clarify',
    },
  };
}

/** n99-2.8 — resolve guard + clarify in one step for smart-clarify early phase. */
export function resolveNoClarifyGuardrailClarify(
  input: NoClarifyGuardrailClarifyInput,
): CommandResult | null {
  const guard = shouldBlockNoClarifyExecution(input);
  if (!guard.blocked || !guard.reason) return null;
  return buildNoClarifyGuardrailClarifyResult(input, guard.reason);
}

export function evaluateAmbiguousDestructiveScenario(
  scenario: N99AmbiguousDestructiveScenario,
): { passed: boolean; errors: string[] } {
  const guard = shouldBlockNoClarifyExecution({
    action: scenario.action,
    actionConfidence: scenario.actionConfidence,
    params: scenario.params,
    sessionContext: scenario.sessionContext,
    surface: scenario.surface,
  });
  const errors: string[] = [];

  if (guard.blocked !== scenario.expectBlocked) {
    errors.push(
      `blocked: expected ${scenario.expectBlocked}, got ${guard.blocked}`,
    );
  }
  if (scenario.expectBlockReason && guard.reason !== scenario.expectBlockReason) {
    errors.push(
      `reason: expected ${scenario.expectBlockReason}, got ${guard.reason ?? 'none'}`,
    );
  }

  if (scenario.expectClarify && guard.blocked && guard.reason) {
    const clarify = buildNoClarifyGuardrailClarifyResult(
      {
        prompt: scenario.prompt,
        action: scenario.action,
        params: scenario.params,
        surface: scenario.surface ?? 'dashboard',
        actionConfidence: scenario.actionConfidence,
        sessionContext: scenario.sessionContext,
      },
      guard.reason,
    );
    if (!clarify) {
      errors.push('clarify: expected guardrail clarify result');
    } else if (clarify.details?.clarifySource !== NO_CLARIFY_GUARDRAIL_CLARIFY_SOURCE) {
      errors.push('clarify: expected no_clarify_guardrail source');
    } else if (
      scenario.expectCountsTowardClarifySuccess &&
      clarify.details?.countsTowardClarifySuccess !== true
    ) {
      errors.push('clarify: expected countsTowardClarifySuccess');
    }
  }

  return { passed: errors.length === 0, errors };
}
