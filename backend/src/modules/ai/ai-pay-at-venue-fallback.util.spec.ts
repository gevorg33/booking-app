import {
  PAY_AT_VENUE_FALLBACK_PROMPTS,
  PAY_AT_VENUE_FALLBACK_RESCUE_SCENARIOS,
} from './ai-pay-at-venue-fallback.fixtures.js';
import { PAY_AT_VENUE_FALLBACK_MULTILINGUAL_SCENARIOS } from './ai-pay-at-venue-fallback-multilingual.fixtures.js';
import {
  isPayAtVenueFallbackPrompt,
  parsePayAtVenueFallbackFromPrompt,
  rescuePayAtVenueFallbackIntent,
  buildPayAtVenueFallbackNavigate,
  isExplicitPayCashAtVisitWithoutFallbackPrompt,
} from './ai-pay-at-venue-fallback.util.js';
import { isExplicitPayCashAtVisitPrompt } from './ai-cash-payment-checkout.util.js';
import { isConsumerDiagnoseStripeCheckoutFailurePrompt } from './ai-diagnose-stripe-checkout-failure.util.js';

describe('ai-pay-at-venue-fallback.util (ai-cmd-customer-4.18.2)', () => {
  it.each(PAY_AT_VENUE_FALLBACK_PROMPTS)(
    'detects fallback prompt $id',
    ({ prompt }) => {
      expect(isPayAtVenueFallbackPrompt(prompt)).toBe(true);
    },
  );

  it.each(PAY_AT_VENUE_FALLBACK_MULTILINGUAL_SCENARIOS)(
    'detects multilingual fallback prompt $id',
    ({ prompt }) => {
      expect(isPayAtVenueFallbackPrompt(prompt)).toBe(true);
    },
  );

  it.each(PAY_AT_VENUE_FALLBACK_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescuePayAtVenueFallbackIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('does not rescue when action is already pay_at_venue_fallback', () => {
    expect(
      rescuePayAtVenueFallbackIntent(
        'Skip online payment',
        'pay_at_venue_fallback',
      ),
    ).toBeNull();
  });

  it('does not steal pay_cash_at_visit direct prompts', () => {
    expect(isPayAtVenueFallbackPrompt('Pay cash at visit')).toBe(false);
    expect(isExplicitPayCashAtVisitPrompt('Pay cash at visit')).toBe(true);
    expect(
      isExplicitPayCashAtVisitWithoutFallbackPrompt('Pay cash at visit'),
    ).toBe(true);
  });

  it('does not steal diagnose failure prompts', () => {
    expect(isPayAtVenueFallbackPrompt('Payment failed — what now?')).toBe(
      false,
    );
    expect(
      isConsumerDiagnoseStripeCheckoutFailurePrompt(
        'Payment failed — what now?',
      ),
    ).toBe(true);
  });

  it('steals instead-cash prompts from pay_cash_at_visit', () => {
    expect(
      isPayAtVenueFallbackPrompt('Pay cash at visit instead of online'),
    ).toBe(true);
    expect(
      isExplicitPayCashAtVisitPrompt('Pay cash at visit instead of online'),
    ).toBe(false);
  });

  it('builds checkout navigate with skipOnline flags', () => {
    expect(
      buildPayAtVenueFallbackNavigate({
        serviceId: 'svc-1',
        startTime: '2026-06-25T14:00:00.000Z',
      }),
    ).toEqual({
      path: 'checkout',
      query: {
        serviceId: 'svc-1',
        startTime: '2026-06-25T14:00:00.000Z',
        payment: 'cash',
        payAtVenue: '1',
        skipOnline: '1',
      },
    });
  });

  it('parsePayAtVenueFallbackFromPrompt returns skip flag', () => {
    expect(parsePayAtVenueFallbackFromPrompt('Skip online payment')).toEqual({
      skipOnlinePayment: true,
    });
  });
});
