export type ApplyLoyaltyAtCheckoutPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'apply_loyalty_at_checkout';
  rescueReason: 'apply_loyalty_at_checkout';
  loyaltyPointsToRedeem?: number | 'max';
};

export const CUSTOMER_APPLY_LOYALTY_AT_CHECKOUT_CLASSIFIER_RULES = `- apply_loyalty_at_checkout: MUTATE — signed-in customer applies loyalty/reward points to the current checkout session (sets session loyaltyPointsToRedeem). Triggers: use my points on this booking, apply loyalty points at checkout, redeem reward points, spend all my points. Optional loyaltyPointsToRedeem when a specific amount is named; otherwise applies the maximum allowed for the order. Requires session customerId. NOT loyalty_points_balance (balance read-only), NOT explain_loyalty_points (how earning/redemption works), NOT apply_promo_code_checkout (promo code), NOT apply_gift_card_code (gift card).`;

export const APPLY_LOYALTY_AT_CHECKOUT_PROMPTS: readonly ApplyLoyaltyAtCheckoutPromptFixture[] =
  [
    {
      id: 'use-points-booking-customer',
      prompt: 'Use my points on this booking',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'apply-loyalty-checkout-customer',
      prompt: 'Apply my loyalty points at checkout',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'redeem-reward-points-customer',
      prompt: 'Redeem reward points for this visit',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'spend-bonus-points-customer',
      prompt: 'Spend my bonus points on checkout',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'use-all-points-customer',
      prompt: 'Use all my points at checkout',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'apply-10-points-customer',
      prompt: 'Apply 10 loyalty points to this booking',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 10,
    },
    {
      id: 'pay-with-points-customer',
      prompt: 'Pay with my points on this booking',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'use-loyalty-balance-customer',
      prompt: 'Use my loyalty balance at checkout',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'redeem-points-appointment-customer',
      prompt: 'Redeem my points for this appointment',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'apply-max-points-customer',
      prompt: 'Apply maximum loyalty points at checkout',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'use-points-booking-checkout-customer',
      prompt: 'Use points on my booking checkout',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'spend-loyalty-order-customer',
      prompt: 'Spend loyalty points on this order',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
  ];

export const APPLY_LOYALTY_AT_CHECKOUT_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-balance',
    prompt: 'Use my loyalty points on this checkout',
    misclassifiedAction: 'loyalty_points_balance',
    expectedAction: 'apply_loyalty_at_checkout' as const,
  },
  {
    id: 'misclassified-explain',
    prompt: 'Apply my points to this booking checkout',
    misclassifiedAction: 'explain_loyalty_points',
    expectedAction: 'apply_loyalty_at_checkout' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'Redeem my reward points for this visit',
    misclassifiedAction: 'unknown',
    expectedAction: 'apply_loyalty_at_checkout' as const,
  },
  {
    id: 'misclassified-promo',
    prompt: 'Use my points on this booking payment',
    misclassifiedAction: 'apply_promo_code_checkout',
    expectedAction: 'apply_loyalty_at_checkout' as const,
  },
] as const;
