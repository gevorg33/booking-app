import type {
  ClassificationSurface,
  SemanticIntentMatch,
  SemanticPhraseEntry,
} from './ai-classification-engine.types.js';
import type { BusinessParaphraseEntry } from './ai-settings.types.js';
import { tokenizeForRag } from './ai-rag.util.js';
import { hashSemanticPhrase } from './ai-semantic-phrasing-bank.util.js';
import {
  BUSINESS_PARAPHRASE_EXACT_MATCH_CONFIDENCE,
  BUSINESS_PARAPHRASE_FUZZY_MATCH_CONFIDENCE,
  BUSINESS_PARAPHRASE_RECURRING_HIT_THRESHOLD,
  BUSINESS_PARAPHRASE_SKIP_ACTIONS,
  MAX_BUSINESS_PARAPHRASES,
  MIN_BUSINESS_PARAPHRASE_PROMPT_LENGTH,
} from './ai-business-paraphrase.fixtures.js';

export type BusinessParaphraseSource = BusinessParaphraseEntry['source'];

export function normalizeBusinessParaphrasePrompt(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function shouldLearnBusinessParaphrase(
  prompt: string,
  action: string,
): boolean {
  const normalized = normalizeBusinessParaphrasePrompt(prompt);
  if (normalized.length < MIN_BUSINESS_PARAPHRASE_PROMPT_LENGTH) return false;
  if (BUSINESS_PARAPHRASE_SKIP_ACTIONS.has(action)) return false;
  return true;
}

export function buildBusinessParaphraseId(
  normalizedPhrase: string,
  surface: ClassificationSurface,
): string {
  const hash = hashSemanticPhrase(`${surface}:${normalizedPhrase}`);
  return `biz-paraphrase-${hash.slice(0, 16)}`;
}

export function buildBusinessParaphraseEntry(input: {
  prompt: string;
  action: string;
  surface: ClassificationSurface;
  source: BusinessParaphraseSource;
  locale?: string;
  hitCount?: number;
  learnedAt?: string;
}): BusinessParaphraseEntry | null {
  if (!shouldLearnBusinessParaphrase(input.prompt, input.action)) return null;
  const normalizedPhrase = normalizeBusinessParaphrasePrompt(input.prompt);
  return {
    id: buildBusinessParaphraseId(normalizedPhrase, input.surface),
    phrase: input.prompt.trim(),
    normalizedPhrase,
    action: input.action,
    surface: input.surface,
    locale: input.locale,
    source: input.source,
    hitCount: input.hitCount ?? 1,
    learnedAt: input.learnedAt ?? new Date().toISOString(),
  };
}

export function mergeBusinessParaphrases(
  existing: BusinessParaphraseEntry[],
  incoming: BusinessParaphraseEntry[],
): BusinessParaphraseEntry[] {
  const byId = new Map(existing.map((entry) => [entry.id, entry]));

  for (const entry of incoming) {
    const current = byId.get(entry.id);
    if (!current) {
      byId.set(entry.id, entry);
      continue;
    }

    const correctionWins =
      entry.source === 'correction' && current.source !== 'correction';
    byId.set(entry.id, {
      ...current,
      ...entry,
      action: correctionWins ? entry.action : current.action,
      source: correctionWins ? 'correction' : current.source,
      hitCount: current.hitCount + 1,
      learnedAt: entry.learnedAt,
      phrase: entry.phrase,
      normalizedPhrase: entry.normalizedPhrase,
    });
  }

  return [...byId.values()]
    .sort((a, b) => {
      if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
      if (a.source === 'correction' && b.source !== 'correction') return -1;
      if (b.source === 'correction' && a.source !== 'correction') return 1;
      return b.learnedAt.localeCompare(a.learnedAt);
    })
    .slice(0, MAX_BUSINESS_PARAPHRASES);
}

export function businessParaphrasesToSemanticEntries(
  paraphrases: BusinessParaphraseEntry[],
  surface?: ClassificationSurface,
): SemanticPhraseEntry[] {
  const filtered = surface
    ? paraphrases.filter((entry) => entry.surface === surface)
    : paraphrases;

  return filtered.map((entry) => ({
    id: entry.id,
    phrase: entry.phrase,
    action: entry.action,
    surface: entry.surface,
    locale: entry.locale,
    source: 'business_learned' as const,
  }));
}

function scoreParaphraseTokenOverlap(
  queryTokens: string[],
  phrase: string,
  action: string,
): number {
  if (queryTokens.length === 0) return 0;
  const lower = `${phrase} ${action}`.toLowerCase();
  let hits = 0;
  for (const token of queryTokens) {
    if (lower.includes(token)) hits += 1;
  }
  return hits / queryTokens.length;
}

function rankBusinessParaphrasesLexical(
  prompt: string,
  entries: SemanticPhraseEntry[],
): Array<{ entry: SemanticPhraseEntry; score: number }> {
  const tokens = tokenizeForRag(prompt);
  return entries
    .map((entry) => ({
      entry,
      score: scoreParaphraseTokenOverlap(tokens, entry.phrase, entry.action),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
}

export function matchBusinessLearnedParaphrase(
  prompt: string,
  paraphrases: BusinessParaphraseEntry[],
  surface: ClassificationSurface,
): SemanticIntentMatch | null {
  const normalizedPrompt = normalizeBusinessParaphrasePrompt(prompt);
  const surfaceEntries = paraphrases.filter((entry) => entry.surface === surface);

  const exact = surfaceEntries.find(
    (entry) => entry.normalizedPhrase === normalizedPrompt,
  );
  if (exact && exact.hitCount >= 1) {
    return {
      action: exact.action,
      confidence: BUSINESS_PARAPHRASE_EXACT_MATCH_CONFIDENCE,
      matchedPhraseId: exact.id,
      source: 'business_learned',
    };
  }

  const semanticEntries = businessParaphrasesToSemanticEntries(
    surfaceEntries.filter(
      (entry) =>
        entry.source === 'correction' ||
        entry.hitCount >= BUSINESS_PARAPHRASE_RECURRING_HIT_THRESHOLD,
    ),
    surface,
  );
  if (semanticEntries.length === 0) return null;

  const ranked = rankBusinessParaphrasesLexical(
    normalizedPrompt,
    semanticEntries,
  );
  const best = ranked[0];
  if (!best || best.score < 0.55) return null;

  return {
    action: best.entry.action,
    confidence: Math.max(
      BUSINESS_PARAPHRASE_FUZZY_MATCH_CONFIDENCE,
      best.score,
    ),
    matchedPhraseId: best.entry.id,
    source: 'business_learned',
  };
}

export function mapTraceSurfaceToClassificationSurface(
  surface: string,
): ClassificationSurface {
  if (surface === 'provider') return 'provider';
  if (surface === 'customer') return 'customer';
  if (surface === 'public') return 'public';
  return 'dashboard';
}

export function mapLearnSurfaceToClassificationSurface(
  surface: 'dashboard' | 'provider_mobile' | 'customer' | 'public',
): ClassificationSurface {
  if (surface === 'provider_mobile') return 'provider';
  if (surface === 'customer') return 'customer';
  if (surface === 'public') return 'public';
  return 'dashboard';
}
