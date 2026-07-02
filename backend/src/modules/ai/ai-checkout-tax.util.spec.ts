import { EXPLAIN_CHECKOUT_TAX_PROMPTS } from './ai-checkout-tax.fixtures.js';
import { CHECKOUT_TAX_MULTILINGUAL_SCENARIOS } from './ai-checkout-tax-multilingual.fixtures.js';
import {
  isCheckoutTaxIntent,
  isExplainCheckoutTaxPrompt,
  parseExplainCheckoutTaxFromPrompt,
  rescueCheckoutTaxIntent,
} from './ai-checkout-tax.util.js';

describe('ai-checkout-tax.util (ai-cmd-tax-5 / ai-cmd-customer-4.20.1)', () => {
  it.each(EXPLAIN_CHECKOUT_TAX_PROMPTS)(
    'detects explain checkout tax prompt $id',
    ({ prompt, aspect }) => {
      expect(isExplainCheckoutTaxPrompt(prompt)).toBe(true);
      expect(rescueCheckoutTaxIntent(prompt, 'unknown')).toEqual({
        action: 'explain_checkout_tax',
        rescueReason: 'explain_checkout_tax',
      });
      expect(parseExplainCheckoutTaxFromPrompt(prompt)?.aspect).toBe(aspect);
    },
  );

  it.each(CHECKOUT_TAX_MULTILINGUAL_SCENARIOS)(
    'detects multilingual checkout tax prompt $id',
    ({ prompt, aspect }) => {
      expect(isExplainCheckoutTaxPrompt(prompt)).toBe(true);
      expect(parseExplainCheckoutTaxFromPrompt(prompt)?.aspect).toBe(aspect);
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

  it('does not steal consumer app checkout tax prompts', () => {
    expect(
      isExplainCheckoutTaxPrompt(
        'Why is there a tax line on checkout in the consumer app?',
      ),
    ).toBe(false);
  });

  it('does not steal checkout total breakdown prompts', () => {
    expect(
      isExplainCheckoutTaxPrompt('Explain the checkout total on this page'),
    ).toBe(false);
  });

  it('parses checkout aspect from payment summary phrasing', () => {
    expect(
      parseExplainCheckoutTaxFromPrompt(
        'Why does the payment summary show GST on this booking page?',
      )?.aspect,
    ).toBe('checkout');
  });

  it('parses confirmation aspect from booking confirmation phrasing', () => {
    expect(
      parseExplainCheckoutTaxFromPrompt(
        'Explain the tax breakdown on the booking confirmation step before I pay',
      )?.aspect,
    ).toBe('confirmation');
  });

  it('returns null when action is already explain_checkout_tax', () => {
    expect(
      rescueCheckoutTaxIntent(
        'Why was tax added at checkout?',
        'explain_checkout_tax',
      ),
    ).toBeNull();
  });

  it('identifies checkout tax intent action', () => {
    expect(isCheckoutTaxIntent('explain_checkout_tax')).toBe(true);
    expect(isCheckoutTaxIntent('explain_consumer_checkout_tax')).toBe(false);
  });

  it('detects tax topic via fallback heuristic', () => {
    expect(
      isExplainCheckoutTaxPrompt(
        'Show the tax breakdown on this booking page?',
      ),
    ).toBe(true);
  });

  it('parses aspect via heuristic when prompt is not in fixtures', () => {
    expect(
      parseExplainCheckoutTaxFromPrompt(
        'Show the tax breakdown on this booking page?',
      ),
    ).toEqual({ aspect: 'checkout' });
  });

  it('parses service_list aspect via catalog incl. badge heuristic', () => {
    expect(
      parseExplainCheckoutTaxFromPrompt(
        'What does the incl. badge mean on catalog services on this page?',
      )?.aspect,
    ).toBe('service_list');
  });

  it('returns null parse when prompt is not checkout tax', () => {
    expect(parseExplainCheckoutTaxFromPrompt('List services')).toBeNull();
  });

  it('detects armenian booking-page tax prompts', () => {
    expect(
      isExplainCheckoutTaxPrompt('Ինչու է հարկը ավելացվում checkout-ում'),
    ).toBe(true);
  });

  it('detects cyrillic service-card incl. VAT prompts', () => {
    expect(
      isExplainCheckoutTaxPrompt('Что значит incl. VAT на карточках услуг?'),
    ).toBe(true);
  });
});
