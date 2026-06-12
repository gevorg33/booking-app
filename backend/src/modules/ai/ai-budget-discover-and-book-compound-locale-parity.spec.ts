import { listBudgetDiscoverAndBookLocaleParityGaps } from './ai-budget-discover-and-book-compound-locale-parity.util.js';
import { BUDGET_DISCOVER_AND_BOOK_EN_SCENARIO_IDS } from './ai-budget-discover-and-book-compound.fixtures.js';
import { BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS } from './ai-budget-discover-and-book-compound-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_COMPOUND_CASES,
} from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_CASES } from './ai-budget-discover-and-book-compound-multilingual.eval.util.js';

describe('ai-budget-discover-and-book-compound locale parity (parity-2.4)', () => {
  it('has HY/RU siblings for every EN budget discover-and-book scenario', () => {
    expect(listBudgetDiscoverAndBookLocaleParityGaps()).toEqual([]);
  });

  it('multilingual scenario count matches EN ids × 2 locales', () => {
    expect(BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS).toHaveLength(
      BUDGET_DISCOVER_AND_BOOK_EN_SCENARIO_IDS.length * 2,
    );
  });

  it('registers EN + HY/RU eval cases in deterministic suite', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((row) => row.id),
    );
    for (const row of AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_COMPOUND_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
    for (const row of AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
  });
});
