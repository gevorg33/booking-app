import { createHash } from 'crypto';
import { cosineSimilarity } from './ai-command-trace.util.js';
import type { FewShotExample } from './ai-classification-engine.types.js';
import { CLASSIFICATION_FEWSHOT_EXAMPLES } from './ai-classification-engine.fixtures.js';
import { tokenizeForRag } from './ai-rag.util.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';

export const DEFAULT_FEWSHOT_LIMIT = 3;
export const FEWSHOT_BUSINESS_PRIORITY_SLOTS = 2;
export const FEWSHOT_EMBEDDING_BATCH_SIZE = 128;
export const FEWSHOT_MIN_EMBEDDING_SCORE = 0.52;

export type FewShotExampleSource = 'global' | 'business' | 'static';

export interface FewShotRetrievalExample extends FewShotExample {
  source: FewShotExampleSource;
  businessId?: string;
}

export interface RetrieveFewShotInput {
  businessId: string;
  prompt: string;
  surface: ClassificationSurface;
  limit?: number;
  businessExamples?: FewShotRetrievalExample[];
}

function scoreTokenOverlap(queryTokens: string[], haystack: string): number {
  if (queryTokens.length === 0) return 0;
  const lower = haystack.toLowerCase();
  let hits = 0;
  for (const token of queryTokens) {
    if (lower.includes(token)) hits += 1;
  }
  return hits / queryTokens.length;
}

