import { EXPLAIN_STRIPE_TAX_CHARGE_PROMPTS } from './ai-stripe-tax-charge.fixtures.js';
import {
  parseExplainStripeTaxChargeFromPrompt,
  rescueStripeTaxChargeIntent,
} from './ai-stripe-tax-charge.util.js';

describe('ai-stripe-tax-charge.util (ai-cmd-tax-9)', () => {
  it.each(EXPLAIN_STRIPE_TAX_CHARGE_PROMPTS)(
    'rescues explain stripe tax charge prompt $id',
    ({ prompt }) => {
      expect(rescueStripeTaxChargeIntent(prompt, 'unknown')).toEqual({
        action: 'explain_stripe_tax_charge',
        rescueReason: 'explain_stripe_tax_charge',
      });
    },
  );

  it('parses booking id and customer name from prompt', () => {
    expect(
      parseExplainStripeTaxChargeFromPrompt(
        "Why did Stripe charge $120 for Jane's booking?",
      ),
    ).toEqual({ customerName: 'Jane' });
    expect(
      parseExplainStripeTaxChargeFromPrompt(
        'Explain the VAT on our Stripe payment for booking bk-tax-001',
      ),
    ).toEqual({ bookingId: 'bk-tax-001' });
  });

  it('does not rescue stripe currency-only prompts', () => {
    expect(
      rescueStripeTaxChargeIntent(
        'Why was I charged in euros on Stripe checkout?',
        'unknown',
      ),
    ).toBeNull();
  });
});
