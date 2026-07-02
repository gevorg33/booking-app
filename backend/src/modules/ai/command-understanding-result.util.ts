import type { ClassifiedIntent } from './ai-command-routing.util.js';
import type {
  IntentCandidate,
  PipelineUnderstandResult,
} from './command-understanding.types.js';
import { resolveSemanticWinnerCandidate } from './semantic-rescue-param-hints.util.js';

export function pipelineResultToClassifiedIntent(
  result: PipelineUnderstandResult,
): ClassifiedIntent {
  return {
    action: result.action,
    params: { ...result.params },
    reasoning: result.reasoning,
    confidence: result.confidence,
  };
}

export function findClassifierCandidate(
  result: PipelineUnderstandResult,
): IntentCandidate | undefined {
  return result.candidates.find(
    (candidate) => candidate.source === 'classifier',
  );
}

export function findRescueCandidate(
  result: PipelineUnderstandResult,
): IntentCandidate | undefined {
  return result.candidates.find((candidate) => candidate.source === 'rescue');
}

export function wasPipelineRescueApplied(
  result: PipelineUnderstandResult,
): boolean {
  return findRescueCandidate(result) != null;
}

export function pipelineRescueReason(
  result: PipelineUnderstandResult,
): string | undefined {
  return findRescueCandidate(result)?.rescueReason;
}

export function findSemanticCandidate(
  result: PipelineUnderstandResult,
): IntentCandidate | undefined {
  const winner = resolveSemanticWinnerCandidate(result.candidates);
  return winner ?? undefined;
}

export function resolveWinningCandidateSource(
  result: PipelineUnderstandResult,
  finalAction: string,
): IntentCandidate['source'] | undefined {
  const exact = result.candidates.find(
    (candidate) => candidate.action === finalAction,
  );
  if (exact) return exact.source;
  if (result.action === finalAction) {
    return result.candidates[0]?.source;
  }
  return (
    findRescueCandidate(result)?.source ??
    findClassifierCandidate(result)?.source
  );
}
