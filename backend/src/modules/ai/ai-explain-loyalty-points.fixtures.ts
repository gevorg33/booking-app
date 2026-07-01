export type ExplainLoyaltyPointsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_loyalty_points';
  rescueReason: 'explain_loyalty_points';
  focus?: 'earn' | 'worth' | 'program' | 'redeem';
};

export const CUSTOMER_EXPLAIN_LOYALTY_POINTS_CLASSIFIER_RULES = `- explain_loyalty_points: READ — signed-in customer/consumer app: explain how this salon's loyalty program works — earn rate on eligible cash paid, $1 per point redemption value, when points post after visits. Triggers: "How do I earn points?", "What are my points worth?", "How does loyalty work?", "Explain reward points". Optional balance enrichment when session customerId is present. NOT loyalty_points_balance (show current balance only), NOT apply_loyalty_at_checkout (spend points on booking), NOT summarize_loyalty_program (dashboard admin overview), NOT configure_loyalty_settings (admin mutate).`;

export const EXPLAIN_LOYALTY_POINTS_PROMPTS: readonly ExplainLoyaltyPointsPromptFixture[] =
  [
    {
      id: 'how-earn-points-customer',
      prompt: 'How do I earn points?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'earn',
    },
    {
      id: 'points-worth-customer',
      prompt: 'What are my points worth?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'worth',
    },
    {
      id: 'how-loyalty-works-customer',
      prompt: 'How does the loyalty program work?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'program',
    },
    {
      id: 'how-loyalty-points-work-customer',
      prompt: 'How do loyalty points work?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'program',
    },
    {
      id: 'when-earn-rewards-customer',
      prompt: 'When do I earn reward points?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'earn',
    },
    {
      id: 'bonus-points-get-customer',
      prompt: 'What do my bonus points get me?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'worth',
    },
    {
      id: 'explain-loyalty-points-customer',
      prompt: 'Explain loyalty points',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'program',
    },
    {
      id: 'how-calculated-customer',
      prompt: 'How are loyalty points calculated?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'earn',
    },
    {
      id: 'tell-reward-points-customer',
      prompt: 'Tell me how reward points work',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'program',
    },
    {
      id: 'each-point-worth-customer',
      prompt: 'What is each point worth?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'worth',
    },
    {
      id: 'worth-at-checkout-customer',
      prompt: 'How much are loyalty points worth at checkout?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'worth',
    },
    {
      id: 'earn-every-visit-customer',
      prompt: 'Do I earn points on every visit?',
      surface: 'customer',
      expectedAction: 'explain_loyalty_points',
      rescueReason: 'explain_loyalty_points',
      focus: 'earn',
    },
  ];

export const EXPLAIN_LOYALTY_POINTS_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-balance',
    prompt: 'How do I earn loyalty points?',
    misclassifiedAction: 'loyalty_points_balance',
    expectedAction: 'explain_loyalty_points' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'What are reward points worth?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_loyalty_points' as const,
  },
  {
    id: 'misclassified-promo-help',
    prompt: 'Explain how bonus points work here',
    misclassifiedAction: 'promo_code_help',
    expectedAction: 'explain_loyalty_points' as const,
  },
  {
    id: 'misclassified-book',
    prompt: 'How does loyalty work when I book?',
    misclassifiedAction: 'book_appointment',
    expectedAction: 'explain_loyalty_points' as const,
  },
] as const;
