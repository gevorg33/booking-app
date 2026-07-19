import { E2E79_LIVE_SCENARIOS, E2E79_NON_EXPLAIN_STILL_MATCHES } from './ai-e2e79-explain-subscription-vs-one-time.fixtures.js';
import { isAddBookingToCalendarPrompt } from './ai-add-booking-to-calendar.util.js';
import { isCompareServicesPrompt } from './ai-compare-services.util.js';
import { isSubscriptionUsageHistoryPrompt } from './ai-customer-crm.util.js';
import {
  hasSubscriptionCheckoutCompareCue,
  isExplainSubscriptionVsOneTimePrompt,
  rescueExplainSubscriptionVsOneTimeIntent,
} from './ai-explain-subscription-vs-one-time.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES } from './ai-explain-subscription-vs-one-time.fixtures.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';

describe('e2e-bug.79 explain_subscription_vs_one_time unreachable', () => {
  const rescue = new AiIntentRescueService();

  it('customer classifier schema includes live e2e79 phrasing + NOT stealers', () => {
    const schema = buildCustomerClassifierSchema();
    expect(CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES).toContain(
      'should I get the subscription or just pay per visit?',
    );
    expect(CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES).toContain(
      'NOT compare_services',
    );
    expect(CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES).toContain(
      'NOT add_booking_to_calendar',
    );
    expect(CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES).toContain(
      'NOT subscription_usage_history',
    );
    expect(schema).toContain(
      CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES,
    );
  });

  it.each(E2E79_LIVE_SCENARIOS)(
    '$id: detectors prefer explain over calendar/compare/usage_history',
    ({ prompt }) => {
      expect(hasSubscriptionCheckoutCompareCue(prompt)).toBe(true);
      expect(isExplainSubscriptionVsOneTimePrompt(prompt)).toBe(true);
      expect(isAddBookingToCalendarPrompt(prompt)).toBe(false);
      expect(isCompareServicesPrompt(prompt)).toBe(false);
      expect(isSubscriptionUsageHistoryPrompt(prompt)).toBe(false);
      expect(
        rescueExplainSubscriptionVsOneTimeIntent(prompt, 'unknown')?.action,
      ).toBe('explain_subscription_vs_one_time');
    },
  );

  it.each(E2E79_LIVE_SCENARIOS)(
    '$id: AiIntentRescueService remaps misroutes on customer surface',
    ({ prompt, expectedAction, misclassifiedActions }) => {
      for (const fromAction of misclassifiedActions) {
        const result = rescue.rescue({
          prompt,
          action: fromAction,
          params: {},
          surface: 'customer',
        });
        expect(result?.action).toBe(expectedAction);
        expect(result?.action).not.toBe('add_booking_to_calendar');
        expect(result?.action).not.toBe('compare_services');
        expect(result?.action).not.toBe('subscription_usage_history');
      }
    },
  );

  it.each(E2E79_NON_EXPLAIN_STILL_MATCHES)(
    '$id: unrelated calendar/compare still match',
    ({ prompt, kind }) => {
      expect(isExplainSubscriptionVsOneTimePrompt(prompt)).toBe(false);
      if (kind === 'calendar') {
        expect(isAddBookingToCalendarPrompt(prompt)).toBe(true);
      } else {
        expect(isCompareServicesPrompt(prompt)).toBe(true);
      }
    },
  );
});
