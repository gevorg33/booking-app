import { EXPLAIN_PROVIDER_PAYMENT_CURRENCY_PROMPTS } from './ai-provider-payment-currency.fixtures.js';
import {
  isExplainProviderPaymentCurrencyPrompt,
  isProviderPaymentCurrencyIntent,
  rescueProviderPaymentCurrencyIntent,
} from './ai-provider-payment-currency.util.js';

describe('ai-provider-payment-currency.util (ai-cmd-curr-8)', () => {
  it.each(EXPLAIN_PROVIDER_PAYMENT_CURRENCY_PROMPTS)(
    'detects explain provider payment currency prompt $id',
    ({ prompt }) => {
      expect(isExplainProviderPaymentCurrencyPrompt(prompt)).toBe(true);
    },
  );

  it('does not steal explain_payment_status prompts', () => {
    expect(
      isExplainProviderPaymentCurrencyPrompt(
        'Explain payment status for this booking',
      ),
    ).toBe(false);
    expect(
      rescueProviderPaymentCurrencyIntent(
        'Explain payment status for this booking',
        'unknown',
      ),
    ).toBeNull();
  });

  it('does not steal customer checkout currency prompts', () => {
    expect(
      isExplainProviderPaymentCurrencyPrompt(
        'Why do prices show euros on the booking page?',
      ),
    ).toBe(false);
  });

  it('rescues misclassified provider POS currency prompts', () => {
    expect(
      rescueProviderPaymentCurrencyIntent(
        'Why is the payment breakdown in euros for this appointment?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_provider_payment_currency',
      rescueReason: 'explain_provider_payment_currency',
    });
  });

  it('recognizes provider payment currency intent id', () => {
    expect(
      isProviderPaymentCurrencyIntent('explain_provider_payment_currency'),
    ).toBe(true);
    expect(isProviderPaymentCurrencyIntent('explain_payment_status')).toBe(
      false,
    );
  });
});
