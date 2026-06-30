import { listClinicLabReviewLocaleParityGaps } from './ai-clinic-lab-review-compound-locale-parity.util.js';
import { CLINIC_LAB_REVIEW_EN_SCENARIO_IDS } from './ai-clinic-lab-review-compound.fixtures.js';
import { CLINIC_LAB_REVIEW_MULTILINGUAL_SCENARIOS } from './ai-clinic-lab-review-compound-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_COMPOUND_CASES,
} from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_MULTILINGUAL_CASES } from './ai-clinic-lab-review-compound-multilingual.eval.util.js';

describe('ai-clinic-lab-review-compound locale parity (parity-2.4)', () => {
  it('has HY/RU siblings for every EN lab review scenario', () => {
    expect(listClinicLabReviewLocaleParityGaps()).toEqual([]);
  });

  it('multilingual scenario count matches EN ids × 2 locales', () => {
    expect(CLINIC_LAB_REVIEW_MULTILINGUAL_SCENARIOS).toHaveLength(
      CLINIC_LAB_REVIEW_EN_SCENARIO_IDS.length * 2,
    );
  });

  it('registers EN + HY/RU eval cases in deterministic suite', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((row) => row.id),
    );
    for (const row of AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_COMPOUND_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
      expect(row.expect.compoundSteps?.length).toBe(2);
    }
    for (const row of AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_MULTILINGUAL_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
      expect(row.expect.compoundSteps?.length).toBe(2);
    }
  });
});
