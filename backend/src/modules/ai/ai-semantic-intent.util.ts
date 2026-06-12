import { tokenizeForRag } from './ai-rag.util.js';
import type {
  IntentAnchor,
  RankedAnchorMatch,
  SemanticIntentMatch,
} from './ai-semantic-intent.types.js';
import type { CommandSurface } from './ai-command-registry.types.js';

/** Minimum cosine / blended score to adopt a semantic match in production. */
export const SEMANTIC_MATCH_THRESHOLD = 0.72;

/** Minimum concept coverage for deterministic (test / no-key) matching. */
export const SEMANTIC_CONCEPT_THRESHOLD = 0.65;

/** pipe-1.4.4 — CI uses token cosine instead of OpenAI embeddings. */
export const DETERMINISTIC_SEMANTIC_PIPE_MARKER = 'pipe-1.4.4';

const BOOKING_VERB_TOKENS = new Set([
  'book',
  'schedule',
  'reserve',
  'grab',
  'put',
  'appointment',
  'գրանց',
  'ամրագր',
  'запис',
  'запиши',
  'забронир',
]);

const AVAILABILITY_QUERY_TOKENS = new Set([
  'who',
  'which',
  'check',
  'see',
  'find',
  'show',
  'list',
  'кто',
  'какой',
  'ով',
  'ովքեր',
]);

/**
 * True when semantic match must avoid OpenAI embeddings (pipe-1.4.4).
 * CI (`NODE_ENV=test`) and businesses without an API key use token cosine only.
 */
export function shouldUseDeterministicSemanticFallback(
  hasEmbeddingApi: boolean,
): boolean {
  return process.env.NODE_ENV === 'test' || !hasEmbeddingApi;
}

/** Unicode-aware tokens (EN + HY + RU); ASCII falls back to rag tokenizer. */
export function tokenizeForSemantic(text: string): string[] {
  const unicodeTokens =
    text
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((token) => token.length >= 2) ?? [];
  if (unicodeTokens.length > 0) return unicodeTokens;
  return tokenizeForRag(text);
}

export function toTokenFrequencyVector(
  tokens: string[],
): Map<string, number> {
  const vec = new Map<string, number>();
  for (const token of tokens) {
    vec.set(token, (vec.get(token) ?? 0) + 1);
  }
  return vec;
}

