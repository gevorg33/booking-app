import { listBillingLoyaltyLocaleParityGaps } from './ai-billing-loyalty-dashboard-locale-parity.util.js';
import { BILLING_LOYALTY_EN_SCENARIO_IDS } from './ai-billing-loyalty-dashboard.fixtures.js';
import { BILLING_LOYALTY_MULTILINGUAL_SCENARIOS } from './ai-billing-loyalty-dashboard-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_BILLING_LOYALTY_DASHBOARD_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
} from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_BILLING_LOYALTY_DASHBOARD_MULTILINGUAL_CASES } from './ai-billing-loyalty-dashboard-multilingual.eval.util.js';

describe('ai-billing-loyalty-dashboard locale parity (parity-2.4)', () => {
  it('has HY/RU siblings for every EN billing/loyalty scenario', () => {
    expect(listBillingLoyaltyLocaleParityGaps()).toEqual([]);
  });

  it('multilingual scenario count matches EN ids × 2 locales', () => {
    expect(BILLING_LOYALTY_MULTILINGUAL_SCENARIOS).toHaveLength(
      BILLING_LOYALTY_EN_SCENARIO_IDS.length * 2,
    );
  });

  it('registers EN + HY/RU eval cases in deterministic suite', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((row) => row.id),
    );
    for (const row of AI_COMMAND_EVAL_BILLING_LOYALTY_DASHBOARD_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
    for (const row of AI_COMMAND_EVAL_BILLING_LOYALTY_DASHBOARD_MULTILINGUAL_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
  });
});
