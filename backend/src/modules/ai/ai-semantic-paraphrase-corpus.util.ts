import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import { AI_IMPLICATION_CORPUS_EVAL_SCENARIOS } from './ai-implication-corpus.eval.util.js';
import type { ImplicationCorpusScenario } from './ai-implication-corpus.fixtures.js';
import {
  SEMANTIC_PARAPHRASE_SCENARIOS,
  type SemanticParaphraseScenario,
} from './ai-semantic-intent.fixtures.js';
import { CORE_SEMANTIC_INTENT_ACTIONS } from './intent-anchor.bank.util.js';
import { tokenizeForSemantic } from './ai-semantic-intent.util.js';

/** acc-3.16 — minimum lexically-distinct paraphrases per core semantic intent. */
export const SEMANTIC_PARAPHRASE_CORPUS_PIPE_MARKER = 'acc-3.16';

export const MIN_PARAPHRASES_PER_SEMANTIC_INTENT = 5;

export const REQUIRED_PARAPHRASE_LOCALES = ['en', 'hy', 'ru'] as const satisfies readonly AiEvalLocale[];

export type SemanticParaphraseCorpusRow = {
  id: string;
  prompt: string;
  expectedAction: string;
  locale: AiEvalLocale;
  source: 'semantic-paraphrase' | 'implication-corpus';
};

export type SemanticParaphraseCoverageGap = {
  action: string;
  reason: 'count' | 'locale';
  distinctCount?: number;
  missingLocales?: AiEvalLocale[];
};

export function normalizeParaphraseLexicalKey(prompt: string): string {
  return tokenizeForSemantic(prompt)
    .map((token) => token.toLowerCase())
    .sort()
    .join(' ');
}

export function resolveSemanticParaphraseLocale(
  scenario: Pick<SemanticParaphraseScenario, 'id' | 'locale'>,
): AiEvalLocale {
  if (scenario.locale) return scenario.locale;
  if (scenario.id.startsWith('hy-') || scenario.id.startsWith('arm-')) {
    return 'hy';
  }
  if (scenario.id.startsWith('ru-')) return 'ru';
  return 'en';
}

function implicationRowLocale(
  scenario: ImplicationCorpusScenario,
): AiEvalLocale {
  return scenario.locale ?? 'en';
}

export function collectSemanticParaphraseCorpus(): SemanticParaphraseCorpusRow[] {
  const rows: SemanticParaphraseCorpusRow[] = [];

  for (const scenario of SEMANTIC_PARAPHRASE_SCENARIOS) {
    if (scenario.classifyAction !== 'unknown') continue;
    rows.push({
      id: scenario.id,
      prompt: scenario.prompt,
      expectedAction: scenario.expectedAction,
      locale: resolveSemanticParaphraseLocale(scenario),
      source: 'semantic-paraphrase',
    });
  }

  for (const scenario of AI_IMPLICATION_CORPUS_EVAL_SCENARIOS) {
    if (scenario.surface === 'provider') continue;
    rows.push({
      id: scenario.id,
      prompt: scenario.prompt,
      expectedAction: scenario.expectedAction,
      locale: implicationRowLocale(scenario),
      source: 'implication-corpus',
    });
  }

  return rows;
}

export function summarizeSemanticParaphraseCoverage(
  rows: readonly SemanticParaphraseCorpusRow[] = collectSemanticParaphraseCorpus(),
): Map<
  string,
  { distinctCount: number; locales: Set<AiEvalLocale>; ids: string[] }
> {
  const summary = new Map<
    string,
    { distinctCount: number; locales: Set<AiEvalLocale>; ids: string[] }
  >();

  for (const action of CORE_SEMANTIC_INTENT_ACTIONS) {
    summary.set(action, {
      distinctCount: 0,
      locales: new Set(),
      ids: [],
    });
  }

  const distinctByAction = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!CORE_SEMANTIC_INTENT_ACTIONS.includes(row.expectedAction as never)) {
      continue;
    }
    const keys =
      distinctByAction.get(row.expectedAction) ?? new Set<string>();
    keys.add(normalizeParaphraseLexicalKey(row.prompt));
    distinctByAction.set(row.expectedAction, keys);

    const slot = summary.get(row.expectedAction)!;
    slot.locales.add(row.locale);
    slot.ids.push(row.id);
  }

  for (const [action, keys] of distinctByAction.entries()) {
    const slot = summary.get(action);
    if (!slot) continue;
    slot.distinctCount = keys.size;
  }

  return summary;
}

export function listSemanticParaphraseCoverageGaps(
  rows: readonly SemanticParaphraseCorpusRow[] = collectSemanticParaphraseCorpus(),
): SemanticParaphraseCoverageGap[] {
  const summary = summarizeSemanticParaphraseCoverage(rows);
  const gaps: SemanticParaphraseCoverageGap[] = [];

  for (const action of CORE_SEMANTIC_INTENT_ACTIONS) {
    const slot = summary.get(action)!;
    if (slot.distinctCount < MIN_PARAPHRASES_PER_SEMANTIC_INTENT) {
      gaps.push({
        action,
        reason: 'count',
        distinctCount: slot.distinctCount,
      });
    }

    const missingLocales = REQUIRED_PARAPHRASE_LOCALES.filter(
      (locale) => !slot.locales.has(locale),
    );
    if (missingLocales.length) {
      gaps.push({
        action,
        reason: 'locale',
        missingLocales: [...missingLocales],
      });
    }
  }

  return gaps;
}
