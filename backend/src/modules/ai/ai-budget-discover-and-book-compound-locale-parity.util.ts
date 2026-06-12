import {
  BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS,
  BUDGET_DISCOVER_AND_BOOK_EN_SCENARIO_IDS,
} from './ai-budget-discover-and-book-compound.fixtures.js';
import { BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS } from './ai-budget-discover-and-book-compound-multilingual.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type BudgetDiscoverAndBookLocaleParityGap = {
  enScenarioId: string;
  missingLocales: AiEvalLocale[];
};

export function listBudgetDiscoverAndBookLocaleParityGaps(): BudgetDiscoverAndBookLocaleParityGap[] {
  const byEnId = new Map<string, { hy: boolean; ru: boolean }>();
  for (const enScenarioId of BUDGET_DISCOVER_AND_BOOK_EN_SCENARIO_IDS) {
    byEnId.set(enScenarioId, { hy: false, ru: false });
  }
  for (const row of BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }
  const gaps: BudgetDiscoverAndBookLocaleParityGap[] = [];
  for (const [enScenarioId, slot] of byEnId.entries()) {
    const missingLocales: AiEvalLocale[] = [];
    if (!slot.hy) missingLocales.push('hy');
    if (!slot.ru) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({ enScenarioId, missingLocales });
  }
  return gaps;
}