export function cosineSimilarityMaps(
  a: Map<string, number>,
  b: Map<string, number>,
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, value] of a) {
    normA += value * value;
    const other = b.get(key);
    if (other) dot += value * other;
  }
  for (const value of b.values()) {
    normB += value * value;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function cosineSimilarityVectors(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function stemsOverlap(promptToken: string, conceptStem: string): boolean {
  if (promptToken.length < 3 || conceptStem.length < 3) return false;
  if (promptToken === conceptStem) return true;
  const shorter =
    promptToken.length <= conceptStem.length ? promptToken : conceptStem;
  const longer =
    promptToken.length > conceptStem.length ? promptToken : conceptStem;
  if (!longer.includes(shorter)) return false;
  const minRatio = /[^\u0000-\u007f]/.test(longer) ? 0.5 : 0.72;
  return shorter.length / longer.length >= minRatio;
}

export function scoreConceptCoverage(
  promptTokens: Set<string>,
  conceptGroups: string[][] | undefined,
): number {
  if (!conceptGroups?.length) return 0;

  let matched = 0;
  for (const group of conceptGroups) {
    const hit = group.some((token) => {
      const normalized = token.toLowerCase();
      if (promptTokens.has(normalized)) return true;
      return [...promptTokens].some((promptToken) =>
        stemsOverlap(promptToken, normalized),
      );
    });
    if (hit) matched += 1;
  }
  return matched / conceptGroups.length;
}

function applyIntentPolarity(
  promptTokens: Set<string>,
  anchor: IntentAnchor,
  score: number,
): number {
  const hasBookingVerb = [...promptTokens].some((token) =>
    [...BOOKING_VERB_TOKENS].some(
      (verb) => token.includes(verb) || verb.includes(token),
    ),
  );
  const hasAvailabilityQuery = [...promptTokens].some((token) =>
    AVAILABILITY_QUERY_TOKENS.has(token),
  );

  if (
    anchor.action === 'check_providers_for_service' &&
    hasBookingVerb &&
    !hasAvailabilityQuery
  ) {
    return 0;
  }
  if (
    (anchor.action === 'create_booking' ||
      anchor.action === 'book_nearest_slot') &&
    hasAvailabilityQuery &&
    !hasBookingVerb
  ) {
    return score * 0.75;
  }
  return score;
}

/** Token-frequency cosine between prompt and anchor phrase (pipe-1.4.4). */
export function scoreTokenCosineBetweenPhrases(
  prompt: string,
  anchorPhrase: string,
): number {
  return cosineSimilarityMaps(
    toTokenFrequencyVector(tokenizeForSemantic(prompt)),
    toTokenFrequencyVector(tokenizeForSemantic(anchorPhrase)),
  );
}

export function scoreAnchorDeterministic(
  prompt: string,
  anchor: IntentAnchor,
): number {
  const promptTokens = new Set(tokenizeForSemantic(prompt));
  const tokenCosine = scoreTokenCosineBetweenPhrases(prompt, anchor.phrase);

  const conceptScore = scoreConceptCoverage(
    promptTokens,
    anchor.conceptGroups,
  );
  if (!anchor.conceptGroups?.length) {
    // Eval-harvested paraphrases: phrase similarity when no concept groups wired.
    const phraseScore = applyIntentPolarity(promptTokens, anchor, tokenCosine);
    return phraseScore >= 0.45 ? phraseScore : 0;
  }
  if (conceptScore === 0) return 0;

  const blended = conceptScore * 0.85 + tokenCosine * 0.15;
  return applyIntentPolarity(promptTokens, anchor, blended);
}

export function scoreAnchorEmbedding(
  promptEmbedding: number[],
  anchorEmbedding: number[],
  prompt: string,
  anchor: IntentAnchor,
): number {
  const embeddingScore = cosineSimilarityVectors(
    promptEmbedding,
    anchorEmbedding,
  );
  const conceptScore = scoreConceptCoverage(
    new Set(tokenizeForSemantic(prompt)),
    anchor.conceptGroups,
  );
  return Math.max(embeddingScore, conceptScore * 0.95);
}

export function filterAnchorsForSurface(
  anchors: IntentAnchor[],
  surface: CommandSurface,
  allowedActions?: string[],
  lastAction?: string,
): IntentAnchor[] {
  return anchors.filter((anchor) => {
    if (!anchor.surfaces.includes(surface)) return false;
    if (allowedActions?.length && !allowedActions.includes(anchor.action)) {
      return false;
    }
    if (lastAction && anchor.action === lastAction) return true;
    return true;
  });
}

export function rankAnchorsDeterministic(
  prompt: string,
  anchors: IntentAnchor[],
): RankedAnchorMatch[] {
  return anchors
    .map((anchor) => ({
      anchor,
      score: scoreAnchorDeterministic(prompt, anchor),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function rankAnchorsEmbedding(
  prompt: string,
  promptEmbedding: number[],
  anchors: IntentAnchor[],
  anchorEmbeddings: Map<string, number[]>,
): RankedAnchorMatch[] {
  return anchors
    .map((anchor) => {
      const embedding = anchorEmbeddings.get(anchor.id);
      if (!embedding) return { anchor, score: 0 };
      return {
        anchor,
        score: scoreAnchorEmbedding(
          promptEmbedding,
          embedding,
          prompt,
          anchor,
        ),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function buildSemanticMatchFromAnchor(
  anchor: IntentAnchor,
  score: number,
): SemanticIntentMatch {
  return {
    action: anchor.action,
    confidence: Number(score.toFixed(4)),
    anchorId: anchor.id,
    paramHints: { ...(anchor.paramHints ?? {}) },
    reasoning: `Semantic intent match (${anchor.id}) — paraphrase resolved by meaning.`,
    rescueReason: 'semantic_match',
  };
}

const FLEXIBLE_BOOKING_ACTIONS = new Set([
  'create_booking',
  'book_nearest_slot',
  'reschedule_booking',
]);

function isAmbiguousRunnerUp(
  top: RankedAnchorMatch,
  runnerUp: RankedAnchorMatch,
  margin: number,
): boolean {
  if (top.score - runnerUp.score >= margin) return false;
  if (top.anchor.action === runnerUp.anchor.action) return false;
  if (
    FLEXIBLE_BOOKING_ACTIONS.has(top.anchor.action) &&
    FLEXIBLE_BOOKING_ACTIONS.has(runnerUp.anchor.action)
  ) {
    return false;
  }
  return true;
}

export function resolveSemanticMatch(
  ranked: RankedAnchorMatch[],
  options: { threshold: number; runnerUpMargin?: number },
): SemanticIntentMatch | null {
  const [top, runnerUp] = ranked;
  if (!top || top.score < options.threshold) return null;

  const margin = options.runnerUpMargin ?? 0.08;
  if (
    runnerUp &&
    runnerUp.score >= options.threshold &&
    isAmbiguousRunnerUp(top, runnerUp, margin)
  ) {
    return null;
  }

  return buildSemanticMatchFromAnchor(top.anchor, top.score);
}
