export type ExplainMySubscriptionPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_my_subscription';
  rescueReason: 'explain_my_subscription';
  focus?: 'visits' | 'renewal' | 'overview' | 'status';
};

export const CUSTOMER_EXPLAIN_MY_SUBSCRIPTION_CLASSIFIER_RULES = `- explain_my_subscription: READ — signed-in customer explains their membership/subscription plan: visits remaining, included visits, expiry/renewal, plan name, recent usage summary. Triggers: "How many visits left on my plan?", "What's on my subscription?", "When does my membership expire?", "Explain my subscription". Combines account subscription list + usage context. Requires session customerId. NOT subscription_first_visit (explain plan then book named visit with credit); NOT my_subscriptions (simple list only), NOT subscription_usage (raw usage ledger without explain framing), NOT use_subscription_credit (apply visit credit), NOT discover_subscription_plans (browse salon catalog), NOT explain_subscription_vs_one_time (checkout one-time vs subscribe & save compare), NOT open_billing_settings (dashboard SaaS billing portal — "my plan" here means membership visits, not business plan), NOT explain_ai_capabilities (AI command quota), NOT summarize_my_appointments / my_appointments (booking list).`;

export const EXPLAIN_MY_SUBSCRIPTION_PROMPTS: readonly ExplainMySubscriptionPromptFixture[] =
  [
    {
      id: 'visits-left-plan-customer',
      prompt: 'How many visits left on my plan?',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'visits',
    },
    {
      id: 'visits-remaining-membership-customer',
      prompt: 'What visits do I have remaining on my membership?',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'visits',
    },
    {
      id: 'whats-on-subscription-customer',
      prompt: "What's on my subscription?",
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'status',
    },
    {
      id: 'explain-membership-customer',
      prompt: 'Explain my membership',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'overview',
    },
    {
      id: 'how-subscription-works-customer',
      prompt: 'How does my subscription work?',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'overview',
    },
    {
      id: 'when-plan-expires-customer',
      prompt: 'When does my plan expire?',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'renewal',
    },
    {
      id: 'when-membership-renews-customer',
      prompt: 'When does my membership renew?',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'renewal',
    },
    {
      id: 'credits-left-plan-customer',
      prompt: 'How many credits are left on my plan?',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'visits',
    },
    {
      id: 'tell-about-subscription-customer',
      prompt: 'Tell me about my subscription plan',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'overview',
    },
    {
      id: 'what-included-membership-customer',
      prompt: 'What is included in my membership?',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'overview',
    },
    {
      id: 'plan-status-customer',
      prompt: 'What is the status of my subscription plan?',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'status',
    },
    {
      id: 'visits-left-membership-customer',
      prompt: 'Visits left on my membership plan',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'visits',
    },
  ];

export const EXPLAIN_MY_SUBSCRIPTION_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-my-subscriptions',
    prompt: 'How many visits left on my plan?',
    misclassifiedAction: 'my_subscriptions',
    expectedAction: 'explain_my_subscription' as const,
  },
  {
    id: 'misclassified-subscription-usage',
    prompt: 'Explain my membership visits remaining',
    misclassifiedAction: 'subscription_usage',
    expectedAction: 'explain_my_subscription' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: "What's on my subscription?",
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_my_subscription' as const,
  },
  {
    id: 'misclassified-use-credit',
    prompt: 'How many visits left on my membership plan?',
    misclassifiedAction: 'use_subscription_credit',
    expectedAction: 'explain_my_subscription' as const,
  },
] as const;
