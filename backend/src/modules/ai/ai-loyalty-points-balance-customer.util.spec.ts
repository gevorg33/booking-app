import {
  CUSTOMER_LOYALTY_POINTS_BALANCE_CLASSIFIER_RULES,
  LOYALTY_POINTS_BALANCE_PROMPTS,
  detectLoyaltyPointsBalanceCustomerAction,
  isLoyaltyPointsBalancePrompt,
  rescueLoyaltyPointsBalanceCustomerIntent,
} from './ai-loyalty-points-balance-customer.util.js';
import { AI_COMMAND_EVAL_LOYALTY_POINTS_BALANCE_CUSTOMER_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';

describe('ai-loyalty-points-balance-customer.util (ai-cmd-customer-4.0 P1)', () => {
  it('exports classifier rules for loyalty balance', () => {
    expect(CUSTOMER_LOYALTY_POINTS_BALANCE_CLASSIFIER_RULES).toContain(
      'loyalty_points_balance',
    );
  });

  it.each(LOYALTY_POINTS_BALANCE_PROMPTS.map((row) => [row.id, row] as const))(
    'detects loyalty balance prompt $id',
    (_id, row) => {
      expect(isLoyaltyPointsBalancePrompt(row.prompt)).toBe(true);
      expect(detectLoyaltyPointsBalanceCustomerAction(row.prompt)).toBe(
        row.expectedAction,
      );
    },
  );

  it.each(LOYALTY_POINTS_BALANCE_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues loyalty balance prompt $id from unknown',
    (_id, row) => {
      const rescued = rescueLoyaltyPointsBalanceCustomerIntent(
        row.prompt,
        'unknown',
      );
      expect(rescued?.action).toBe(row.expectedAction);
      expect(rescued?.rescueReason).toBe(row.rescueReason);
      expect(rescueMarketingGrowthIntent(row.prompt, 'unknown')?.action).toBe(
        'loyalty_points_balance',
      );
    },
  );

  it('does not steal earn-explain or checkout-spend prompts', () => {
    expect(isLoyaltyPointsBalancePrompt('How do I earn points?')).toBe(false);
    expect(isLoyaltyPointsBalancePrompt('What are my points worth?')).toBe(
      false,
    );
    expect(
      detectLoyaltyPointsBalanceCustomerAction('Use my points on this booking'),
    ).toBeNull();
    expect(
      rescueLoyaltyPointsBalanceCustomerIntent(
        'Summarize loyalty program',
        'unknown',
      ),
    ).toBeNull();
  });

  it('maps loyalty balance fixtures to passing eval golden cases', () => {
    expect(LOYALTY_POINTS_BALANCE_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_LOYALTY_POINTS_BALANCE_CUSTOMER_CASES.length).toBe(
      LOYALTY_POINTS_BALANCE_PROMPTS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_LOYALTY_POINTS_BALANCE_CUSTOMER_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
