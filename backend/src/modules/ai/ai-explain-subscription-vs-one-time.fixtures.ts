export type ExplainSubscriptionVsOneTimeFocus =
  | 'compare'
  | 'whichPlan'
  | 'useExisting'
  | 'options';

export type ExplainSubscriptionVsOneTimePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_subscription_vs_one_time';
  rescueReason: 'subscription_vs_one_time';
  serviceName?: string;
  planName?: string;
  focus?: ExplainSubscriptionVsOneTimeFocus;
};

export const CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES = `- explain_subscription_vs_one_time: READ — explain checkout subscription choices for a service: One-time appointment (pay per visit), Subscribe & save (buy a membership plan with included visits), and Use subscription (apply an existing visit credit when signed in). Triggers: subscribe and save vs one visit, subscription or one-time, which plan includes massage, use my subscription or pay once, explain checkout subscription options, "should I get the subscription or just pay per visit?", "explain the difference between the subscription plan and paying one time", "is the Monthly Massage Plan subscription better value than paying per visit?". Set serviceName when the user names a service; planName when they name a plan. Summarize per-visit price, plan visits/months, savings, and remaining credits. NOT explain_my_subscription (visits left/expiry on account), NOT discover_subscription_plans (list catalog only), NOT select_subscription_plan (pick plan mutate), NOT use_subscription_credit (apply credit mutate), NOT explain_package_savings (multi-service bundle), NOT compare_services (catalog service A vs B — subscription vs one-time is not two services), NOT add_booking_to_calendar (calendar/ICS only), NOT subscription_usage_history (dashboard staff usage ledger).`;

export const EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_PROMPTS: readonly ExplainSubscriptionVsOneTimePromptFixture[] =
  [
    {
      id: 'subscribe-save-vs-one-visit-public',
      prompt: 'Subscribe and save vs one visit?',
      surface: 'public',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'compare',
    },
    {
      id: 'subscription-vs-one-time-public',
      prompt:
        "What's the difference between subscription and one-time booking?",
      surface: 'public',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'compare',
    },
    {
      id: 'which-plan-includes-massage-public',
      prompt: 'Which plan includes massage?',
      surface: 'public',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      serviceName: 'massage',
      focus: 'whichPlan',
    },
    {
      id: 'subscribe-or-pay-per-visit-public',
      prompt: 'Should I subscribe or pay per visit?',
      surface: 'public',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'compare',
    },
    {
      id: 'explain-subscribe-save-checkout-public',
      prompt: 'Explain subscribe and save at checkout',
      surface: 'public',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'options',
    },
    {
      id: 'membership-cheaper-than-once-public',
      prompt: 'Is a membership cheaper than booking once?',
      surface: 'public',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'compare',
    },
    {
      id: 'which-plan-haircut-public',
      prompt: 'Which subscription plan covers haircuts?',
      surface: 'public',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      serviceName: 'haircut',
      focus: 'whichPlan',
    },
    {
      id: 'one-time-or-subscribe-public',
      prompt: 'One-time appointment or subscribe and save?',
      surface: 'public',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'compare',
    },
    {
      id: 'subscribe-save-vs-one-visit-customer',
      prompt: 'Subscribe and save vs one visit for my haircut?',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      serviceName: 'haircut',
      focus: 'compare',
    },
    {
      id: 'use-subscription-or-pay-once-customer',
      prompt: 'Use my subscription or pay once at checkout?',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'useExisting',
    },
    {
      id: 'subscription-credit-or-one-time-customer',
      prompt: 'Should I use subscription credit or one-time appointment?',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'useExisting',
    },
    {
      id: 'which-plan-facial-customer',
      prompt: 'Which plan includes facial treatments?',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      serviceName: 'facial',
      focus: 'whichPlan',
    },
    {
      id: 'checkout-how-to-book-customer',
      prompt: 'How do I choose between one-time and subscribe and save?',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'options',
    },
    {
      id: 'membership-vs-single-visit-customer',
      prompt: 'Membership vs single visit — what should I pick?',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'compare',
    },
    {
      id: 'e2e79-get-subscription-or-pay-per-visit-customer',
      prompt: 'should I get the subscription or just pay per visit?',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'compare',
    },
    {
      id: 'e2e79-difference-subscription-vs-one-time-customer',
      prompt:
        'explain the difference between the subscription plan and paying one time',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'compare',
    },
    {
      id: 'e2e79-monthly-plan-better-value-customer',
      prompt:
        'is the Monthly Massage Plan subscription better value than paying per visit?',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      planName: 'Monthly Massage',
      serviceName: 'Massage',
      focus: 'compare',
    },
  ];

export const EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-discover-subscription-plans',
    prompt: 'Subscribe and save vs one visit?',
    misclassifiedAction: 'discover_subscription_plans',
    surface: 'public' as const,
  },
  {
    id: 'misclassified-explain-my-subscription',
    prompt: 'Use my subscription or pay once at checkout?',
    misclassifiedAction: 'explain_my_subscription',
    surface: 'customer' as const,
  },
  {
    id: 'misclassified-select-plan',
    prompt: 'Which plan includes massage?',
    misclassifiedAction: 'select_subscription_plan',
    surface: 'public' as const,
  },
  {
    id: 'misclassified-use-credit',
    prompt: 'Should I use subscription credit or one-time appointment?',
    misclassifiedAction: 'use_subscription_credit',
    surface: 'customer' as const,
  },
  {
    id: 'e2e79-misclassified-add-booking-to-calendar',
    prompt: 'should I get the subscription or just pay per visit?',
    misclassifiedAction: 'add_booking_to_calendar',
    surface: 'customer' as const,
  },
  {
    id: 'e2e79-misclassified-compare-services',
    prompt:
      'explain the difference between the subscription plan and paying one time',
    misclassifiedAction: 'compare_services',
    surface: 'customer' as const,
  },
  {
    id: 'e2e79-misclassified-subscription-usage-history',
    prompt:
      'is the Monthly Massage Plan subscription better value than paying per visit?',
    misclassifiedAction: 'subscription_usage_history',
    surface: 'customer' as const,
  },
] as const;