export function hashFewShotPrompt(text: string): string {
  return createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

/** acc-3.1 — labeled eval cases suitable as classify few-shot examples. */
export function isFewShotEligibleEvalCase(evalCase: AiCommandEvalCase): boolean {
  const { expect } = evalCase;
  if (expect.securityBlocked || expect.phiGuard) return false;
  if (evalCase.corpus === 'adversarial') return false;
  if (expect.compoundSteps?.length || expect.compoundActionsContains?.length) {
    return false;
  }
  if (expect.routeTier && !expect.rescuedAction && !expect.action) return false;
  if (expect.clarifyAction && !expect.rescuedAction && !expect.action) {
    return false;
  }
  return resolveFewShotActionFromEvalCase(evalCase) !== null;
}

export function resolveFewShotActionFromEvalCase(
  evalCase: AiCommandEvalCase,
): string | null {
  const action =
    evalCase.expect.rescuedAction ??
    evalCase.expect.action ??
    evalCase.expect.clarifyAction ??
    null;
  if (!action || action === 'unknown') return null;
  if (action.startsWith('clarify:')) return null;
  return action;
}

export function evalCaseToFewShotExample(
  evalCase: AiCommandEvalCase,
  source: FewShotExampleSource,
  businessId?: string,
): FewShotRetrievalExample | null {
  const action = resolveFewShotActionFromEvalCase(evalCase);
  if (!action) return null;
  const surface = evalCase.surface ?? 'dashboard';
  return {
    id: evalCase.id,
    prompt: evalCase.prompt,
    action,
    surface,
    locale: evalCase.locale,
    source,
    businessId,
  };
}

export function staticFewShotExamples(): FewShotRetrievalExample[] {
  return CLASSIFICATION_FEWSHOT_EXAMPLES.map((entry) => ({
    ...entry,
    source: 'static' as const,
  }));
}

/** Global acc-2 deterministic corpus + static seeds + exported harvested fixtures. */
export function buildGlobalFewShotPool(
  deterministicCases: AiCommandEvalCase[],
  harvestedCases: AiCommandEvalCase[] = [],
): FewShotRetrievalExample[] {
  const byPrompt = new Map<string, FewShotRetrievalExample>();

  for (const entry of staticFewShotExamples()) {
    byPrompt.set(hashFewShotPrompt(entry.prompt), entry);
  }

  for (const evalCase of [...deterministicCases, ...harvestedCases]) {
    if (!isFewShotEligibleEvalCase(evalCase)) continue;
    const example = evalCaseToFewShotExample(evalCase, 'global');
    if (!example) continue;
    byPrompt.set(hashFewShotPrompt(example.prompt), example);
  }

  return [...byPrompt.values()];
}

let defaultGlobalPoolCache: FewShotRetrievalExample[] | null = null;

/** Lazy-load acc-2 eval corpus to avoid circular imports at module init. */
export function getDefaultGlobalFewShotPool(): FewShotRetrievalExample[] {
  if (defaultGlobalPoolCache) return defaultGlobalPoolCache;
  const casesModule = require('./eval/ai-command-eval.cases.js') as {
    AI_COMMAND_EVAL_DETERMINISTIC_CASES: AiCommandEvalCase[];
  };
  const harvestedModule = require('./eval/ai-command-eval.harvested.cases.js') as {
    AI_COMMAND_EVAL_HARVESTED_CASES: AiCommandEvalCase[];
  };
  const semanticModule = require('./eval/ai-command-eval.semantic-paraphrase.cases.js') as {
    AI_COMMAND_EVAL_SEMANTIC_PARAPHRASE_CASES: AiCommandEvalCase[];
  };
  defaultGlobalPoolCache = buildGlobalFewShotPool(
    [
      ...casesModule.AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ...semanticModule.AI_COMMAND_EVAL_SEMANTIC_PARAPHRASE_CASES,
    ],
    harvestedModule.AI_COMMAND_EVAL_HARVESTED_CASES,
  );
  return defaultGlobalPoolCache;
}

export function filterFewShotPoolBySurface(
  pool: FewShotRetrievalExample[],
  surface: ClassificationSurface,
): FewShotRetrievalExample[] {
  return pool.filter((entry) => entry.surface === surface);
}

export function harvestedCasesForBusiness(
  businessId: string,
  harvestedCases: AiCommandEvalCase[],
): FewShotRetrievalExample[] {
  const prefix = `harvest-${businessId.slice(0, 8)}-`;
  return harvestedCases
    .filter((entry) => entry.id.startsWith(prefix))
    .map((entry) => evalCaseToFewShotExample(entry, 'business', businessId))
    .filter((entry): entry is FewShotRetrievalExample => entry !== null);
}

/** Lexical fallback when embeddings are unavailable (CI / offline). */
export function retrieveFewShotExamplesByTokenOverlap(
  prompt: string,
  surface: ClassificationSurface,
  pool: FewShotRetrievalExample[],
  limit = DEFAULT_FEWSHOT_LIMIT,
): FewShotRetrievalExample[] {
  const tokens = tokenizeForRag(prompt);
  return pool
    .filter((entry) => entry.surface === surface)
    .map((entry) => ({
      entry,
      score: scoreTokenOverlap(tokens, `${entry.prompt} ${entry.action}`),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const sourceRank = (source: FewShotExampleSource) =>
        source === 'business' ? 0 : source === 'static' ? 1 : 2;
      const rankDiff =
        sourceRank(a.entry.source) - sourceRank(b.entry.source);
      if (rankDiff !== 0) return rankDiff;
      return a.entry.id.localeCompare(b.entry.id);
    })
    .slice(0, limit)
    .map((row) => row.entry);
}

export interface RankFewShotByEmbeddingInput {
  queryEmbedding: number[];
  pool: FewShotRetrievalExample[];
  embeddingsById: Map<string, number[]>;
  limit: number;
  minScore?: number;
}

export function rankFewShotExamplesByEmbedding(
  input: RankFewShotByEmbeddingInput,
): Array<{ example: FewShotRetrievalExample; score: number }> {
  const minScore = input.minScore ?? FEWSHOT_MIN_EMBEDDING_SCORE;
  const scored = input.pool
    .map((example) => {
      const embedding = input.embeddingsById.get(example.id);
      if (!embedding) return null;
      const score = cosineSimilarity(input.queryEmbedding, embedding);
      return { example, score };
    })
    .filter((row): row is { example: FewShotRetrievalExample; score: number } =>
      row !== null && row.score >= minScore,
    )
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const sourceRank = (source: FewShotExampleSource) =>
        source === 'business' ? 0 : source === 'static' ? 1 : 2;
      return sourceRank(a.example.source) - sourceRank(b.example.source);
    });

  return scored.slice(0, input.limit);
}

/** Merge business-first slots with global embedding hits. */
export function mergeFewShotRetrievalResults(
  businessHits: FewShotRetrievalExample[],
  globalHits: FewShotRetrievalExample[],
  limit = DEFAULT_FEWSHOT_LIMIT,
  businessSlots = FEWSHOT_BUSINESS_PRIORITY_SLOTS,
): FewShotExample[] {
  const selected: FewShotRetrievalExample[] = [];
  const seen = new Set<string>();

  for (const entry of businessHits.slice(0, businessSlots)) {
    const key = hashFewShotPrompt(entry.prompt);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(entry);
  }

  for (const entry of [...businessHits.slice(businessSlots), ...globalHits]) {
    if (selected.length >= limit) break;
    const key = hashFewShotPrompt(entry.prompt);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(entry);
  }

  return selected.map(({ source: _source, businessId: _businessId, ...rest }) => rest);
}

export function chunkTexts<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
