import { listStaffOperationsLocaleParityGaps } from './ai-staff-operations-locale-parity.util.js';
import { STAFF_OPERATIONS_EN_SCENARIO_IDS } from './ai-staff-operations.fixtures.js';
import { STAFF_OPERATIONS_MULTILINGUAL_SCENARIOS } from './ai-staff-operations-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_STAFF_OPERATIONS_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
} from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_STAFF_OPERATIONS_MULTILINGUAL_CASES } from './ai-staff-operations-multilingual.eval.util.js';

describe('ai-staff-operations locale parity (parity-2.4)', () => {
  it('has HY/RU siblings for every EN staff-operations scenario', () => {
    expect(listStaffOperationsLocaleParityGaps()).toEqual([]);
  });

  it('multilingual scenario count matches EN ids × 2 locales', () => {
    expect(STAFF_OPERATIONS_MULTILINGUAL_SCENARIOS).toHaveLength(
      STAFF_OPERATIONS_EN_SCENARIO_IDS.length * 2,
    );
  });

  it('registers EN + HY/RU eval cases in deterministic suite', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((row) => row.id),
    );
    for (const row of AI_COMMAND_EVAL_STAFF_OPERATIONS_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
    for (const row of AI_COMMAND_EVAL_STAFF_OPERATIONS_MULTILINGUAL_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
  });
});
