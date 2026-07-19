export const CUSTOMER_SELECT_SUBSCRIPTION_PLAN_CLASSIFIER_RULES = `- select_subscription_plan: MUTATE — signed-in customer picks/subscribes to a new membership/subscription plan from the salon's catalog. Triggers: select|choose|pick|sign up for|subscribe to + subscription|membership|plan. NOT discover_subscription_plans (browse catalog, read-only), NOT use_subscription_credit (apply an existing plan's visit credit), NOT my_subscriptions (list plans already owned), NOT explain_subscription_vs_one_time (checkout compare).`;

export type SelectSubscriptionPlanPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'select_subscription_plan';
  rescueReason: string;
};

export const SELECT_SUBSCRIPTION_PLAN_PROMPTS: readonly SelectSubscriptionPlanPromptFixture[] =
  [
    {
      id: 'choose-monthly-plan-customer',
      prompt: 'Choose the monthly plan',
      surface: 'customer',
      expectedAction: 'select_subscription_plan',
      rescueReason: 'select_plan',
    },
    {
      id: 'sign-up-unlimited-membership-customer',
      prompt: 'Sign up for the unlimited membership',
      surface: 'customer',
      expectedAction: 'select_subscription_plan',
      rescueReason: 'select_plan',
    },
    {
      id: 'subscribe-to-gold-plan-customer',
      prompt: 'Subscribe to the Gold plan',
      surface: 'customer',
      expectedAction: 'select_subscription_plan',
      rescueReason: 'select_plan',
    },
    {
      id: 'pick-quarterly-membership-customer',
      prompt: 'Pick the quarterly membership',
      surface: 'customer',
      expectedAction: 'select_subscription_plan',
      rescueReason: 'select_plan',
    },
    {
      id: 'select-basic-plan-customer',
      prompt: 'Select the basic plan',
      surface: 'customer',
      expectedAction: 'select_subscription_plan',
      rescueReason: 'select_plan',
    },
    {
      id: 'pick-premium-membership-customer',
      prompt: 'Pick the premium membership for me',
      surface: 'customer',
      expectedAction: 'select_subscription_plan',
      rescueReason: 'select_plan',
    },
    {
      id: 'choose-vip-subscription-customer',
      prompt: 'Choose the VIP subscription',
      surface: 'customer',
      expectedAction: 'select_subscription_plan',
      rescueReason: 'select_plan',
    },
    {
      id: 'sign-up-for-plan-customer',
      prompt: 'Sign up for a plan',
      surface: 'customer',
      expectedAction: 'select_subscription_plan',
      rescueReason: 'select_plan',
    },
    {
      id: 'pick-the-annual-plan-customer',
      prompt: 'Pick the annual plan',
      surface: 'customer',
      expectedAction: 'select_subscription_plan',
      rescueReason: 'select_plan',
    },
    {
      id: 'subscribe-to-monthly-membership-customer',
      prompt: 'Subscribe to the monthly membership',
      surface: 'customer',
      expectedAction: 'select_subscription_plan',
      rescueReason: 'select_plan',
    },
    {
      id: 'choose-standard-membership-customer',
      prompt: 'Choose the standard membership for me',
      surface: 'customer',
      expectedAction: 'select_subscription_plan',
      rescueReason: 'select_plan',
    },
  ];
