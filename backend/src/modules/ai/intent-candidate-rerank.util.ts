import type { ClassifiedIntent } from './ai-command-routing.util.js';
import type { IntentRescueResult } from './ai-intent-rescue.service.js';
import type { IntentCandidate } from './command-understanding.types.js';
import type { SemanticIntentMatch } from './ai-semantic-intent.types.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { FAST_HEURISTIC_RERANK_MIN_CONFIDENCE } from './fast-intent-heuristics.util.js';

export const DEFAULT_RERANK_RUNNER_UP_MARGIN = 0.08;

/** pipe-1.4.5 — merge classifier + semantic + heuristic before re-rank. */
export const MERGE_RERANK_PIPE_MARKER = 'pipe-1.4.5';

export type MergeIntentCandidateSourcesInput = {
  heuristics?: IntentCandidate[];
  classifier?: IntentCandidate | null;
  semantic?: IntentCandidate | null;
};

export interface MergedRerankResult {
  /** Phase-1 policy winner (may defer fast_heuristic). */
  winner: IntentCandidate;
  /** Highest-confidence row before phase-1 policy. */
  rawWinner: IntentCandidate;
  ranked: IntentCandidate[];
  ambiguous: boolean;
  merged: IntentCandidate[];
  eligible: IntentCandidate[];
}

/** True when a candidate may participate in the re-rank pool (pipe-1.2.2). */
export function isRerankEligibleCandidate(candidate: IntentCandidate): boolean {
  if (candidate.source !== 'fast_heuristic') return true;
  return candidate.confidence >= FAST_HEURISTIC_RERANK_MIN_CONFIDENCE;
}

export function filterRerankEligibleCandidates(
  candidates: IntentCandidate[],
): IntentCandidate[] {
  return candidates.filter(isRerankEligibleCandidate);
}

/**
 * Phase 1: fast heuristics feed re-rank but cannot beat a resolved classifier/
 * semantic/rescue candidate. Unknown classifier rows defer to heuristic winner
 * (pipe-1.2.2 — do not bypass LLM classify when it returned a real action).
 */
export function pickPhase1RerankWinner(
  rerank: RerankIntentCandidatesResult,
): IntentCandidate {
  const preferred = rerank.ranked.find(
    (candidate) =>
      candidate.source !== 'fast_heuristic' && candidate.action !== 'unknown',
  );
  return preferred ?? rerank.winner;
}

export function semanticMatchToCandidate(
  match: SemanticIntentMatch,
): IntentCandidate {
  return {
    action: match.action,
    confidence: match.confidence,
    source: 'semantic_match',
    paramHints: match.paramHints,
    reasoning: match.reasoning,
    anchorId: match.anchorId,
    rescueReason: match.rescueReason,
  };
}

export function rescueResultToCandidate(
  result: IntentRescueResult,
  priorConfidence = 0.85,
): IntentCandidate {
  return {
    action: result.action,
    confidence: priorConfidence,
    source: 'rescue',
    params: result.params,
    reasoning: result.reasoning,
    rescueReason: result.rescueReason,
  };
}

export interface RerankIntentCandidatesResult {
  winner: IntentCandidate;
  ranked: IntentCandidate[];
  /** Top two actions differ and scores are within margin. */
  ambiguous: boolean;
}

/** Merges producer pools from fast heuristics, classifier, and semantic match (pipe-1.4.5). */
export function mergeIntentCandidateSources(
  input: MergeIntentCandidateSourcesInput,
): IntentCandidate[] {
  const merged: IntentCandidate[] = [];
  if (input.heuristics?.length) merged.push(...input.heuristics);
  if (input.classifier) merged.push(input.classifier);
  if (input.semantic) merged.push(input.semantic);
  return merged;
}

/** Filters then scores merged candidates; applies phase-1 winner policy. */
export function mergeAndRerankIntentCandidates(
  candidates: IntentCandidate[],
  options?: { runnerUpMargin?: number },
): MergedRerankResult | null {
  const eligible = filterRerankEligibleCandidates(candidates);
  const rerank = rerankIntentCandidates(eligible, options);
  if (!rerank) return null;

  return {
    winner: pickPhase1RerankWinner(rerank),
    rawWinner: rerank.winner,
    ranked: rerank.ranked,
    ambiguous: rerank.ambiguous,
    merged: candidates,
    eligible,
  };
}

export function rerankIntentCandidates(
  candidates: IntentCandidate[],
  options?: { runnerUpMargin?: number },
): RerankIntentCandidatesResult | null {
  if (candidates.length === 0) return null;

  const margin = options?.runnerUpMargin ?? DEFAULT_RERANK_RUNNER_UP_MARGIN;
  // e2e-bug.403 — precedence first, then confidence. Only a planner route in a
  // retired domain sets it, so for every other candidate this is the previous
  // pure-confidence ordering.
  const sorted = [...candidates].sort(
    (a, b) =>
      (b.precedence ?? 0) - (a.precedence ?? 0) || b.confidence - a.confidence,
  );
  const ranked = sorted.map((candidate, rank) => ({ ...candidate, rank }));
  const [top, runnerUp] = ranked;
  const ambiguous =
    !!runnerUp &&
    top.confidence - runnerUp.confidence < margin &&
    top.action !== runnerUp.action;

  return { winner: top, ranked, ambiguous };
}

export function candidateToClassifiedIntent(
  candidate: IntentCandidate,
  effectivePrompt: string,
  baseParams: Record<string, unknown> = {},
): ClassifiedIntent {
  const params = {
    ...baseParams,
    ...(candidate.params ?? {}),
    ...(candidate.paramHints ?? {}),
  };
  enrichBookingTimeHintsFromPrompt(candidate.action, params, effectivePrompt);
  return {
    action: candidate.action,
    params,
    reasoning:
      candidate.reasoning ??
      `Pipeline winner via ${candidate.source} (confidence ${candidate.confidence}).`,
    confidence: candidate.confidence,
  };
}

export function mergeCandidateParams(
  target: Record<string, unknown>,
  candidate: IntentCandidate,
): Record<string, unknown> {
  return {
    ...target,
    ...(candidate.params ?? {}),
    ...(candidate.paramHints ?? {}),
  };
}
