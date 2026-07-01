import {
  CONFIGURE_CHECKOUT_DEFAULTS_PROMPTS,
  isConfigureCheckoutDefaultsPrompt,
  parseConfigureCheckoutDefaultsFromPrompt,
  rescueConfigureCheckoutDefaultsIntent,
} from './ai-checkout-defaults.util.js';

describe('ai-checkout-defaults.util', () => {
  it.each(CONFIGURE_CHECKOUT_DEFAULTS_PROMPTS)(
    'detects configure checkout defaults prompt $id',
    ({ prompt }) => {
      expect(isConfigureCheckoutDefaultsPrompt(prompt)).toBe(true);
    },
  );

  it.each(CONFIGURE_CHECKOUT_DEFAULTS_PROMPTS)(
    'parses configure checkout defaults fixture $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseConfigureCheckoutDefaultsFromPrompt(prompt, {});
      expect(parsed).not.toBeNull();
      if (paramsPartial?.acceptCashPayments !== undefined) {
        expect(parsed?.acceptCashPayments).toBe(
          paramsPartial.acceptCashPayments,
        );
      }
      if (paramsPartial?.defaultServicePrepaymentMode) {
        expect(parsed?.defaultServicePrepaymentMode).toBe(
          paramsPartial.defaultServicePrepaymentMode,
        );
      }
      if (paramsPartial?.defaultServiceDepositPercent !== undefined) {
        expect(parsed?.defaultServiceDepositPercent).toBe(
          paramsPartial.defaultServiceDepositPercent,
        );
      }
    },
  );

  it.each(CONFIGURE_CHECKOUT_DEFAULTS_PROMPTS)(
    'rescues unknown action to configure_checkout_defaults for $id',
    ({ prompt, expectedAction }) => {
      expect(rescueConfigureCheckoutDefaultsIntent(prompt, 'unknown')).toEqual({
        action: expectedAction,
        rescueReason: expectedAction,
      });
    },
  );

  it('does not treat existing catalog online payment as checkout defaults', () => {
    expect(
      isConfigureCheckoutDefaultsPrompt(
        'Accept online payment on public booking for all services with 50% prepayment',
      ),
    ).toBe(false);
    expect(
      isConfigureCheckoutDefaultsPrompt('Enable cash payments for checkout'),
    ).toBe(false);
  });

  it('does not treat explain setup as checkout defaults', () => {
    expect(
      isConfigureCheckoutDefaultsPrompt(
        'Explain service online payment setup for our catalog',
      ),
    ).toBe(false);
  });
});
