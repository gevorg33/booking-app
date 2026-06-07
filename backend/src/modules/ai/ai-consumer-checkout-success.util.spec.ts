import { EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_PROMPTS } from './ai-consumer-checkout-success.fixtures.js';
import {
  isConsumerCheckoutSuccessIntent,
  isExplainConsumerCheckoutSuccessPrompt,
  parseExplainConsumerCheckoutSuccessFromPrompt,
  rescueExplainConsumerCheckoutSuccessIntent,
} from './ai-consumer-checkout-success.util.js';
import { isExplainCheckoutRecommendationsPrompt } from './ai-checkout-recommendations.util.js';

describe('ai-consumer-checkout-success.util (ai-cmd-rec-6)', () => {
  it.each(EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_PROMPTS)(
    'detects consumer checkout success prompt $id',
    ({ prompt, aspect }) => {
      expect(isExplainConsumerCheckoutSuccessPrompt(prompt)).toBe(true);
      const parsed = parseExplainConsumerCheckoutSuccessFromPrompt(prompt);
      expect(parsed?.aspect).toBe(aspect);
    },
  );

  it('rescues unknown action to explain_consumer_checkout_success', () => {
    expect(
      rescueExplainConsumerCheckoutSuccessIntent(
        'What does View appointments do on the booking success screen in the app?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
    });
  });

  it('does not rescue when action is already explain_consumer_checkout_success', () => {
    expect(
      rescueExplainConsumerCheckoutSuccessIntent(
        'Explain the booking success screen in the consumer app after I confirm',
        'explain_consumer_checkout_success',
      ),
    ).toBeNull();
  });

  it('does not steal product-detail checkout recommendation prompts', () => {
    const prompt =
      'What products show up after I confirm my booking in the consumer app?';
    expect(isExplainConsumerCheckoutSuccessPrompt(prompt)).toBe(false);
    expect(isExplainCheckoutRecommendationsPrompt(prompt)).toBe(true);
  });

  it('does not steal navigation prompts', () => {
    expect(
      isExplainConsumerCheckoutSuccessPrompt('View my appointments in the app'),
    ).toBe(false);
    expect(
      isExplainConsumerCheckoutSuccessPrompt('Book another haircut now'),
    ).toBe(false);
  });

  it('detects dismiss recommendations explain prompts', () => {
    const prompt =
      'What does Dismiss recommendations do on the app success screen?';
    expect(isExplainConsumerCheckoutSuccessPrompt(prompt)).toBe(true);
    expect(parseExplainConsumerCheckoutSuccessFromPrompt(prompt)?.aspect).toBe(
      'dismiss',
    );
  });

  it('does not treat bare dismiss imperative as explain', () => {
    expect(
      isExplainConsumerCheckoutSuccessPrompt('Dismiss recommendations'),
    ).toBe(false);
  });

  it('recognizes intent id', () => {
    expect(
      isConsumerCheckoutSuccessIntent('explain_consumer_checkout_success'),
    ).toBe(true);
    expect(
      isConsumerCheckoutSuccessIntent('explain_checkout_recommendations'),
    ).toBe(false);
  });
});
