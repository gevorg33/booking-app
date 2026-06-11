import { listClinicLabDayCloseLocaleParityGaps } from './ai-clinic-lab-day-close-compound-locale-parity.util.js';
import { CLINIC_LAB_DAY_CLOSE_EN_SCENARIO_IDS } from './ai-clinic-lab-day-close-compound.fixtures.js';
import { CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_SCENARIOS } from './ai-clinic-lab-day-close-compound-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_COMPOUND_CASES,
} from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_CASES } from './ai-clinic-lab-day-close-compound-multilingual.eval.util.js';

describe('ai-clinic-lab-day-close-compound locale parity (parity-2.4)', () => {
  it('has HY/RU siblings for every EN lab day close scenario', () => {
    expect(listClinicLabDayCloseLocaleParityGaps()).toEqual([]);
  });

  it('multilingual scenario count matches EN ids × 2 locales', () => {
    expect(CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_SCENARIOS).toHaveLength(
      CLINIC_LAB_DAY_CLOSE_EN_SCENARIO_IDS.length * 2,
    );
  });

  it('registers EN + HY/RU eval cases in deterministic suite', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((row) => row.id),
    );
    for (const row of AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_COMPOUND_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
    for (const row of AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
  });
});
