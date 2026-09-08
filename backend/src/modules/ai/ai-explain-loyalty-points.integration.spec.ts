import { validateCommand } from './command-completion.validator.js';
import { handleExplainLoyaltyPointsLogic } from './ai-explain-loyalty-points.logic.js';
import {
  EXPLAIN_LOYALTY_POINTS_PROMPTS,
  EXPLAIN_LOYALTY_POINTS_RESCUE_SCENARIOS,
} from './ai-explain-loyalty-points.fixtures.js';
import { rescueExplainLoyaltyPointsIntent } from './ai-explain-loyalty-points.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_EXPLAIN_LOYALTY_POINTS_CASES } from './eval/ai-command-eval.cases.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai-explain-loyalty-points integration (ai-cmd-customer-4.5.1)', () => {
  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: { loyalty: { enabled: true, earnPercentCashback: 5 } },
      })),
    },
    loyaltyService: {
      getBalance: jest.fn(async () => ({
        account: { pointsBalance: 10, lifetimeEarned: 10 },
      })),
      getPublicSummary: jest.fn((_account, settings) => ({
        pointsBalance: 10,
        lifetimeEarned: 10,
        earnPercentCashback: settings?.loyalty?.earnPercentCashback ?? 5,
        pointsValue: 10,
        bonusDollarValue: 1,
      })),
    },
  });

  it.each(EXPLAIN_LOYALTY_POINTS_PROMPTS)(
    'validates and executes $id',
    async ({ prompt }) => {
      const validation = validateCommand(makeResolvedCommand({
        action: 'explain_loyalty_points',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const result = await handleExplainLoyaltyPointsLogic(
        deps() as any,
        'biz-1',
        { sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_loyalty_points');
    },
  );

  it.each(EXPLAIN_LOYALTY_POINTS_RESCUE_SCENARIOS)(
    'rescues misclassified intent $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainLoyaltyPointsIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_LOYALTY_POINTS_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
