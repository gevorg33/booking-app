import {
  EXPLAIN_MY_SUBSCRIPTION_PROMPTS,
  EXPLAIN_MY_SUBSCRIPTION_RESCUE_SCENARIOS,
  CUSTOMER_EXPLAIN_MY_SUBSCRIPTION_CLASSIFIER_RULES,
} from './ai-explain-my-subscription.fixtures.js';
import { EXPLAIN_MY_SUBSCRIPTION_MULTILINGUAL_SCENARIOS } from './ai-explain-my-subscription-multilingual.fixtures.js';
import {
  buildMySubscriptionExplainCopy,
  isExplainMySubscriptionIntent,
  isExplainMySubscriptionPrompt,
  parseExplainMySubscriptionFromPrompt,
  rescueExplainMySubscriptionIntent,
} from './ai-explain-my-subscription.util.js';
import {
  isMySubscriptionsPrompt,
  rescueCustomerCrmIntent,
} from './ai-customer-crm.util.js';
import { isUseSubscriptionCreditPrompt } from './ai-self-service-booking.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_MY_SUBSCRIPTION_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-explain-my-subscription.util (ai-cmd-customer-4.5.3)', () => {
  it('exports classifier rules for explain_my_subscription', () => {
    expect(CUSTOMER_EXPLAIN_MY_SUBSCRIPTION_CLASSIFIER_RULES).toContain(
      'explain_my_subscription',
    );
  });

  it.each(EXPLAIN_MY_SUBSCRIPTION_PROMPTS.map((row) => [row.id, row] as const))(
    'detects explain_my_subscription for $id',
    (_id, row) => {
      expect(isExplainMySubscriptionPrompt(row.prompt)).toBe(true);
      expect(
        rescueExplainMySubscriptionIntent(row.prompt, 'unknown')?.action,
      ).toBe('explain_my_subscription');
      expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
        'explain_my_subscription',
      );
    },
  );

  it.each(
    EXPLAIN_MY_SUBSCRIPTION_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain_my_subscription for $id', (_id, row) => {
    expect(isExplainMySubscriptionPrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_MY_SUBSCRIPTION_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueExplainMySubscriptionIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('explain_my_subscription');
  });

  it('does not classify list or apply prompts as explain', () => {
    expect(isExplainMySubscriptionPrompt('Show my subscriptions')).toBe(false);
    expect(isMySubscriptionsPrompt('Show my subscriptions')).toBe(true);
    expect(isExplainMySubscriptionPrompt('Use my membership for massage')).toBe(
      false,
    );
    expect(isUseSubscriptionCreditPrompt('Use my membership for massage')).toBe(
      false,
    );
  });

  it('builds copy for visits and empty states', () => {
    expect(
      buildMySubscriptionExplainCopy({
        focus: 'visits',
        subscriptions: [
          {
            planName: 'Monthly Massage',
            serviceName: 'Massage',
            appointmentsRemaining: 2,
            appointmentsIncluded: 5,
            status: 'active',
            expiresAt: new Date('2026-12-01T00:00:00.000Z'),
          },
        ],
      }).summary,
    ).toContain('2 of 5');
    expect(
      buildMySubscriptionExplainCopy({
        focus: 'renewal',
        subscriptions: [
          {
            planName: 'Monthly Massage',
            appointmentsRemaining: 2,
            appointmentsIncluded: 5,
            status: 'active',
            expiresAt: new Date('2026-12-01T00:00:00.000Z'),
          },
        ],
      }).summary,
    ).toContain('expires');
    expect(
      buildMySubscriptionExplainCopy({
        focus: 'status',
        subscriptions: [
          {
            planName: 'Monthly Massage',
            appointmentsRemaining: 2,
            appointmentsIncluded: 5,
            status: 'active',
            usageEventCount: 3,
          },
        ],
      }).summary,
    ).toContain('Status: active');
    expect(
      buildMySubscriptionExplainCopy({
        focus: 'overview',
        subscriptions: [
          {
            planName: 'Plan A',
            appointmentsRemaining: 1,
            appointmentsIncluded: 4,
            status: 'active',
          },
          {
            planName: 'Plan B',
            appointmentsRemaining: 2,
            appointmentsIncluded: 4,
            status: 'active',
          },
        ],
      }).summary,
    ).toContain('other subscription');
    expect(
      buildMySubscriptionExplainCopy({
        focus: 'overview',
        subscriptions: [],
      }).summary,
    ).toContain('do not have a subscription');
  });

  it('detects discover and multilingual explain prompts', () => {
    expect(
      isExplainMySubscriptionPrompt('Discover subscription plans for massage'),
    ).toBe(false);
    expect(isExplainMySubscriptionPrompt('When does my plan expire?')).toBe(
      true,
    );
    expect(
      parseExplainMySubscriptionFromPrompt('When does my plan expire?')?.focus,
    ).toBe('renewal');
  });

  it('parseExplainMySubscriptionFromPrompt returns null for list prompts', () => {
    expect(
      parseExplainMySubscriptionFromPrompt('Show my subscriptions'),
    ).toBeNull();
  });

  it('returns null rescue when action already matches', () => {
    expect(
      rescueExplainMySubscriptionIntent(
        'How many visits left on my plan?',
        'explain_my_subscription',
      ),
    ).toBeNull();
    expect(isExplainMySubscriptionIntent('explain_my_subscription')).toBe(true);
  });

  it('maps every fixture to eval cases', () => {
    expect(EXPLAIN_MY_SUBSCRIPTION_PROMPTS.length).toBeGreaterThanOrEqual(12);
    expect(
      AI_COMMAND_EVAL_EXPLAIN_MY_SUBSCRIPTION_CASES.length,
    ).toBeGreaterThanOrEqual(
      EXPLAIN_MY_SUBSCRIPTION_PROMPTS.length +
        EXPLAIN_MY_SUBSCRIPTION_MULTILINGUAL_SCENARIOS.length,
    );
  });
});
