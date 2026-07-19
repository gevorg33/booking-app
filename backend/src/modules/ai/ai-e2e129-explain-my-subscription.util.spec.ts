import {
  E2E129_BILLING_STILL_MATCH,
  E2E129_EXPLAIN_MY_SUBSCRIPTION_SCENARIOS,
} from './ai-e2e129-explain-my-subscription.fixtures.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  isOpenBillingSettingsPrompt,
  rescueBillingLoyaltyDashboardIntent,
} from './ai-billing-loyalty-dashboard.util.js';
import {
  isExplainMySubscriptionPrompt,
  rescueExplainMySubscriptionIntent,
} from './ai-explain-my-subscription.util.js';
import { isExplainAiCapabilitiesPrompt } from './ai-meta-ops.util.js';

describe('e2e-bug.129 explain_my_subscription reachable', () => {
  const rescue = new AiIntentRescueService();

  it.each(E2E129_EXPLAIN_MY_SUBSCRIPTION_SCENARIOS.map((s) => [s.id, s]))(
    'detectors keep %s on explain_my_subscription',
    (_id, row) => {
      expect(isExplainMySubscriptionPrompt(row.prompt)).toBe(true);
      expect(isOpenBillingSettingsPrompt(row.prompt)).toBe(false);
      expect(isExplainAiCapabilitiesPrompt(row.prompt)).toBe(false);
      expect(
        rescueExplainMySubscriptionIntent(row.prompt, 'open_billing_settings')
          ?.action,
      ).toBe('explain_my_subscription');
      expect(
        rescueBillingLoyaltyDashboardIntent(row.prompt, 'unknown'),
      ).toBeNull();
    },
  );

  it.each(E2E129_EXPLAIN_MY_SUBSCRIPTION_SCENARIOS.map((s) => [s.id, s]))(
    'AiIntentRescueService remaps wrong actions for %s',
    (_id, row) => {
      for (const fromAction of row.misclassifiedActions) {
        const result = rescue.rescue({
          prompt: row.prompt,
          action: fromAction,
          params: {},
          surface: row.surface,
        });
        expect(result?.action).toBe(row.expectedAction);
        expect(result?.action).not.toBe('open_billing_settings');
        expect(result?.action).not.toBe('explain_ai_capabilities');
        expect(result?.action).not.toBe('summarize_my_appointments');
      }
    },
  );

  it.each(E2E129_BILLING_STILL_MATCH.map((s) => [s.id, s.prompt]))(
    'dashboard billing still matches %s',
    (_id, prompt) => {
      expect(isOpenBillingSettingsPrompt(prompt)).toBe(true);
      const result = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        surface: 'dashboard',
      });
      expect(result?.action).toBe('open_billing_settings');
    },
  );

  it('customer surface does not rescue visits-left to open_billing_settings', () => {
    const result = rescue.rescue({
      prompt: 'How many visits left on my plan?',
      action: 'unknown',
      params: {},
      surface: 'customer',
    });
    expect(result?.action).toBe('explain_my_subscription');
  });
});
