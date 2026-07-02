import {
  CUSTOMER_EXPLAIN_LOYALTY_POINTS_CLASSIFIER_RULES,
  EXPLAIN_LOYALTY_POINTS_PROMPTS,
  EXPLAIN_LOYALTY_POINTS_RESCUE_SCENARIOS,
} from './ai-explain-loyalty-points.fixtures.js';
import { EXPLAIN_LOYALTY_POINTS_MULTILINGUAL_SCENARIOS } from './ai-explain-loyalty-points-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_EXPLAIN_LOYALTY_POINTS_CASES } from './eval/ai-command-eval.cases.js';
import {
  buildLoyaltyPointsExplainCopy,
  detectExplainLoyaltyPointsAction,
  inferExplainLoyaltyPointsFocus,
  isExplainLoyaltyPointsIntent,
  isExplainLoyaltyPointsPrompt,
  parseExplainLoyaltyPointsFromPrompt,
  rescueExplainLoyaltyPointsIntent,
} from './ai-explain-loyalty-points.util.js';

describe('ai-explain-loyalty-points.util (ai-cmd-customer-4.5.1)', () => {
  it('exports classifier rules', () => {
    expect(CUSTOMER_EXPLAIN_LOYALTY_POINTS_CLASSIFIER_RULES).toContain(
      'explain_loyalty_points',
    );
  });

  it.each(EXPLAIN_LOYALTY_POINTS_PROMPTS.map((row) => [row.id, row] as const))(
    'detects explain prompt %s',
    (_id, row) => {
      expect(isExplainLoyaltyPointsPrompt(row.prompt)).toBe(true);
      expect(parseExplainLoyaltyPointsFromPrompt(row.prompt)).not.toBeNull();
      expect(
        rescueExplainLoyaltyPointsIntent(row.prompt, 'loyalty_points_balance')
          ?.action,
      ).toBe('explain_loyalty_points');
    },
  );

  it.each(
    EXPLAIN_LOYALTY_POINTS_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain prompt %s', (_id, row) => {
    expect(isExplainLoyaltyPointsPrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_LOYALTY_POINTS_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues misclassified explain prompt %s', (_id, row) => {
    expect(
      rescueExplainLoyaltyPointsIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe(row.expectedAction);
  });

  it('builds explain copy for earn, worth, and disabled program', () => {
    expect(
      buildLoyaltyPointsExplainCopy({
        enabled: true,
        earnPercentCashback: 10,
        focus: 'earn',
      }).summary,
    ).toMatch(/10%/);
    expect(
      buildLoyaltyPointsExplainCopy({
        enabled: true,
        earnPercentCashback: 5,
        focus: 'worth',
        pointsBalance: 12,
        pointsValue: 12,
      }).summary,
    ).toMatch(/\$1/);
    expect(
      buildLoyaltyPointsExplainCopy({
        enabled: false,
        earnPercentCashback: 5,
        focus: 'program',
      }).summary,
    ).toMatch(/not enabled/i);
  });

  it('exposes intent helpers and boundaries', () => {
    expect(isExplainLoyaltyPointsIntent('explain_loyalty_points')).toBe(true);
    expect(detectExplainLoyaltyPointsAction('How do I earn points?')).toBe(
      'explain_loyalty_points',
    );
    expect(isExplainLoyaltyPointsPrompt('How many points do I have?')).toBe(
      false,
    );
    expect(inferExplainLoyaltyPointsFocus('What are my points worth?')).toBe(
      'worth',
    );
    expect(
      rescueExplainLoyaltyPointsIntent(
        'How do I earn points?',
        'explain_loyalty_points',
      ),
    ).toBeNull();
  });

  it('maps fixtures to eval cases', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_LOYALTY_POINTS_CASES.length).toBe(
      EXPLAIN_LOYALTY_POINTS_PROMPTS.length +
        EXPLAIN_LOYALTY_POINTS_MULTILINGUAL_SCENARIOS.length +
        EXPLAIN_LOYALTY_POINTS_RESCUE_SCENARIOS.length,
    );
  });
});
