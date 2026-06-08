/** n99-2.4 — few-shot retrieval on by default for rare phrasings (acc-3.1 via ai-rag.service). */

import type { BuildClassifierAppendixInput } from './ai-classification-engine.types.js';
import type { FewShotExample } from './ai-classification-engine.types.js';
import { resolveClassificationAbVariant } from './ai-classification-engine.util.js';
import {
  DEFAULT_FEWSHOT_LIMIT,
  filterFewShotPoolBySurface,
  getDefaultGlobalFewShotPool,
  retrieveFewShotExamplesByTokenOverlap,
  type FewShotRetrievalExample,
} from './ai-classification-fewshot.util.js';
import { formatFewShotBlock } from './ai-classification-engine.util.js';
import type { N99FewShotRetrievalScenario } from './ai-n99-fewshot-retrieval.fixtures.js';

export const N99_FEWSHOT_RETRIEVAL_ENABLED_BY_DEFAULT = true;
export const N99_DEFAULT_FEWSHOT_LIMIT = 5;
export const N99_RARE_PHRASING_FEWSHOT_LIMIT = 7;
export const N99_FEWSHOT_HEAVY_BONUS = 2;

const RARE_PHRASING_MARKERS = [
  /\b(register|slot in|set up|put .+ on the books|grab the soonest|nearest opening|first open|earliest slot|record payment|everything on my schedule)\b/i,
  /\b(запиш|забронируй|оформи запись|назначь|поставь|свободен|свободное время)\b/i,
  /\b(գրանցիր|պլանավորիր|նշանակիր|պատվիր|վերցրու|առաջին ազատ)\b/i,
  /\b(stylists have openings|providers with availability|soonest appointment)\b/i,
] as const;

const CANONICAL_INTENT_VERBS =
  /\b(book|schedule|cancel|show|check|remind|mark paid|list my)\b/i;

export function isFewShotRetrievalEnabledByDefault(): boolean {
  return N99_FEWSHOT_RETRIEVAL_ENABLED_BY_DEFAULT;
}

export function isRarePhrasingPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length === 0) return false;
  if (RARE_PHRASING_MARKERS.some((pattern) => pattern.test(trimmed))) {
    return true;
  }
  return trimmed.length > 12 && !CANONICAL_INTENT_VERBS.test(trimmed);
}

export function resolveFewShotRetrievalLimit(
  input: Pick<BuildClassifierAppendixInput, 'prompt' | 'abVariantId'>,
): number {
  const variant = resolveClassificationAbVariant(input.abVariantId);
  const base = isRarePhrasingPrompt(input.prompt)
    ? N99_RARE_PHRASING_FEWSHOT_LIMIT
    : N99_DEFAULT_FEWSHOT_LIMIT;
  if (variant === 'fewshot_heavy') {
    return base + N99_FEWSHOT_HEAVY_BONUS;
  }
  return base;
}

export function isSemanticParaphraseFewShotExample(
  example: Pick<FewShotRetrievalExample, 'id'>,
): boolean {
  return example.id.startsWith('sem-');
}

export function prioritizeRarePhrasingFewShots(
  retrieved: FewShotExample[],
  prompt: string,
  surface: BuildClassifierAppendixInput['surface'],
  limit: number,
  pool: FewShotRetrievalExample[] = getDefaultGlobalFewShotPool(),
): FewShotExample[] {
  if (!isRarePhrasingPrompt(prompt)) {
    return retrieved.slice(0, limit);
  }

  const surfacePool = filterFewShotPoolBySurface(pool, surface);
  const paraphraseHits = retrieveFewShotExamplesByTokenOverlap(
    prompt,
    surface,
    surfacePool.filter(isSemanticParaphraseFewShotExample),
    Math.max(limit, 4),
  );

  const merged: FewShotExample[] = [];
  const seen = new Set<string>();

  for (const entry of [...paraphraseHits, ...retrieved]) {
    const key = `${entry.prompt}::${entry.action}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(entry);
    if (merged.length >= limit) break;
  }

  return merged;
}

export function retrieveN99FewShotExamplesLexical(input: {
  prompt: string;
  surface: BuildClassifierAppendixInput['surface'];
  limit?: number;
  abVariantId?: string;
  pool?: FewShotRetrievalExample[];
}): FewShotExample[] {
  const limit =
    input.limit ?? resolveFewShotRetrievalLimit(input);
  const pool = input.pool ?? getDefaultGlobalFewShotPool();
  const retrieved = retrieveFewShotExamplesByTokenOverlap(
    input.prompt,
    input.surface,
    filterFewShotPoolBySurface(pool, input.surface),
    limit,
  );
  return prioritizeRarePhrasingFewShots(
    retrieved,
    input.prompt,
    input.surface,
    limit,
    pool,
  );
}

export function formatN99FewShotBlock(examples: FewShotExample[]): string {
  if (examples.length === 0) return '';
  const block = formatFewShotBlock(examples);
  if (!block) return '';
  return `${block}\n(n99-2.4 — few-shot retrieval enabled by default; top-K labeled cases for rare phrasing)`;
}

export function evaluateN99FewShotRetrievalScenario(
  scenario: N99FewShotRetrievalScenario,
  pool?: FewShotRetrievalExample[],
): { passed: boolean; examples: FewShotExample[]; errors: string[] } {
  const examples = retrieveN99FewShotExamplesLexical({
    prompt: scenario.prompt,
    surface: scenario.surface,
    pool,
  });
  const errors: string[] = [];
  const minCount = scenario.minCount ?? 1;

  if (examples.length < minCount) {
    errors.push(
      `fewShotRetrieval.count: expected >= ${minCount}, got ${examples.length}`,
    );
  }

  const actionHit = examples.some(
    (entry) => entry.action === scenario.expectedAction,
  );
  if (!actionHit) {
    errors.push(
      `fewShotRetrieval.action: expected ${scenario.expectedAction} in [${examples.map((entry) => entry.action).join(', ')}]`,
    );
  }

  if (scenario.rarePhrasing && !isRarePhrasingPrompt(scenario.prompt)) {
    errors.push('fewShotRetrieval.rarePhrasing: scenario prompt not classified as rare');
  }

  return {
    passed: errors.length === 0,
    examples,
    errors,
  };
}
