import type { CommandResult } from './command-completion.types.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import {
  buildSemanticClarifySummary,
  formatSemanticClarifyActionLabel,
} from './ai-semantic-confidence.util.js';
import {
  scoreIntentForShortlist,
} from './ai-classification-shortlist.util.js';
import {
  INTENT_DISAMBIGUATION_PAIRS,
  type IntentDisambiguationCandidate,
} from './ai-intent-disambiguation-clarify.fixtures.js';
import { DEFAULT_FIELD_CONFIDENCE_THRESHOLD } from './ai-classification-field-confidence.fixtures.js';

const SHORTLIST_TOP2_MIN_SCORE = 0.12;
const SHORTLIST_TOP2_MAX_GAP = 0.14;
const ACTION_CLARIFY_THRESHOLD = DEFAULT_FIELD_CONFIDENCE_THRESHOLD;

export function normalizeIntentDisambiguationCandidates(
  candidates: IntentDisambiguationCandidate[],
): IntentDisambiguationCandidate[] {
  const seen = new Set<string>();
  const normalized: IntentDisambiguationCandidate[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.action)) continue;
    seen.add(candidate.action);
    normalized.push({
      ...candidate,
      label: candidate.label || formatSemanticClarifyActionLabel(candidate.action),
    });
    if (normalized.length >= 2) break;
  }
  return normalized;
}

export function detectPatternIntentPair(input: {
  prompt: string;
  surface: ClassificationSurface;
  shortlist?: string[];
}): IntentDisambiguationCandidate[] {
  const pairs = INTENT_DISAMBIGUATION_PAIRS[input.surface] ?? [];
  for (const pair of pairs) {
    if (!pair.pattern.test(input.prompt)) continue;
    const [first, second] = pair.actions;
    if (
      input.shortlist?.length &&
      (!input.shortlist.includes(first) || !input.shortlist.includes(second))
    ) {
      continue;
    }
    const labels = pair.labels ?? [
      formatSemanticClarifyActionLabel(first),
      formatSemanticClarifyActionLabel(second),
    ];
    return [
      {
        action: first,
        confidence: 0.5,
        source: 'pattern',
        label: labels[0],
      },
      {
        action: second,
        confidence: 0.48,
        source: 'pattern',
        label: labels[1],
      },
    ];
  }
  return [];
}

export function buildShortlistTop2Candidates(input: {
  prompt: string;
  surface: ClassificationSurface;
  shortlist: string[];
}): IntentDisambiguationCandidate[] {
  const scored = input.shortlist
    .filter((action) => action !== 'unknown')
    .map((action) => ({
      action,
      score: scoreIntentForShortlist(input.prompt, action, input.surface),
    }))
    .filter((row) => row.score >= SHORTLIST_TOP2_MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  if (scored.length < 2) return [];
  if (scored[0].score - scored[1].score > SHORTLIST_TOP2_MAX_GAP) return [];

  return scored.slice(0, 2).map((row) => ({
    action: row.action,
    confidence: row.score,
    source: 'shortlist',
    label: formatSemanticClarifyActionLabel(row.action),
  }));
}

export function buildIntentDisambiguationCandidates(input: {
  prompt: string;
  surface: ClassificationSurface;
  action: string;
  confidence?: number;
  params: Record<string, unknown>;
  shortlist?: string[];
}): IntentDisambiguationCandidate[] {
  const semantic = input.params._semanticClarifyCandidates as
    | IntentDisambiguationCandidate[]
    | undefined;
  if (semantic?.length) {
    return normalizeIntentDisambiguationCandidates(semantic);
  }

  const actionConfidence =
    (input.params._fieldConfidence as { action?: number } | undefined)?.action ??
    input.confidence ??
    1;
  if (actionConfidence >= ACTION_CLARIFY_THRESHOLD && input.action !== 'unknown') {
    return [];
  }

  const pattern = detectPatternIntentPair(input);
  if (pattern.length >= 2) {
    return normalizeIntentDisambiguationCandidates(pattern);
  }

  if (input.shortlist?.length) {
    const shortlistTop2 = buildShortlistTop2Candidates({
      prompt: input.prompt,
      surface: input.surface,
      shortlist: input.shortlist,
    });
    if (shortlistTop2.length >= 2) {
      return normalizeIntentDisambiguationCandidates(shortlistTop2);
    }
  }

  return [];
}

/** acc-4.2 — top-2 intent clarify payload with chip-friendly summary. */
export function buildIntentDisambiguationClarifyResult(input: {
  prompt: string;
  surface: ClassificationSurface;
  action: string;
  params: Record<string, unknown>;
  reasoning?: string;
  confidence?: number;
  shortlist?: string[];
}): CommandResult | null {
  const candidates = buildIntentDisambiguationCandidates(input);
  if (candidates.length < 2) return null;

  return {
    success: false,
    action: input.action === 'unknown' ? 'clarify' : input.action,
    summary: buildSemanticClarifySummary(candidates),
    details: {
      needsClarification: true,
      clarify: true,
      clarifySource: 'intent_disambiguation',
      clarifyKind: 'intent_disambiguation',
      clarifyCandidates: candidates,
      partialParams: input.params,
      pipelineStage: 'clarify',
      reasoning: input.reasoning,
    },
  };
}

export function composeIntentDisambiguationFollowUp(input: {
  selectedAction: string;
  label: string;
  originalPrompt?: string;
}): string {
  const human = input.label.toLowerCase();
  if (input.originalPrompt?.trim()) {
    return `${input.originalPrompt.trim()}. I meant ${human}.`;
  }
  return `I meant ${human}.`;
}

export function readSelectedIntentAction(
  sessionContext?: Record<string, unknown>,
): string | undefined {
  const selected = sessionContext?._selectedIntentAction;
  return typeof selected === 'string' && selected.trim() ? selected.trim() : undefined;
}

export function applySelectedIntentFromSession<
  T extends {
    action: string;
    confidence?: number;
    params?: Record<string, unknown>;
    reasoning?: string;
  },
>(intent: T, sessionContext?: Record<string, unknown>): T {
  const selected = readSelectedIntentAction(sessionContext);
  if (!selected) return intent;
  intent.action = selected;
  intent.confidence = Math.max(intent.confidence ?? 0, 0.92);
  intent.params = intent.params ?? {};
  intent.params._classificationSource = 'intent_disambiguation_chip';
  intent.reasoning = `Intent disambiguation chip → ${selected}`;
  return intent;
}
