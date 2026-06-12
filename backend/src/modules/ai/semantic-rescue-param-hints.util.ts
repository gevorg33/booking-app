import type { IntentRescueInput, IntentRescueResult } from './ai-intent-rescue.service.js';
import type { IntentCandidate } from './command-understanding.types.js';

/** pipe-1.5.2 — semantic winner feeds rescue param hints only (never action). */
export const SEMANTIC_RESCUE_PARAM_HINTS_MARKER = 'pipe-1.5.2';

/**
 * Merges semantic anchor hints into params without overwriting explicit values.
 * Rescue/domain params win on conflicts; hints fill gaps only.
 */
export function mergeSemanticParamHintsOnly(
  target: Record<string, unknown>,
  hints: Record<string, unknown>,
): Record<string, unknown> {
  if (Object.keys(hints).length === 0) return { ...target };

  const merged = { ...target };
  for (const [key, value] of Object.entries(hints)) {
    if (merged[key] === undefined) {
      merged[key] = value;
    }
  }
  return merged;
}

/** Highest-confidence semantic_match candidate from the understand pool. */
export function resolveSemanticWinnerCandidate(
  candidates: IntentCandidate[],
): IntentCandidate | null {
  let best: IntentCandidate | null = null;
  for (const candidate of candidates) {
    if (candidate.source !== 'semantic_match') continue;
    if (!best || candidate.confidence > best.confidence) {
      best = candidate;
    }
  }
  return best;
}

/** Param hints from the semantic winner — empty when no semantic candidate or hints. */
export function resolveSemanticWinnerParamHints(
  candidates: IntentCandidate[],
): Record<string, unknown> {
  const winner = resolveSemanticWinnerCandidate(candidates);
  if (!winner?.paramHints || Object.keys(winner.paramHints).length === 0) {
    return {};
  }
  return { ...winner.paramHints };
}

export function applySemanticParamHintsToRescueInput(
  input: IntentRescueInput,
): IntentRescueInput {
  const hints = input.semanticParamHints;
  if (!hints || Object.keys(hints).length === 0) return input;
  return {
    ...input,
    params: mergeSemanticParamHintsOnly(input.params ?? {}, hints),
  };
}

export function enrichRescueResultWithSemanticParamHints(
  result: IntentRescueResult | null,
  hints: Record<string, unknown> | undefined,
): IntentRescueResult | null {
  if (!result || !hints || Object.keys(hints).length === 0) return result;
  return {
    ...result,
    params: mergeSemanticParamHintsOnly(result.params ?? {}, hints),
  };
}
