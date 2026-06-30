import {
  CUSTOMER_SUBSCRIPTION_MEMBERSHIP_CLASSIFIER_RULES,
  MY_SUBSCRIPTIONS_PROMPTS,
  SUBSCRIPTION_MEMBERSHIP_CUSTOMER_PROMPTS,
  USE_SUBSCRIPTION_CREDIT_PROMPTS,
  detectMembershipCustomerAction,
  enrichUseSubscriptionCreditParamsFromPrompt,
  isMySubscriptionsPrompt,
  isUseSubscriptionCreditPrompt,
  rescueMembershipCustomerIntent,
} from './ai-subscription-membership-customer.util.js';
import { AI_COMMAND_EVAL_SUBSCRIPTION_MEMBERSHIP_CUSTOMER_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { rescueCustomerCrmIntent } from './ai-customer-crm.util.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';

describe('ai-subscription-membership-customer.util (ai-cmd-customer-4.0 P1)', () => {
  it('exports classifier rules for membership visits', () => {
    expect(CUSTOMER_SUBSCRIPTION_MEMBERSHIP_CLASSIFIER_RULES).toContain(
      'use_subscription_credit',
    );
    expect(CUSTOMER_SUBSCRIPTION_MEMBERSHIP_CLASSIFIER_RULES).toContain(
      'my_subscriptions',
    );
  });

  it.each(
    SUBSCRIPTION_MEMBERSHIP_CUSTOMER_PROMPTS.map((row) => [row.id, row] as const),
  )('detects membership prompt $id', (_id, row) => {
    expect(detectMembershipCustomerAction(row.prompt)).toBe(row.expectedAction);
  });

  it.each(
    SUBSCRIPTION_MEMBERSHIP_CUSTOMER_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues membership prompt $id from unknown', (_id, row) => {
    const rescued = rescueMembershipCustomerIntent(row.prompt, 'unknown');
    expect(rescued?.action).toBe(row.expectedAction);
    expect(rescued?.rescueReason).toBe(row.rescueReason);
  });

  it.each(USE_SUBSCRIPTION_CREDIT_PROMPTS.map((row) => [row.id, row] as const))(
    'detects use-subscription-credit prompt $id via self-service helper',
    (_id, row) => {
      expect(isUseSubscriptionCreditPrompt(row.prompt)).toBe(true);
      expect(rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action).toBe(
        'use_subscription_credit',
      );
    },
  );

  it.each(MY_SUBSCRIPTIONS_PROMPTS.map((row) => [row.id, row] as const))(
    'detects my-subscriptions prompt $id via CRM helper',
    (_id, row) => {
      expect(isMySubscriptionsPrompt(row.prompt)).toBe(true);
      expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
        'my_subscriptions',
      );
    },
  );

  it('enriches serviceName and date from membership booking phrasing', () => {
    expect(
      enrichUseSubscriptionCreditParamsFromPrompt(
        {},
        "Use my membership for today's massage",
        'UTC',
      ),
    ).toEqual(
      expect.objectContaining({
        serviceName: 'massage',
        date: expect.any(String),
      }),
    );
  });

  it('does not steal subscription usage or plan discovery prompts', () => {
    expect(
      detectMembershipCustomerAction('How many visits left on my plan?'),
    ).toBeNull();
    expect(
      rescueMembershipCustomerIntent(
        'How many visits left on my plan?',
        'unknown',
      ),
    ).toBeNull();
    expect(
      detectMembershipCustomerAction('What subscription plans do you offer?'),
    ).toBeNull();
    expect(isMySubscriptionsPrompt('Use my membership for massage')).toBe(
      false,
    );
  });

  it('maps membership fixtures to passing eval golden cases', () => {
    expect(USE_SUBSCRIPTION_CREDIT_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(MY_SUBSCRIPTIONS_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_SUBSCRIPTION_MEMBERSHIP_CUSTOMER_CASES.length).toBe(
      SUBSCRIPTION_MEMBERSHIP_CUSTOMER_PROMPTS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_SUBSCRIPTION_MEMBERSHIP_CUSTOMER_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
