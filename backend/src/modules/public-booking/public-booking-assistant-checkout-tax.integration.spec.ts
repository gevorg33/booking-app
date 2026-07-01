import { EXPLAIN_CHECKOUT_TAX_PROMPTS } from '../ai/ai-checkout-tax.fixtures.js';
import { CHECKOUT_TAX_CLASSIFIER_RULES } from '../ai/ai-checkout-tax.fixtures.js';
import {
  buildPublicUnderstandMock,
  resetPublicUnderstandingHarness,
} from './public-booking-assistant.integration.harness.js';

describe('public booking assistant explain_checkout_tax (ai-cmd-customer-4.20.1)', () => {
  afterEach(async () => {
    await resetPublicUnderstandingHarness();
  });

  it.each(
    EXPLAIN_CHECKOUT_TAX_PROMPTS.filter(
      (entry) =>
        entry.id === 'tax-line-booking-page' ||
        entry.id === 'what-incl-vat-means',
    ),
  )(
    'rescues explain_checkout_tax for $id via public pipeline',
    async ({ prompt, aspect }) => {
      const understand = buildPublicUnderstandMock();
      const classify = jest.fn().mockResolvedValue({
        action: 'unknown',
        params: {},
        reasoning: 'unclear',
      });

      const result = await understand.understand({
        businessId: 'biz-public',
        effectivePrompt: prompt,
        confidence: { low: 0.65, high: 0.82 },
        locale: 'en',
        businessContextBlock: 'Business: Salon',
        classify,
      });

      expect(result.action).toBe('explain_checkout_tax');
      expect(result.params?.aspect).toBe(aspect);
      expect(CHECKOUT_TAX_CLASSIFIER_RULES).toContain('explain_checkout_tax');
    },
  );
});
