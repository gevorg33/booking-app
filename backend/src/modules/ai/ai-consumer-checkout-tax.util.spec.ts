import {
  isExplainConsumerCheckoutTaxPrompt,
  parseExplainConsumerCheckoutTaxFromPrompt,
  rescueExplainConsumerCheckoutTaxIntent,
} from './ai-consumer-checkout-tax.util.js';
import { EXPLAIN_CONSUMER_CHECKOUT_TAX_PROMPTS } from './ai-consumer-checkout-tax.fixtures.js';
import { hasConsumerAppContext } from './ai-consumer-checkout-success.util.js';
import { isExplainConsumerCheckoutSuccessPrompt } from './ai-consumer-checkout-success.util.js';

describe('ai-consumer-checkout-tax.util', () => {
  it.each(EXPLAIN_CONSUMER_CHECKOUT_TAX_PROMPTS)(
    'detects explain_consumer_checkout_tax for $id',
    ({ prompt, aspect }) => {
      expect(isExplainConsumerCheckoutTaxPrompt(prompt)).toBe(true);
      const parsed = parseExplainConsumerCheckoutTaxFromPrompt(prompt);
      expect(parsed?.aspect).toBe(aspect);
    },
  );

  it('rescues unknown action to explain_consumer_checkout_tax', () => {
    expect(
      rescueExplainConsumerCheckoutTaxIntent(
        'Why is there a tax line on checkout in the consumer app?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_consumer_checkout_tax',
      rescueReason: 'explain_consumer_checkout_tax',
    });
  });

  it('does not rescue when action is already explain_consumer_checkout_tax', () => {
    expect(
      rescueExplainConsumerCheckoutTaxIntent(
        'Why is there a tax line on checkout in the consumer app?',
        'explain_consumer_checkout_tax',
      ),
    ).toBeNull();
  });

  it('does not steal public booking page tax questions', () => {
    expect(
      isExplainConsumerCheckoutTaxPrompt(
        'Why do I see a tax line on the booking page?',
      ),
    ).toBe(false);
  });

  it('detects lowercase and whitespace typo variants', () => {
    const original = 'Why is there a tax line on checkout in the consumer app?';
    const lowercase = original.toLowerCase();
    const noPunctuation = original.replace(/\?+$/, '');
    const doubleSpaced = original.replace(/\s+/g, '  ');
    expect(isExplainConsumerCheckoutTaxPrompt(original)).toBe(true);
    expect(hasConsumerAppContext(lowercase)).toBe(true);
    expect(isExplainConsumerCheckoutSuccessPrompt(lowercase)).toBe(false);
    expect(isExplainConsumerCheckoutTaxPrompt(lowercase)).toBe(true);
    expect(isExplainConsumerCheckoutTaxPrompt(noPunctuation)).toBe(true);
    expect(
      /\b(?:tax\s+line|tax\s+breakdown|payment\s+summary)\b/i.test(
        doubleSpaced,
      ),
    ).toBe(true);
    expect(hasConsumerAppContext(doubleSpaced)).toBe(true);
    expect(isExplainConsumerCheckoutSuccessPrompt(doubleSpaced)).toBe(false);
    expect(isExplainConsumerCheckoutTaxPrompt(doubleSpaced)).toBe(true);
  });

  it('does not steal consumer success overview without tax focus', () => {
    expect(
      isExplainConsumerCheckoutTaxPrompt(
        'What should I see right after confirming in the salon app?',
      ),
    ).toBe(false);
  });
});
