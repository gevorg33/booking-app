import { tokenizeForRag } from './ai-rag.util.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import {
  CUSTOMER_INTENTS,
  DASHBOARD_INTENTS,
  PROVIDER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import { applyPhrasingBiasToShortlist } from './ai-classification-phrasing.util.js';
import {
  INTENT_SHORTLIST_KEYWORD_OVERRIDES,
  SHORTLIST_CLASSIFIER_RULES,
  SHORTLIST_PROMPT_SIGNALS,
  SURFACE_BASELINE_SHORTLIST_INTENTS,
} from './ai-classification-shortlist.fixtures.js';

export const DEFAULT_SHORTLIST_LIMIT = 15;
export const MIN_SHORTLIST_LIMIT = 10;

const SURFACE_INTENTS: Record<ClassificationSurface, readonly string[]> = {
  dashboard: DASHBOARD_INTENTS,
  customer: CUSTOMER_INTENTS,
  provider: PROVIDER_INTENTS,
  public: PUBLIC_INTENTS,
};

const INTENT_PREFIX_HINTS: Record<string, readonly string[]> = {
  summarize_: ['how many', 'summary', 'total', 'overview', 'busiest'],
  explain_: ['explain', 'why', 'what', 'how does'],
  configure_: ['configure', 'set', 'enable', 'turn on'],
  list_: ['list', 'show', 'display'],
  create_: ['create', 'add', 'new'],
  update_: ['update', 'change', 'edit'],
  apply_: ['apply', 'run', 'use'],
  preview_: ['preview', 'show me'],
  diagnose_: ['diagnose', 'why rejected', 'why failed'],
  book_: ['book', 'reserve', 'schedule'],
  check_: ['check', 'available', 'free'],
  cancel_: ['cancel', 'drop'],
  mark_: ['mark', 'set status'],
  enter_: ['enter', 'record', 'add'],
  release_: ['release', 'publish'],
};

function scoreTokenOverlap(queryTokens: string[], haystack: string): number {
  if (queryTokens.length === 0) return 0;
  const lower = haystack.toLowerCase();
  let hits = 0;
  for (const token of queryTokens) {
    if (lower.includes(token)) hits += 1;
  }
  return hits / queryTokens.length;
}

export function tokenizeShortlistPrompt(prompt: string): string[] {
  return tokenizeForRag(prompt);
}

export function deriveKeywordsFromIntentId(intent: string): string[] {
  const keywords = new Set<string>();
  for (const part of intent.split('_')) {
    if (part.length > 2) keywords.add(part);
  }
  keywords.add(intent.replace(/_/g, ' '));

  for (const [prefix, hints] of Object.entries(INTENT_PREFIX_HINTS)) {
    if (intent.startsWith(prefix)) {
      for (const hint of hints) keywords.add(hint);
    }
  }

  for (const extra of INTENT_SHORTLIST_KEYWORD_OVERRIDES[intent] ?? []) {
    keywords.add(extra);
  }

  return [...keywords];
}

export function scoreIntentForShortlist(
  prompt: string,
  intent: string,
  surface: ClassificationSurface,
  tokens: string[] = tokenizeShortlistPrompt(prompt),
): number {
  if (intent === 'unknown') return 0;

  const keywords = deriveKeywordsFromIntentId(intent);
  const keywordScore = keywords.reduce(
    (sum, keyword) => sum + scoreTokenOverlap(tokens, keyword),
    0,
  );

  let signalScore = 0;
  for (const signal of SHORTLIST_PROMPT_SIGNALS) {
    if (signal.surfaces && !signal.surfaces.includes(surface)) continue;
    if (!signal.pattern.test(prompt)) continue;

    if (signal.intents.includes(intent)) {
      signalScore += signal.weight;
      continue;
    }

    if (signal.intents.length === 0) {
      if (intent.startsWith('explain_') && signal.id === 'explain-prefix') {
        signalScore += signal.weight;
      }
      if (intent.startsWith('configure_') && signal.id === 'configure-prefix') {
        signalScore += signal.weight;
      }
    }
  }

  return keywordScore + signalScore;
}

export interface BuildIntentShortlistInput {
  prompt: string;
  surface: ClassificationSurface;
  limit?: number;
  boostIntents?: string[];
}

