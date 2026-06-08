import type { CommandResult } from './command-completion.types.js';
import type {
  ClassificationSurface,
  SemanticIntentMatch,
} from './ai-classification-engine.types.js';
import { isMutatingClassificationAction } from './ai-classification-escalation.util.js';
import {
  SEMANTIC_CLARIFY_CLASSIFIER_MIN,
  SEMANTIC_CLARIFY_MIN_CONFIDENCE,
  SEMANTIC_EXECUTE_MIN_CONFIDENCE,
  SEMANTIC_MUTATING_EXECUTE_MIN_CONFIDENCE,
  type SemanticClarifyCandidate,
} from './ai-semantic-confidence.fixtures.js';

export type SemanticMatchDisposition = 'execute' | 'clarify' | 'reject';

export function formatSemanticClarifyActionLabel(action: string): string {
  return action.replace(/_/g, ' ');
}

export function resolveSemanticExecuteMinConfidence(action: string): number {
  return isMutatingClassificationAction(action)
    ? SEMANTIC_MUTATING_EXECUTE_MIN_CONFIDENCE
    : SEMANTIC_EXECUTE_MIN_CONFIDENCE;
}

/** acc-3.15 — map semantic match score to execute / clarify / reject. */
export function resolveSemanticMatchDisposition(
  match: Pick<SemanticIntentMatch, 'action' | 'confidence'>,
): SemanticMatchDisposition {
  if (match.confidence < SEMANTIC_CLARIFY_MIN_CONFIDENCE) return 'reject';
  if (match.confidence >= resolveSemanticExecuteMinConfidence(match.action)) {
    return 'execute';
  }
  return 'clarify';
}

export function shouldApplySemanticMatch(
  match: SemanticIntentMatch,
): boolean {
  return resolveSemanticMatchDisposition(match) === 'execute';
}

export function shouldRunSemanticMatcherForIntent(input: {
  action: string;
  confidence?: number;
}): boolean {
  if (input.action === 'unknown') return true;
  return (input.confidence ?? 1) < SEMANTIC_CLARIFY_MIN_CONFIDENCE;
}

export function buildSemanticClarifyCandidates(input: {
  classifierAction: string;
  classifierConfidence?: number;
  semanticMatch: SemanticIntentMatch;
}): SemanticClarifyCandidate[] {
  const candidates: SemanticClarifyCandidate[] = [
    {
      action: input.semanticMatch.action,
      confidence: input.semanticMatch.confidence,
      source: 'semantic',
      label: formatSemanticClarifyActionLabel(input.semanticMatch.action),
    },
  ];

  if (
    input.classifierAction !== 'unknown' &&
    input.classifierAction !== input.semanticMatch.action &&
    (input.classifierConfidence ?? 0) >= SEMANTIC_CLARIFY_CLASSIFIER_MIN
  ) {
    candidates.unshift({
      action: input.classifierAction,
      confidence: input.classifierConfidence ?? SEMANTIC_CLARIFY_CLASSIFIER_MIN,
      source: 'classifier',
      label: formatSemanticClarifyActionLabel(input.classifierAction),
    });
  }

  return candidates.slice(0, 2);
}

export function buildSemanticClarifySummary(
  candidates: Array<{ label: string }>,
): string {
  if (candidates.length >= 2) {
    return `I'm not fully sure what you meant. Did you want to ${candidates[0].label} or ${candidates[1].label}?`;
  }
  if (candidates.length === 1) {
    return `I'm not fully sure what you meant. Did you want to ${candidates[0].label}?`;
  }
  return "I'm not fully sure what you meant. Can you clarify what you'd like me to do?";
}

/** Returns targeted clarify when semantic confidence is in the clarify band (acc-3.15 / acc-4). */
export function buildSemanticConfidenceClarifyIfNeeded(input: {
  prompt: string;
  surface: ClassificationSurface;
  action: string;
  params: Record<string, unknown>;
  reasoning?: string;
}): CommandResult | null {
  if (!input.params._semanticClarify) return null;

  const candidates = input.params._semanticClarifyCandidates as
    | SemanticClarifyCandidate[]
    | undefined;
  if (!candidates?.length) return null;

  return {
    success: false,
    action: input.action === 'unknown' ? 'clarify' : input.action,
    summary: buildSemanticClarifySummary(candidates),
    details: {
      needsClarification: true,
      clarify: true,
      clarifySource: 'semantic_confidence',
      clarifyCandidates: candidates,
      semanticMatch: {
        action: input.params._semanticMatchAction,
        confidence: input.params._semanticMatchConfidence,
        matchedPhraseId: input.params._semanticMatchPhraseId,
        source: input.params._semanticMatchSource,
      },
      partialParams: input.params,
      pipelineStage: 'clarify',
      reasoning: input.reasoning,
    },
  };
}

export function attachSemanticMatchMetadata(
  params: Record<string, unknown>,
  match: SemanticIntentMatch,
): void {
  params._semanticMatchConfidence = match.confidence;
  params._semanticMatchAction = match.action;
  params._semanticMatchSource = match.source;
  params._semanticMatchPhraseId = match.matchedPhraseId;
}

export function markSemanticClarifyIntent(input: {
  intent: {
    action: string;
    confidence?: number;
    params?: Record<string, unknown>;
  };
  semanticMatch: SemanticIntentMatch;
  classifierAction: string;
  classifierConfidence?: number;
}): void {
  const params = (input.intent.params ??= {});
  attachSemanticMatchMetadata(params, input.semanticMatch);
  params._semanticClarify = true;
  params._classificationNeedsClarify = true;
  params._semanticClarifyCandidates = buildSemanticClarifyCandidates({
    classifierAction: input.classifierAction,
    classifierConfidence: input.classifierConfidence,
    semanticMatch: input.semanticMatch,
  });

  if (
    input.intent.action !== 'unknown' &&
    isMutatingClassificationAction(input.intent.action) &&
    (input.intent.confidence ?? 0) < resolveSemanticExecuteMinConfidence(
      input.semanticMatch.action,
    )
  ) {
    params._semanticClarifySuppressedAction = input.intent.action;
    input.intent.action = 'unknown';
  }

  input.intent.confidence = Math.min(
    input.intent.confidence ?? input.semanticMatch.confidence,
    input.semanticMatch.confidence,
  );
}

export function applySemanticMatchToIntent(input: {
  intent: {
    action: string;
    confidence?: number;
    reasoning?: string;
    params?: Record<string, unknown>;
  };
  semanticMatch: SemanticIntentMatch;
  classifierAction: string;
  classifierConfidence?: number;
}): SemanticMatchDisposition {
  const disposition = resolveSemanticMatchDisposition(input.semanticMatch);
  const params = (input.intent.params ??= {});

  if (disposition === 'execute') {
    if (
      input.intent.action === 'unknown' ||
      input.intent.action !== input.semanticMatch.action
    ) {
      input.intent.action = input.semanticMatch.action;
      input.intent.reasoning = `Semantic intent match (${input.semanticMatch.matchedPhraseId}, ${input.semanticMatch.source})`;
    }
    input.intent.confidence = Math.max(
      input.intent.confidence ?? 0,
      input.semanticMatch.confidence,
    );
    params._classificationSource = 'semantic';
    attachSemanticMatchMetadata(params, input.semanticMatch);
    delete params._semanticClarify;
    delete params._semanticClarifyCandidates;
    return disposition;
  }

  if (disposition === 'clarify') {
    markSemanticClarifyIntent(input);
    return disposition;
  }

  return disposition;
}
