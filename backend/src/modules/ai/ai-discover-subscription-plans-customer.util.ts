export const CUSTOMER_DISCOVER_SUBSCRIPTION_PLANS_CLASSIFIER_RULES = `- discover_subscription_plans: READ — browse the salon's available membership/subscription plans (catalog, no sign-up). Triggers: what|which|show|list|discover + subscription|membership plans; can my plan cover a service. NOT select_subscription_plan (pick/subscribe mutate), NOT my_subscriptions (list plans already owned), NOT use_subscription_credit (apply an owned plan's credit), NOT explain_subscription_vs_one_time (checkout compare).`;

export type DiscoverSubscriptionPlansPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'discover_subscription_plans';
  rescueReason: string;
};

export const DISCOVER_SUBSCRIPTION_PLANS_PROMPTS: readonly DiscoverSubscriptionPlansPromptFixture[] =
  [
    {
      id: 'what-subscription-plans-customer',
      prompt: 'What subscription plans do you offer?',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'show-membership-plans-customer',
      prompt: 'Show me your membership plans',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'list-available-subscription-plans-customer',
      prompt: 'List your available subscription plans',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'which-membership-plans-customer',
      prompt: 'Which membership plans do you have?',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'discover-subscription-plans-customer',
      prompt: 'I want to discover your subscription plans',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'what-membership-options-customer',
      prompt: 'What membership plans are available?',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'show-all-subscription-plans-customer',
      prompt: 'Show subscription plans',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'what-plans-can-i-subscribe-customer',
      prompt: 'What subscription plans do you currently have?',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'list-membership-plans-customer',
      prompt: 'List membership plans',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'what-are-your-subscription-plans-customer',
      prompt: 'What are your subscription plans?',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'show-available-membership-plans-customer',
      prompt: 'Show available membership plans',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
  ];
