/**
 * e2e-bug.231 — check_gift_card_balance by code must win over gift_card_balance
 * (account wallet / sign-in) and apply_gift_card_code (checkout preview).
 */
export type E2E231GiftCardBalanceCase = {
  id: string;
  prompt: string;
  expectAction: 'check_gift_card_balance';
  forbidActions: readonly string[];
};

export const E2E231_CHECK_BALANCE_BY_CODE_CASES: readonly E2E231GiftCardBalanceCase[] =
  [
    {
      id: 'check-balance-by-code',
      prompt: 'Check gift card balance by code GCM-E5B7056C84',
      expectAction: 'check_gift_card_balance',
      forbidActions: ['gift_card_balance', 'apply_gift_card_code'],
    },
    {
      id: 'how-much-left-on-code',
      prompt: 'How much is left on gift card code GCM-E5B7056C84?',
      expectAction: 'check_gift_card_balance',
      forbidActions: ['gift_card_balance', 'apply_gift_card_code'],
    },
    {
      id: 'what-is-balance-on-gift-card',
      prompt: 'What is the balance on gift card GCM-E5B7056C84',
      expectAction: 'check_gift_card_balance',
      forbidActions: [
        'gift_card_balance',
        'apply_gift_card_code',
        'explain_public_booking_checkout',
      ],
    },
    {
      id: 'what-is-value',
      prompt: 'What is the value of gift card GCM-E5B7056C84',
      expectAction: 'check_gift_card_balance',
      forbidActions: ['apply_gift_card_code', 'gift_card_balance'],
    },
    {
      id: 'remaining-balance-gcb',
      prompt: 'Remaining balance on gift card GCB-ABCD1234',
      expectAction: 'check_gift_card_balance',
      forbidActions: ['gift_card_balance'],
    },
    {
      id: 'whats-left-gcs',
      prompt: "What's left on gift card code GCS-ZZ99",
      expectAction: 'check_gift_card_balance',
      forbidActions: ['gift_card_balance', 'apply_gift_card_code'],
    },
  ];

export const E2E231_NEGATIVE_CASES = [
  {
    id: 'neg-account-wallet-balance',
    prompt: 'What is my gift card balance?',
    forbidAction: 'check_gift_card_balance',
    allowActions: ['gift_card_balance', 'my_gift_cards'] as const,
  },
  {
    id: 'neg-apply-at-checkout',
    prompt: 'Apply gift card code GCM-E5B7056C84 at checkout',
    expectAction: 'apply_gift_card_code',
    forbidAction: 'check_gift_card_balance',
  },
  {
    id: 'neg-explain-checkout-gift-cards',
    prompt: 'How do gift cards work at public booking checkout?',
    allowActions: [
      'explain_public_booking_checkout',
      'explain_checkout_currency',
    ] as const,
    forbidAction: 'check_gift_card_balance',
  },
  {
    id: 'neg-claim-to-account',
    prompt: 'Add gift card GCM-E5B7056C84 to my account',
    allowActions: ['claim_gift_card_balance'] as const,
    forbidAction: 'check_gift_card_balance',
  },
] as const;
