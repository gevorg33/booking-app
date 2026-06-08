import { cosineSimilarity } from './ai-command-trace.util.js';
import { tokenizeForRag } from './ai-rag.util.js';
import { matchBusinessAliasIntent } from './ai-classification-phrasing.util.js';
import {
  businessParaphrasesToSemanticEntries,
  matchBusinessLearnedParaphrase,
} from './ai-business-paraphrase.util.js';
import {
  buildSemanticPhrasingBank,
  type SemanticPhraseSource,
} from './ai-semantic-phrasing-bank.util.js';
import {
  SEMANTIC_EMBEDDING_MIN_SCORE,
  SEMANTIC_LEXICAL_CANDIDATE_LIMIT,
  SEMANTIC_LEXICAL_MIN_SCORE,
} from './ai-semantic-intent.fixtures.js';
import type {
  ClassificationSurface,
  SemanticIntentMatch,
  SemanticPhraseEntry,
} from './ai-classification-engine.types.js';
import type { EntityMemory } from './ai-settings.types.js';

export { SEMANTIC_LEXICAL_MIN_SCORE as SEMANTIC_MATCH_THRESHOLD } from './ai-semantic-intent.fixtures.js';
export {
  buildSemanticPhrasingBank,
  buildSemanticIntentPhraseBank,
  loadStoredCanonicalPhrasingBank,
  isSemanticParaphraseEvalCase,
  evalCaseToSemanticPhraseEntry,
  summarizeSemanticPhrasingBank,
} from './ai-semantic-phrasing-bank.util.js';

function scoreTokenOverlap(queryTokens: string[], haystack: string): number {
  if (queryTokens.length === 0) return 0;
  const lower = haystack.toLowerCase();
  let hits = 0;
  for (const token of queryTokens) {
    if (lower.includes(token)) hits += 1;
  }
  return hits / queryTokens.length;
}

export function tokenizeSemanticPrompt(prompt: string): string[] {
  return tokenizeForRag(prompt);
}

export function mapPhraseSourceToMatchSource(
  source?: SemanticPhraseSource,
): SemanticIntentMatch['source'] {
  if (source === 'business_learned') return 'business_learned';
  if (source === 'canonical') return 'canonical';
  if (source === 'harvested') return 'eval_paraphrase';
  return 'eval_paraphrase';
}

export function resolveSemanticPhraseSource(
  entry: SemanticPhraseEntry,
): SemanticIntentMatch['source'] {
  if (entry.source) {
    return mapPhraseSourceToMatchSource(entry.source);
  }
  if (entry.id.startsWith('biz-paraphrase-')) {
    return 'business_learned';
  }
  if (
    entry.id.startsWith('sem-en-') ||
    entry.id.startsWith('sem-hy-') ||
    entry.id.startsWith('sem-ru-')
  ) {
    return 'eval_paraphrase';
  }
  if (entry.id.startsWith('canon-')) {
    return 'canonical';
  }
  if (entry.id.startsWith('sem-')) {
    return 'canonical';
  }
  return 'eval_paraphrase';
}

export function buildSemanticIntentMatch(
  entry: SemanticPhraseEntry,
  confidence: number,
  source: SemanticIntentMatch['source'],
): SemanticIntentMatch {
  return {
    action: entry.action,
    confidence,
    matchedPhraseId: entry.id,
    source,
  };
}

export function rankSemanticPhrasesLexical(
  prompt: string,
  bank: SemanticPhraseEntry[],
  limit = SEMANTIC_LEXICAL_CANDIDATE_LIMIT,
): Array<{ entry: SemanticPhraseEntry; score: number }> {
  const tokens = tokenizeSemanticPrompt(prompt);
  return bank
    .map((entry) => ({
      entry,
      score: scoreTokenOverlap(tokens, `${entry.phrase} ${entry.action}`),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
    .slice(0, limit);
}

export interface RankSemanticPhrasesByEmbeddingInput {
  queryEmbedding: number[];
  pool: SemanticPhraseEntry[];
  embeddingsById: ReadonlyMap<string, number[]>;
  limit?: number;
  minScore?: number;
}

export function rankSemanticPhrasesByEmbedding(
  input: RankSemanticPhrasesByEmbeddingInput,
): Array<{ entry: SemanticPhraseEntry; score: number }> {
  const minScore = input.minScore ?? SEMANTIC_EMBEDDING_MIN_SCORE;
  const limit = input.limit ?? 1;
  return input.pool
    .map((entry) => {
      const embedding = input.embeddingsById.get(entry.id);
      if (!embedding) return null;
      return {
        entry,
        score: cosineSimilarity(input.queryEmbedding, embedding),
      };
    })
    .filter(
      (row): row is { entry: SemanticPhraseEntry; score: number } =>
        row !== null && row.score >= minScore,
    )
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
    .slice(0, limit);
}

/** acc-3.11 lexical fallback — used in CI and when embeddings are unavailable. */
export function matchSemanticIntentLexical(
  prompt: string,
  surface: ClassificationSurface,
  options: {
    threshold?: number;
    entityMemory?: EntityMemory;
    bank?: SemanticPhraseEntry[];
  } = {},
): SemanticIntentMatch | null {
  const threshold = options.threshold ?? SEMANTIC_LEXICAL_MIN_SCORE;
  const paraphrases = options.entityMemory?.paraphrases ?? [];

  const businessLearned = matchBusinessLearnedParaphrase(
    prompt,
    paraphrases,
    surface,
  );
  if (businessLearned) return businessLearned;

  const bank =
    options.bank ??
    buildSemanticPhrasingBank(
      surface,
      businessParaphrasesToSemanticEntries(paraphrases, surface),
    );

  const aliasMatch = matchBusinessAliasIntent(prompt, surface, options.entityMemory);
  const ranked = rankSemanticPhrasesLexical(prompt, bank, SEMANTIC_LEXICAL_CANDIDATE_LIMIT);
  const best = ranked[0] ?? null;

  if (aliasMatch && (!best || aliasMatch.confidence > best.score)) {
    return aliasMatch;
  }

  if (!best || best.score < threshold) {
    return null;
  }

  return buildSemanticIntentMatch(
    best.entry,
    best.score,
    resolveSemanticPhraseSource(best.entry),
  );
}
