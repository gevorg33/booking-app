import { listRankDiscoverAndBookLocaleParityGaps } from './ai-rank-discover-and-book-compound-locale-parity.util.js';
import { RANK_DISCOVER_AND_BOOK_EN_SCENARIO_IDS } from './ai-rank-discover-and-book-compound.fixtures.js';
import { RANK_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS } from './ai-rank-discover-and-book-compound-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_COMPOUND_CASES,
} from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_MULTILINGUAL_CASES } from './ai-rank-discover-and-book-compound-multilingual.eval.util.js';

describe('ai-rank-discover-and-book-compound locale parity (parity-2.4)', () => {
  it('has HY/RU siblings for every EN rank discover-and-book scenario', () => {
    expect(listRankDiscoverAndBookLocaleParityGaps()).toEqual([]);
  });

  it('multilingual scenario count matches EN ids × 2 locales', () => {
    expect(RANK_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS).toHaveLength(
      RANK_DISCOVER_AND_BOOK_EN_SCENARIO_IDS.length * 2,
    );
  });

  it('registers EN + HY/RU eval cases in deterministic suite', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((row) => row.id),
    );
    for (const row of AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_COMPOUND_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
    for (const row of AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_MULTILINGUAL_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
  });
});
