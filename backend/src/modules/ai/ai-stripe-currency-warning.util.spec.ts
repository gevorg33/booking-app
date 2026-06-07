import { EXPLAIN_STRIPE_CURRENCY_WARNING_PROMPTS } from './ai-stripe-currency-warning.fixtures.js';
import {
  isExplainStripeCurrencyWarningPrompt,
  isStripeCurrencyWarningIntent,
  rescueStripeCurrencyWarningIntent,
} from './ai-stripe-currency-warning.util.js';

describe('ai-stripe-currency-warning.util (ai-cmd-curr-10)', () => {
  it.each(EXPLAIN_STRIPE_CURRENCY_WARNING_PROMPTS)(
    'detects explain stripe currency warning prompt $id',
    ({ prompt }) => {
      expect(isExplainStripeCurrencyWarningPrompt(prompt)).toBe(true);
    },
  );

  it('does not steal configure business currency prompts', () => {
    expect(
      isExplainStripeCurrencyWarningPrompt('Set default currency to AMD'),
    ).toBe(false);
  });

  it('does not steal general business currency explain prompts', () => {
    expect(
      isExplainStripeCurrencyWarningPrompt('What is our default currency?'),
    ).toBe(false);
    expect(
      isExplainStripeCurrencyWarningPrompt(
        'Is Stripe supported for our currency?',
      ),
    ).toBe(false);
  });

  it('does not steal customer explain_why_stripe_required prompts', () => {
    expect(
      isExplainStripeCurrencyWarningPrompt(
        'Why is Stripe required for checkout?',
      ),
    ).toBe(false);
  });

  it('does not rescue when action is already explain_stripe_currency_warning', () => {
    expect(
      rescueStripeCurrencyWarningIntent(
        'Why does Settings show a Stripe Connect warning for our currency?',
        'explain_stripe_currency_warning',
      ),
    ).toBeNull();
  });

  it('rescues misclassified Settings Stripe warning prompts', () => {
    expect(
      rescueStripeCurrencyWarningIntent(
        'Why does Settings show a Stripe Connect warning for our currency?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_stripe_currency_warning',
      rescueReason: 'explain_stripe_currency_warning',
    });
  });

  it('recognizes stripe currency warning intent id', () => {
    expect(
      isStripeCurrencyWarningIntent('explain_stripe_currency_warning'),
    ).toBe(true);
    expect(isStripeCurrencyWarningIntent('explain_business_currency')).toBe(
      false,
    );
  });
});
