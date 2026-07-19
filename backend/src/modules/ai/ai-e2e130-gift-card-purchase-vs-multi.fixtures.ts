/**
 * e2e-bug.130 — gift-card purchase must not route to multi-service availability
 * or budget list_services ("$30" is face value, not maxPrice).
 */
export const E2E130_GIFT_CARD_PURCHASE_SCENARIOS = [
  {
    id: 'buy-30-check-out-now',
    prompt: 'I want to buy a $30 gift card and check out now',
    expectedAction: 'buy_gift_card' as const,
    misclassifiedActions: [
      'check_multi_service_availability',
      'list_services',
      'unknown',
      'apply_gift_card_code',
    ] as const,
    surface: 'customer' as const,
    amount: 30,
  },
  {
    id: 'buy-30-check-out-now-public',
    prompt: 'I want to buy a $30 gift card and check out now',
    expectedAction: 'buy_gift_card' as const,
    misclassifiedActions: [
      'check_multi_service_availability',
      'list_services',
      'unknown',
    ] as const,
    surface: 'public' as const,
    amount: 30,
  },
  {
    id: 'purchase-50-gift-card',
    prompt: 'Please purchase a $50 gift card',
    expectedAction: 'buy_gift_card' as const,
    misclassifiedActions: [
      'check_multi_service_availability',
      'unknown',
    ] as const,
    surface: 'customer' as const,
    amount: 50,
  },
  {
    id: 'buy-gift-card-checkout',
    prompt: 'Buy a gift card and checkout',
    expectedAction: 'buy_gift_card' as const,
    misclassifiedActions: ['check_multi_service_availability'] as const,
    surface: 'customer' as const,
  },
] as const;

/** Still multi-service discovery — must not regress. */
export const E2E130_MULTI_SERVICE_STILL_MATCH = [
  {
    id: 'massage-facial-afternoon',
    prompt: 'When can I get massage and facial together this afternoon?',
    expectedAction: 'check_multi_service_availability' as const,
  },
  {
    id: 'need-massage-facial-tomorrow',
    prompt: 'I need massage and facial tomorrow evening',
    expectedAction: 'check_multi_service_availability' as const,
  },
] as const;
