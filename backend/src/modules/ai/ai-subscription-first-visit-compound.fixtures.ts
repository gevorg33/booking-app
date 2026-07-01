export type SubscriptionFirstVisitCompoundFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  orderedActions: readonly string[];
  serviceName?: string;
  date?: string;
  misclassifiedAction?: string;
};

export const SUBSCRIPTION_FIRST_VISIT_STEP_ACTIONS = [
  'explain_my_subscription',
  'use_subscription_credit',
] as const;

export const SUBSCRIPTION_FIRST_VISIT_CLASSIFIER_RULES = `- subscription_first_visit (compound): customer multi-step membership first visit — explain active plan (visits remaining, expiry) then apply subscription credit to book a named service. Decomposes to explain_my_subscription → use_subscription_credit with serviceName, date, paymentMethod subscription_credit. Triggers: use|apply|redeem + my membership/subscription/plan + for today's massage|book haircut with my plan|plan credit for service tomorrow. Example: "Use my membership for today's massage", "Book tomorrow's facial with my subscription credit", "Apply my plan for haircut today". NOT use_subscription_credit alone when booking a named visit (service/date present); NOT explain_my_subscription alone (visits left read without booking); NOT my_subscriptions (list only); NOT select_subscription_plan (buy new plan); NOT explain_subscription_vs_one_time (checkout compare).`;

export const SUBSCRIPTION_FIRST_VISIT_EN_PROMPTS = [
  {
    id: 'membership-today-massage',
    prompt: "Use my membership for today's massage",
    serviceName: 'massage',
    date: 'today',
  },
  {
    id: 'plan-credit-massage-tomorrow',
    prompt: 'Use my plan credit for massage tomorrow',
    serviceName: 'massage',
    date: 'tomorrow',
  },
  {
    id: 'redeem-membership-facial',
    prompt: 'Redeem a membership visit for facial',
    serviceName: 'facial',
  },
  {
    id: 'pay-plan-haircut',
    prompt: 'Pay with my plan for haircut',
    serviceName: 'haircut',
  },
  {
    id: 'book-facial-subscription',
    prompt: "Book today's facial with my subscription",
    serviceName: 'facial',
    date: 'today',
  },
  {
    id: 'apply-membership-manicure-today',
    prompt: 'Apply my membership to book manicure today',
    serviceName: 'manicure',
    date: 'today',
  },
  {
    id: 'use-subscription-color-tomorrow',
    prompt: 'Use my subscription for color tomorrow',
    serviceName: 'color',
    date: 'tomorrow',
  },
  {
    id: 'membership-blowdry-today',
    prompt: "Use my membership for today's blowdry",
    serviceName: 'blowdry',
    date: 'today',
  },
  {
    id: 'redeem-plan-massage',
    prompt: 'Redeem my plan credit for massage',
    serviceName: 'massage',
  },
  {
    id: 'book-haircut-membership-today',
    prompt: 'Book haircut today with my membership credit',
    serviceName: 'haircut',
    date: 'today',
  },
] as const;

function buildSubscriptionFirstVisitPrompts(): SubscriptionFirstVisitCompoundFixture[] {
  return SUBSCRIPTION_FIRST_VISIT_EN_PROMPTS.map((entry) => ({
    id: `${entry.id}-customer`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    orderedActions: SUBSCRIPTION_FIRST_VISIT_STEP_ACTIONS,
    serviceName: entry.serviceName,
    ...('date' in entry && entry.date ? { date: entry.date } : {}),
  }));
}

export const SUBSCRIPTION_FIRST_VISIT_COMPOUND_PROMPTS: readonly SubscriptionFirstVisitCompoundFixture[] =
  buildSubscriptionFirstVisitPrompts();

export const SUBSCRIPTION_FIRST_VISIT_RESCUE_SCENARIOS: readonly SubscriptionFirstVisitCompoundFixture[] =
  [
    {
      id: 'use-credit-to-first-visit',
      prompt: "Use my membership for today's massage",
      surface: 'customer',
      orderedActions: [...SUBSCRIPTION_FIRST_VISIT_STEP_ACTIONS],
      misclassifiedAction: 'use_subscription_credit',
    },
    {
      id: 'explain-to-first-visit',
      prompt: 'Use my plan credit for massage tomorrow',
      surface: 'customer',
      orderedActions: [...SUBSCRIPTION_FIRST_VISIT_STEP_ACTIONS],
      misclassifiedAction: 'explain_my_subscription',
    },
    {
      id: 'my-subscriptions-to-first-visit',
      prompt: "Book today's facial with my subscription",
      surface: 'customer',
      orderedActions: [...SUBSCRIPTION_FIRST_VISIT_STEP_ACTIONS],
      misclassifiedAction: 'my_subscriptions',
    },
    {
      id: 'select-plan-to-first-visit',
      prompt: 'Apply my membership to book manicure today',
      surface: 'customer',
      orderedActions: [...SUBSCRIPTION_FIRST_VISIT_STEP_ACTIONS],
      misclassifiedAction: 'select_subscription_plan',
    },
  ];

export const SUBSCRIPTION_FIRST_VISIT_NEGATIVE_PROMPTS = [
  {
    id: 'use-credit-only',
    prompt: 'Use subscription credit',
  },
  {
    id: 'explain-visits-only',
    prompt: 'How many visits left on my plan?',
  },
  {
    id: 'list-subscriptions',
    prompt: 'Show my subscriptions',
  },
] as const;
