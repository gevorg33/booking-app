import {
  CHECKOUT_RECOMMENDATIONS_CUSTOMER_PUBLIC_PROMPTS,
  CUSTOMER_PUBLIC_CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES,
  detectCheckoutRecommendationsCustomerPublicAction,
  enrichCheckoutRecommendationsParamsFromPrompt,
  isExplainCheckoutRecommendationsPrompt,
  rescueCheckoutRecommendationsCustomerPublicIntent,
} from './ai-checkout-recommendations-customer-public.util.js';
import { MULTILINGUAL_CHECKOUT_RECOMMENDATIONS_EVAL_SCENARIOS } from './ai-checkout-recommendations-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_RECOMMENDATIONS_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { isExplainMyNotificationsPrompt } from './ai-explain-my-notifications.util.js';

describe('ai-checkout-recommendations-customer-public.util (ai-cmd-customer-4.0 P3)', () => {
  it('exports classifier rules for checkout success product cards', () => {
    expect(CUSTOMER_PUBLIC_CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES).toContain(
      'explain_checkout_recommendations',
    );
  });

  it.each(
    CHECKOUT_RECOMMENDATIONS_CUSTOMER_PUBLIC_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects checkout recommendations prompt $id', (_id, row) => {
    expect(detectCheckoutRecommendationsCustomerPublicAction(row.prompt)).toBe(
      row.expectedAction,
    );
    expect(isExplainCheckoutRecommendationsPrompt(row.prompt)).toBe(true);
  });

  it.each(
    CHECKOUT_RECOMMENDATIONS_CUSTOMER_PUBLIC_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues checkout recommendations prompt $id from unknown', (_id, row) => {
    const rescued = rescueCheckoutRecommendationsCustomerPublicIntent(
      row.prompt,
      'unknown',
    );
    expect(rescued?.action).toBe(row.expectedAction);
    expect(rescued?.rescueReason).toBe(row.rescueReason);
  });

  it.each(
    MULTILINGUAL_CHECKOUT_RECOMMENDATIONS_EVAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues multilingual checkout recommendations scenario $id', (_id, row) => {
    expect(detectCheckoutRecommendationsCustomerPublicAction(row.prompt)).toBe(
      row.expectedAction,
    );
  });

  it('enriches aspect and service filters from success-screen prompts', () => {
    expect(
      enrichCheckoutRecommendationsParamsFromPrompt(
        {},
        'Why is Repair Mask recommended here after my haircut?',
      ),
    ).toMatchObject({ aspect: 'whyShown', serviceName: 'haircut' });
  });

  it('does not steal notification or success-screen overview prompts', () => {
    expect(
      detectCheckoutRecommendationsCustomerPublicAction(
        'What does View appointments do on the booking success screen in the app?',
      ),
    ).toBeNull();
    expect(
      isExplainMyNotificationsPrompt(
        'What are these You might also like products on the confirmation screen?',
      ),
    ).toBe(false);
  });

  it('maps checkout recommendations fixtures to passing eval golden cases', () => {
    const failures = CHECKOUT_RECOMMENDATIONS_CUSTOMER_PUBLIC_PROMPTS.filter(
      (row) => !detectCheckoutRecommendationsCustomerPublicAction(row.prompt),
    ).map((row) => row.id);
    expect(failures).toEqual([]);

    expect(
      CHECKOUT_RECOMMENDATIONS_CUSTOMER_PUBLIC_PROMPTS.filter(
        (row) => row.surface === 'customer',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      CHECKOUT_RECOMMENDATIONS_CUSTOMER_PUBLIC_PROMPTS.filter(
        (row) => row.surface === 'public',
      ).length,
    ).toBeGreaterThanOrEqual(10);

    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_RECOMMENDATIONS_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
