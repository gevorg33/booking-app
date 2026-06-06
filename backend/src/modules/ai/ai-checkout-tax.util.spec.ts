import { EXPLAIN_CHECKOUT_TAX_PROMPTS } from './ai-checkout-tax.fixtures.js';
import {
  isExplainCheckoutTaxPrompt,
  rescueCheckoutTaxIntent,
} from './ai-checkout-tax.util.js';

describe('ai-checkout-tax.util (ai-cmd-tax-5)', () => {
  it.each(EXPLAIN_CHECKOUT_TAX_PROMPTS)(
    'detects explain checkout tax prompt $id',
    ({ prompt }) => {
      expect(isExplainCheckoutTaxPrompt(prompt)).toBe(true);
      expect(rescueCheckoutTaxIntent(prompt, 'unknown')).toEqual({
        action: 'explain_checkout_tax',
        rescueReason: 'explain_checkout_tax',
      });
    },
  );

  it('does not steal dashboard business tax explain prompts', () => {
    expect(isExplainCheckoutTaxPrompt('Explain our salon tax settings')).toBe(
      false,
    );
    expect(
      rescueCheckoutTaxIntent('Explain our salon tax settings', 'unknown'),
    ).toBeNull();
  });

  it('does not steal checkout total breakdown prompts', () => {
    expect(
      isExplainCheckoutTaxPrompt('Explain the checkout total on this page'),
    ).toBe(false);
  });
});
