import {
  CONFIGURE_STRIPE_CONNECT_PROMPTS,
  isConfigureStripeConnectPrompt,
  parseConfigureStripeConnectFromPrompt,
  rescueConfigureStripeConnectIntent,
} from './ai-stripe-connect.util.js';

describe('ai-stripe-connect.util', () => {
  it.each(CONFIGURE_STRIPE_CONNECT_PROMPTS)(
    'detects configure stripe connect prompt $id',
    ({ prompt }) => {
      expect(isConfigureStripeConnectPrompt(prompt)).toBe(true);
    },
  );

  it.each(CONFIGURE_STRIPE_CONNECT_PROMPTS)(
    'parses configure stripe connect fixture $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseConfigureStripeConnectFromPrompt(prompt, {});
      expect(parsed).not.toBeNull();
      if (paramsPartial?.startOnboarding) {
        expect(parsed?.startOnboarding).toBe(true);
      }
      if (paramsPartial?.mode) {
        expect(parsed?.mode).toBe(paramsPartial.mode);
      }
    },
  );

  it.each(CONFIGURE_STRIPE_CONNECT_PROMPTS)(
    'rescues unknown action to configure_stripe_connect for $id',
    ({ prompt, expectedAction }) => {
      expect(rescueConfigureStripeConnectIntent(prompt, 'unknown')).toEqual({
        action: expectedAction,
        rescueReason: expectedAction,
      });
    },
  );

  it('does not treat stripe status questions as configure', () => {
    expect(
      isConfigureStripeConnectPrompt(
        'Is Stripe Connect ready for online payments?',
      ),
    ).toBe(false);
    expect(
      isConfigureStripeConnectPrompt('Explain why Stripe is not connected'),
    ).toBe(false);
  });

  it('does not treat subscription billing as stripe connect configure', () => {
    expect(
      isConfigureStripeConnectPrompt('Manage subscription and billing portal'),
    ).toBe(false);
  });

  it('parses compound salon checkout stripe step via forced params', () => {
    const parsed = parseConfigureStripeConnectFromPrompt(
      'Set up salon checkout end-to-end: connect Stripe, enable cash, online prepayment, booking',
      { _forceConfigureStripeConnect: true, startOnboarding: false },
    );
    expect(parsed).toEqual({
      startOnboarding: false,
      mode: undefined,
      country: undefined,
    });
  });
});
