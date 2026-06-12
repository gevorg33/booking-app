import { CANONICAL_PHRASING_BANK } from './intent-phrasing.bank.js';
import {
  AI_IMPLICATION_CORPUS_SCENARIOS,
  type ImplicationCorpusScenario,
} from './ai-implication-corpus.fixtures.js';
import {
  IMPLICATION_EN_SCENARIO_IDS,
  IMPLICATION_LEGACY_LOCALE_SIBLING_IDS,
  IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS,
} from './ai-implication-corpus-multilingual.fixtures.js';
import type { AiCommandEvalCase, AiEvalLocale } from './eval/ai-command-eval.types.js';
import { implicationCorpusEvalCaseId } from './ai-implication-corpus.eval.util.js';

export type ImplicationLocaleParityGap = {
  enScenarioId: string;
  intent: string;
  missingLocales: AiEvalLocale[];
};

export type ImplicationAnchorLocaleParityGap = {
  enAnchorId: string;
  action: string;
  missingLocales: AiEvalLocale[];
};

const IMPLIED_EN_ANCHOR_LEGACY_SIBLINGS: Record<string, { hy: string; ru: string }> =
  {
    'en-implied-haircut-need': {
      hy: 'hy-implied-trim-need',
      ru: 'ru-implied-trim-need',
    },
  };

/** acc-2.4 partial — every EN implication anchor needs HY + RU siblings. */
export function listImplicationAnchorLocaleParityGaps(): ImplicationAnchorLocaleParityGap[] {
  const anchorIds = new Set(
    CANONICAL_PHRASING_BANK.entries
      .filter((entry) => entry.id.startsWith('en-implied-'))
      .map((entry) => entry.id),
  );
  const byId = new Map(
    CANONICAL_PHRASING_BANK.entries.map((entry) => [entry.id, entry]),
  );

  const gaps: ImplicationAnchorLocaleParityGap[] = [];
  for (const enAnchorId of anchorIds) {
    const entry = byId.get(enAnchorId);
    if (!entry) continue;

    const legacy = IMPLIED_EN_ANCHOR_LEGACY_SIBLINGS[enAnchorId];
    const hyId = legacy?.hy ?? enAnchorId.replace(/^en-/, 'hy-');
    const ruId = legacy?.ru ?? enAnchorId.replace(/^en-/, 'ru-');

    const missingLocales: AiEvalLocale[] = [];
    if (!byId.has(hyId)) missingLocales.push('hy');
    if (!byId.has(ruId)) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;

    gaps.push({
      enAnchorId,
      action: entry.action,
      missingLocales,
    });
  }

  return gaps;
}

function scenarioLocaleIndex(
  scenarios: readonly ImplicationCorpusScenario[],
): Map<string, { hy: boolean; ru: boolean; intent: string }> {
  const byEnId = new Map<string, { hy: boolean; ru: boolean; intent: string }>();

  for (const enScenarioId of IMPLICATION_EN_SCENARIO_IDS) {
    byEnId.set(enScenarioId, { hy: false, ru: false, intent: '' });
  }

  const allScenarios = [...scenarios, ...IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS];
  for (const scenario of allScenarios) {
    if (scenario.locale !== 'hy' && scenario.locale !== 'ru') continue;

    const enScenarioId =
      Object.entries(IMPLICATION_LEGACY_LOCALE_SIBLING_IDS).find(
        ([, legacy]) =>
          legacy.hy === scenario.id || legacy.ru === scenario.id,
      )?.[0] ??
      scenario.id.replace(/^hy-/, 'en-').replace(/^ru-/, 'en-');

    const slot = byEnId.get(enScenarioId);
    if (!slot) continue;
    slot.intent = scenario.expectedAction;
    if (scenario.locale === 'hy') slot.hy = true;
    if (scenario.locale === 'ru') slot.ru = true;
  }

  return byEnId;
}

/** acc-2.4 partial — every EN implication corpus row needs HY + RU siblings. */
export function listImplicationCorpusLocaleParityGaps(
  scenarios: readonly ImplicationCorpusScenario[] = AI_IMPLICATION_CORPUS_SCENARIOS,
): ImplicationLocaleParityGap[] {
  const byEnId = scenarioLocaleIndex(scenarios);
  const gaps: ImplicationLocaleParityGap[] = [];

  for (const [enScenarioId, slot] of byEnId.entries()) {
    const missingLocales: AiEvalLocale[] = [];
    if (!slot.hy) missingLocales.push('hy');
    if (!slot.ru) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({
      enScenarioId,
      intent: slot.intent,
      missingLocales,
    });
  }

  return gaps;
}

export function listImplicationEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly ImplicationCorpusScenario[] = [
    ...AI_IMPLICATION_CORPUS_SCENARIOS,
    ...IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS,
  ],
): ImplicationLocaleParityGap[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  const gaps: ImplicationLocaleParityGap[] = [];

  for (const scenario of scenarios) {
    if (scenario.mustNotMatch?.length) continue;
    if (scenario.locale !== 'hy' && scenario.locale !== 'ru') continue;

    const evalId = implicationCorpusEvalCaseId(scenario);
    if (evalIds.has(evalId)) continue;

    gaps.push({
      enScenarioId: scenario.id,
      intent: scenario.expectedAction,
      missingLocales: [scenario.locale],
    });
  }

  return gaps;
}