/** acc-3.3 — pre-filter registry intents to the top plausible 10–15 for classify. */
export function buildIntentShortlist(
  input: BuildIntentShortlistInput | string,
  surface?: ClassificationSurface,
  limit = DEFAULT_SHORTLIST_LIMIT,
  boostIntents: string[] = [],
): string[] {
  const resolved: BuildIntentShortlistInput =
    typeof input === 'string'
      ? {
          prompt: input,
          surface: surface ?? 'dashboard',
          limit,
          boostIntents,
        }
      : input;

  const shortlistLimit = Math.min(
    DEFAULT_SHORTLIST_LIMIT,
    Math.max(MIN_SHORTLIST_LIMIT, resolved.limit ?? DEFAULT_SHORTLIST_LIMIT),
  );
  const allowed = new Set(
    SURFACE_INTENTS[resolved.surface] ?? DASHBOARD_INTENTS,
  );
  const tokens = tokenizeShortlistPrompt(resolved.prompt);
  const boosts = resolved.boostIntents ?? [];

  const scored = [...allowed]
    .filter((intent) => intent !== 'unknown')
    .map((intent) => ({
      intent,
      score:
        scoreIntentForShortlist(resolved.prompt, intent, resolved.surface, tokens) +
        (boosts.includes(intent) ? 3 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.intent.localeCompare(b.intent));

  const topScore = scored[0]?.score ?? 0;
  const selected = scored
    .filter((row) => row.score > 0 || topScore === 0)
    .slice(0, Math.max(shortlistLimit - 1, 1))
    .map((row) => row.intent);

  const baselines = SURFACE_BASELINE_SHORTLIST_INTENTS[resolved.surface].filter(
    (intent) => allowed.has(intent),
  );

  const merged = ['unknown', ...boosts, ...selected, ...baselines];
  return applyPhrasingBiasToShortlist(
    [...new Set(merged)].slice(0, shortlistLimit),
    boosts,
    shortlistLimit,
  );
}

export function formatIntentShortlistBlock(intents: string[]): string {
  if (intents.length === 0) return '';
  return [
    `Plausible intents for this message (dynamic shortlist, acc-3.3):`,
    intents.join(' | '),
    SHORTLIST_CLASSIFIER_RULES,
    `Allowed actions for this turn: ${intents.join(' | ')}`,
  ].join('\n');
}

export function formatDynamicActionEnum(shortlist: string[]): string {
  const actions = shortlist.filter((intent) => intent !== 'unknown');
  if (actions.length === 0) return 'unknown';
  return `${actions.join(' | ')} | unknown`;
}

export function isActionAllowedByShortlist(
  action: string,
  shortlist: string[],
): boolean {
  if (action === 'unknown') return true;
  return shortlist.includes(action);
}

/** When classify returns an action outside the shortlist, snap to top shortlist candidate. */
export function reconcileClassifiedActionWithShortlist(
  action: string,
  prompt: string,
  surface: ClassificationSurface,
  shortlist: string[],
): { action: string; adjusted: boolean; reason?: string } {
  if (isActionAllowedByShortlist(action, shortlist)) {
    return { action, adjusted: false };
  }

  const rescored = shortlist
    .filter((intent) => intent !== 'unknown')
    .map((intent) => ({
      intent,
      score: scoreIntentForShortlist(prompt, intent, surface),
    }))
    .sort((a, b) => b.score - a.score);

  const best = rescored[0];
  if (!best || best.score <= 0) {
    return { action: 'unknown', adjusted: true, reason: 'shortlist_violation' };
  }

  return {
    action: best.intent,
    adjusted: true,
    reason: 'shortlist_rescue',
  };
}

export function getSurfaceIntentCount(surface: ClassificationSurface): number {
  return (SURFACE_INTENTS[surface] ?? DASHBOARD_INTENTS).filter(
    (intent) => intent !== 'unknown',
  ).length;
}

export function readClassificationShortlistFromContext(
  context?: Record<string, unknown>,
): string[] | undefined {
  const meta = context?._classificationEngineMeta as
    | { shortlist?: string[] }
    | undefined;
  return meta?.shortlist?.length ? meta.shortlist : undefined;
}
