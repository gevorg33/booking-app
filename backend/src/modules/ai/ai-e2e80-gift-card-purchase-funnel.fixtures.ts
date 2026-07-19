/**
 * e2e-bug.80 — gift-card purchase/quote funnel was stolen by
 * apply_gift_card_code (and buy_gift_card_for_someone for "for myself"/amounts).
 */
export const E2E80_PURCHASE_AND_QUOTE_SCENARIOS = [
  {
    id: 'e2e80-buy-50-digital-for-myself',
    prompt: 'I want to buy a 50 dollar digital gift card for myself',
    expectedAction: 'buy_gift_card' as const,
    amount: 50,
    misclassifiedActions: [
      'apply_gift_card_code',
      'buy_gift_card_for_someone',
      'unknown',
    ] as const,
  },
  {
    id: 'e2e80-order-physical-75',
    prompt: 'I want to order a physical gift card for 75 dollars',
    expectedAction: 'buy_gift_card_physical' as const,
    amount: 75,
    misclassifiedActions: [
      'apply_gift_card_code',
      'buy_gift_card_for_someone',
      'buy_gift_card',
      'unknown',
    ] as const,
  },
  {
    id: 'e2e80-quote-how-much-100',
    prompt: 'how much would a 100 dollar gift card cost?',
    expectedAction: 'get_gift_card_quote' as const,
    amount: 100,
    misclassifiedActions: [
      'apply_gift_card_code',
      'buy_gift_card',
      'buy_gift_card_for_someone',
      'unknown',
    ] as const,
  },
  {
    id: 'e2e80-quote-if-i-buy-total-fees',
    prompt:
      'if I buy a gift card for 100 dollars, what would the total price be including any fees?',
    expectedAction: 'get_gift_card_quote' as const,
    amount: 100,
    misclassifiedActions: [
      'apply_gift_card_code',
      'buy_gift_card',
      'buy_gift_card_for_someone',
      'unknown',
    ] as const,
  },
] as const;

/** Still redeem-at-checkout — must not regress. */
export const E2E80_APPLY_CODE_STILL_MATCHES = [
  {
    id: 'e2e80-apply-gcm-at-checkout',
    prompt: 'Apply gift card code GCM-ABCD1234 at checkout',
  },
  {
    id: 'e2e80-use-my-gift-card-code',
    prompt: 'Use my gift card code GCM-TEST9999',
  },
] as const;

/** Still gift-for-someone — must not regress. */
export const E2E80_FOR_SOMEONE_STILL_MATCHES = [
  {
    id: 'e2e80-buy-for-mom',
    prompt: 'Buy a $100 gift card for my mom',
  },
  {
    id: 'e2e80-gift-card-for-sarah',
    prompt: 'Buy a gift card for Sarah',
  },
] as const;
