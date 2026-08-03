import {
  E2E230_LIVE_SCENARIOS,
  E2E230_NON_EXPLAIN_STILL_MATCHES,
} from './ai-e2e230-explain-subscription-vs-one-time.fixtures.js';
import { isAskPaymentOptionsPrompt } from './ai-cash-payment-checkout.util.js';
import { isConfirmMyBookingDetailsPrompt } from './ai-confirm-my-booking-details.util.js';
import {
  hasSubscriptionCheckoutCompareCue,
  isExplainSubscriptionVsOneTimePrompt,
  rescueExplainSubscriptionVsOneTimeIntent,
} from './ai-explain-subscription-vs-one-time.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES } from './ai-explain-subscription-vs-one-time.fixtures.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';

describe('e2e-bug.230 explain_subscription_vs_one_time vs confirm/choose_payment', () => {
  const rescue = new AiIntentRescueService();

  it('classifier rules forbid confirm + choose_payment steals for live phrasing', () => {
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES,
    ).toContain('should I get the subscription or just pay per visit?');
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES,
    ).toContain('NOT confirm_my_booking_details');
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES,
    ).toContain('NOT choose_payment_method');
    expect(buildCustomerClassifierSchema()).toContain(
      CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES,
    );
  });

  it.each(E2E230_LIVE_SCENARIOS.map((row) => [row.id, row] as const))(
    '$id: detectors prefer explain over confirm/choose_payment',
    (_id, row) => {
      expect(hasSubscriptionCheckoutCompareCue(row.prompt)).toBe(true);
      expect(isExplainSubscriptionVsOneTimePrompt(row.prompt)).toBe(true);
      expect(isConfirmMyBookingDetailsPrompt(row.prompt)).toBe(false);
      expect(isAskPaymentOptionsPrompt(row.prompt)).toBe(false);
      expect(
        rescueExplainSubscriptionVsOneTimeIntent(row.prompt, 'unknown')
          ?.action,
      ).toBe(row.expectedAction);
      expect(
        rescueExplainSubscriptionVsOneTimeIntent(
          row.prompt,
          'confirm_my_booking_details',
        )?.action,
      ).toBe(row.expectedAction);
      expect(
        rescueExplainSubscriptionVsOneTimeIntent(
          row.prompt,
          'choose_payment_method',
        )?.action,
      ).toBe(row.expectedAction);
    },
  );

  it.each(E2E230_LIVE_SCENARIOS.map((row) => [row.id, row] as const))(
    '$id: AiIntentRescueService remaps misroutes on public + customer',
    (_id, row) => {
      for (const surface of ['public', 'customer'] as const) {
        for (const fromAction of row.misclassifiedActions) {
          const result = rescue.rescue({
            prompt: row.prompt,
            action: fromAction,
            params: {},
            surface,
          });
          expect(result?.action).toBe(row.expectedAction);
          expect(result?.action).not.toBe('confirm_my_booking_details');
          expect(result?.action).not.toBe('choose_payment_method');
        }
      }
    },
  );

  it.each(E2E230_NON_EXPLAIN_STILL_MATCHES.map((row) => [row.id, row] as const))(
    '$id: unrelated confirm/payment-options still match',
    (_id, row) => {
      expect(isExplainSubscriptionVsOneTimePrompt(row.prompt)).toBe(false);
      if (row.kind === 'confirm') {
        expect(isConfirmMyBookingDetailsPrompt(row.prompt)).toBe(true);
      } else {
        expect(isAskPaymentOptionsPrompt(row.prompt)).toBe(true);
      }
    },
  );
});
