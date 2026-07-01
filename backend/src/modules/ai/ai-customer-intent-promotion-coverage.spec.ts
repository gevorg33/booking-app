import {
  auditCustomerIntentPromotionFixtures,
  CUSTOMER_INTENT_PROMOTION_INTEGRATION_ROWS,
  CUSTOMER_INTENT_PROMOTION_MIN_EN_FIXTURES,
  CUSTOMER_INTENT_PROMOTION_MIN_HY_FIXTURES,
  CUSTOMER_INTENT_PROMOTION_MIN_RU_FIXTURES,
  listCustomerIntentPromotionFixtureGaps,
} from './ai-customer-intent-promotion-coverage.util.js';
import { flattenCustomerIntentPromotionIntents } from './ai-customer-intent-promotion.util.js';
import {
  CUSTOMER_INTENT_COVERAGE_REQUIRED,
  listCustomerIntentCoverageGaps,
} from './ai-customer-intent-coverage.util.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-customer-intent-promotion-coverage.util (ai-cmd-customer-4.0.2)', () => {
  it('defines fixture audit rows for every shipped promotion intent', () => {
    const rows = auditCustomerIntentPromotionFixtures();
    expect(rows.map((row) => row.intent)).toEqual(
      flattenCustomerIntentPromotionIntents(),
    );
  });

  it.each(
    auditCustomerIntentPromotionFixtures().map((row) => [row.intent, row]),
  )('%s meets EN + HY/RU fixture minimums', (_intent, row) => {
    expect(row.enCount).toBeGreaterThanOrEqual(
      CUSTOMER_INTENT_PROMOTION_MIN_EN_FIXTURES,
    );
    expect(row.hyCount).toBeGreaterThanOrEqual(
      CUSTOMER_INTENT_PROMOTION_MIN_HY_FIXTURES,
    );
    expect(row.ruCount).toBeGreaterThanOrEqual(
      CUSTOMER_INTENT_PROMOTION_MIN_RU_FIXTURES,
    );
    expect(row.evalIdPrefixes.length).toBeGreaterThan(0);
  });

  it('reports no promotion fixture gaps', () => {
    expect(listCustomerIntentPromotionFixtureGaps()).toEqual([]);
  });

  it('includes every promotion intent in the required coverage gate', () => {
    for (const intent of flattenCustomerIntentPromotionIntents()) {
      expect(CUSTOMER_INTENT_COVERAGE_REQUIRED).toContain(intent);
    }
  });

  it('covers every promoted intent with fixtures and eval in the 2.6 gate', () => {
    const gaps = listCustomerIntentCoverageGaps(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      flattenCustomerIntentPromotionIntents(),
    );
    expect(gaps).toEqual([]);
  });

  it('defines one integration rescue row per promoted intent', () => {
    expect(CUSTOMER_INTENT_PROMOTION_INTEGRATION_ROWS).toHaveLength(
      flattenCustomerIntentPromotionIntents().length,
    );
    expect(
      CUSTOMER_INTENT_PROMOTION_INTEGRATION_ROWS.map((row) => row.intent),
    ).toEqual(flattenCustomerIntentPromotionIntents());
  });
});
