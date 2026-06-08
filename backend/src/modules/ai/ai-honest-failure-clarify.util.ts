import type { CommandResult } from './command-completion.types.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import type { FieldLevelConfidence } from './ai-classification-engine.types.js';
import {
  HONEST_FAILURE_CONFIDENCE_THRESHOLD,
  type HonestFailureSurface,
  type HonestFailureSuggestion,
} from './ai-honest-failure-clarify.fixtures.js';
import { SMART_CLARIFY_MAX_ROUNDS } from './ai-smart-clarify.fixtures.js';
import { ESCALATION_HANDOFF_CLARIFY_ROUNDS } from './ai-escalation-handoff.fixtures.js';
import {
  pickSuggestedActionFallback,
  buildSuggestedActionFallbackClarifyResult,
} from './ai-suggested-action-fallback.util.js';

export const HONEST_FAILURE_SUMMARY =
  "I didn't fully understand — here's what I can help with. Pick one or rephrase:";

export interface HonestFailureClarifyInput {
  prompt: string;
  surface: ClassificationSurface;
  action: string;
  params: Record<string, unknown>;
  reasoning?: string;
  confidence?: number;
  fieldConfidence?: FieldLevelConfidence;
  sessionContext?: Record<string, unknown>;
  actionThreshold?: number;
  maxClarifyRounds?: number;
  shortlist?: string[];
}

export function readClarifyRound(sessionContext?: Record<string, unknown>): number {
  const ctx = sessionContext?._clarifyContext as { clarifyRound?: number } | undefined;
  return typeof ctx?.clarifyRound === 'number' ? ctx.clarifyRound : 0;
}

export function resolveHonestFailureSurface(
  surface: ClassificationSurface,
): HonestFailureSurface {
  if (surface === 'public') return 'public';
  if (surface === 'customer') return 'customer';
  if (surface === 'provider') return 'provider';
  return 'dashboard';
}

export function resolveEffectiveConfidence(input: HonestFailureClarifyInput): number {
  const fieldConfidence = input.params._fieldConfidence as FieldLevelConfidence | undefined;
  return input.confidence ?? fieldConfidence?.action ?? input.fieldConfidence?.action ?? 0;
}

export function isStillUncertainAfterClarify(input: HonestFailureClarifyInput): boolean {
  const threshold =
    input.actionThreshold ?? HONEST_FAILURE_CONFIDENCE_THRESHOLD;
  const confidence = resolveEffectiveConfidence(input);

  return (
    input.action === 'unknown' ||
    input.params._semanticClarify === true ||
    input.params._classificationNeedsClarify === true ||
    confidence < threshold
  );
}

export function hasExhaustedClarifyBudget(
  sessionContext?: Record<string, unknown>,
  maxRounds: number = SMART_CLARIFY_MAX_ROUNDS,
): boolean {
  return readClarifyRound(sessionContext) >= maxRounds;
}

export function shouldOfferHonestFailure(input: HonestFailureClarifyInput): boolean {
  const maxRounds = input.maxClarifyRounds ?? SMART_CLARIFY_MAX_ROUNDS;
  const round = readClarifyRound(input.sessionContext);
  if (round < maxRounds) return false;
  if (round >= ESCALATION_HANDOFF_CLARIFY_ROUNDS) return false;
  return isStillUncertainAfterClarify(input);
}

export function pickHonestFailureSuggestions(
  surface: ClassificationSurface,
  options?: {
    prompt?: string;
    shortlist?: string[];
    semanticCandidates?: Array<{ action: string; label?: string; prompt?: string }>;
  },
): HonestFailureSuggestion[] {
  return pickSuggestedActionFallback({
    surface,
    prompt: options?.prompt,
    shortlist: options?.shortlist,
    semanticCandidates: options?.semanticCandidates,
  });
}

export function buildHonestFailureClarifyResult(
  input: HonestFailureClarifyInput,
): CommandResult | null {
  const fallback = buildSuggestedActionFallbackClarifyResult(input, 'late');
  if (!fallback) return null;

  return {
    ...fallback,
    summary: HONEST_FAILURE_SUMMARY,
    details: {
      ...fallback.details,
      clarifySource: 'honest_failure',
      clarifyKind: 'honest_failure',
      honestFailure: {
        confidence: resolveEffectiveConfidence(input),
        clarifyRound: readClarifyRound(input.sessionContext),
      },
    },
  };
}
