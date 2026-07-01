import { EXPLAIN_CHECKOUT_RECOMMENDATIONS_PROMPTS } from './ai-checkout-recommendations.fixtures.js';
import { MULTILINGUAL_CHECKOUT_RECOMMENDATIONS_EVAL_SCENARIOS } from './ai-checkout-recommendations-multilingual.fixtures.js';
import {
  isExplainCheckoutRecommendationsPrompt,
  parseExplainCheckoutRecommendationsFromPrompt,
  rescueExplainCheckoutRecommendationsIntent,
} from './ai-checkout-recommendations.util.js';
import { isExplainRecommendationSetupPrompt as isAdminSetup } from './ai-recommendation-product.util.js';

describe('ai-checkout-recommendations.util (ai-cmd-rec-5)', () => {
  it.each(EXPLAIN_CHECKOUT_RECOMMENDATIONS_PROMPTS)(
    'detects checkout success recommendation prompt $id',
    ({ prompt }) => {
      expect(isExplainCheckoutRecommendationsPrompt(prompt)).toBe(true);
      expect(
        rescueExplainCheckoutRecommendationsIntent(prompt, 'unknown'),
      ).toEqual({
        action: 'explain_checkout_recommendations',
        rescueReason: 'explain_checkout_recommendations',
      });
    },
  );

  it('does not steal consumer app success-screen overview prompts', () => {
    const consumerPrompt =
      'What does View appointments do on the booking success screen in the app?';
    expect(isExplainCheckoutRecommendationsPrompt(consumerPrompt)).toBe(false);
  });

  it('does not steal dashboard recommendation setup prompts', () => {
    const adminPrompt = 'Explain recommendation setup';
    expect(isExplainCheckoutRecommendationsPrompt(adminPrompt)).toBe(false);
    expect(isAdminSetup(adminPrompt)).toBe(true);
  });

  it('does not steal admin linked-products overview', () => {
    const adminPrompt =
      'Which products are linked for post-checkout recommendations?';
    expect(isExplainCheckoutRecommendationsPrompt(adminPrompt)).toBe(false);
    expect(isAdminSetup(adminPrompt)).toBe(true);
  });

  it('does not steal dashboard recommendation analytics prompts', () => {
    const analyticsPrompt = 'What are the top recommended products by clicks?';
    expect(isExplainCheckoutRecommendationsPrompt(analyticsPrompt)).toBe(false);
  });

  it('parses aspect and service filters from customer success prompts', () => {
    const parsed = parseExplainCheckoutRecommendationsFromPrompt(
      'Why is Repair Mask recommended here after my haircut?',
      {},
    );
    expect(parsed?.aspect).toBe('whyShown');
    expect(parsed?.serviceName).toBe('haircut');
  });

  it('does not rescue when action is already explain_checkout_recommendations', () => {
    expect(
      rescueExplainCheckoutRecommendationsIntent(
        'What are these You might also like products?',
        'explain_checkout_recommendations',
      ),
    ).toBeNull();
  });

  it.each(MULTILINGUAL_CHECKOUT_RECOMMENDATIONS_EVAL_SCENARIOS)(
    'detects multilingual checkout recommendations prompt $id',
    ({ prompt, expectedAction, paramsPartial }) => {
      expect(isExplainCheckoutRecommendationsPrompt(prompt)).toBe(true);
      expect(
        rescueExplainCheckoutRecommendationsIntent(prompt, 'unknown')?.action,
      ).toBe(expectedAction);
      if (paramsPartial?.aspect) {
        expect(
          parseExplainCheckoutRecommendationsFromPrompt(prompt)?.aspect,
        ).toBe(paramsPartial.aspect);
      }
    },
  );

  it('parses multilingual product-list aspects', () => {
    expect(
      parseExplainCheckoutRecommendationsFromPrompt(
        'Ինչ են You might also like ապրանքները հաստատման էկրանում',
      )?.aspect,
    ).toBe('products');
    expect(
      parseExplainCheckoutRecommendationsFromPrompt(
        'Что за You might also like на экране подтверждения записи',
      )?.aspect,
    ).toBe('products');
  });
});
