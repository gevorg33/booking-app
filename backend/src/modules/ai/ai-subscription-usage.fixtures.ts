export type SubscriptionUsagePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'subscription_usage';
  rescueReason: 'subscription_usage';
};

export const CUSTOMER_SUBSCRIPTION_USAGE_CLASSIFIER_RULES = `- subscription_usage: READ — signed-in customer's raw membership/subscription usage ledger (usage event count, visits remaining) without explain framing. Triggers: "My subscription usage remaining", "Show my subscription usage", "Check my membership usage", "My plan usage history". Requires session customerId. NOT explain_my_subscription (explain-toned visits/expiry/plan summary), NOT my_subscriptions (simple plan list), NOT use_subscription_credit (apply visit credit).`;

export const SUBSCRIPTION_USAGE_PROMPTS: readonly SubscriptionUsagePromptFixture[] =
  [
    {
      id: 'subscription-usage-remaining-customer',
      prompt: 'My subscription usage remaining',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'show-subscription-usage-customer',
      prompt: 'Show my subscription usage',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'check-membership-usage-customer',
      prompt: 'Check my membership usage',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'plan-usage-this-month-customer',
      prompt: 'My plan usage this month',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'whats-my-subscription-usage-customer',
      prompt: "What's my subscription usage?",
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'membership-usage-history-customer',
      prompt: 'My membership usage history',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'how-much-usage-left-customer',
      prompt: 'How much of my subscription usage is left?',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'subscription-usage-so-far-customer',
      prompt: 'My subscription usage so far',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'track-membership-usage-customer',
      prompt: 'Track my membership usage',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'view-plan-usage-customer',
      prompt: 'View my plan usage',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'subscription-usage-stats-customer',
      prompt: 'My subscription usage stats',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'usage-on-membership-plan-customer',
      prompt: 'Usage on my membership plan',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
  ];
