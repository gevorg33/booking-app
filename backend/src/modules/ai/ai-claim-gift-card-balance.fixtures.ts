export type ClaimGiftCardBalancePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'claim_gift_card_balance';
  rescueReason: 'claim_gift_card_balance';
  giftCardCode?: string;
};

export const CUSTOMER_CLAIM_GIFT_CARD_BALANCE_CLASSIFIER_RULES = `- claim_gift_card_balance: MUTATE — signed-in customer redeems/adds a gift card code to their account (ConsumerGiftCardClaimSection on Account page). Triggers: redeem/claim/add/link/register gift card code GCM-/GCB-/GCS- to account, add gift card to my account. Sets giftCardCode when named. Calls account claim API or navigates to account gift-card claim with code prefilled. Customer app only. NOT apply_gift_card_code (checkout apply during booking), NOT check_gift_card_balance (balance lookup by code), NOT gift_card_balance (account card balance read), NOT book_with_gift_card (pay for booking), NOT buy_gift_card / buy_gift_card_for_someone, NOT my_gift_cards (list only).`;

export const CLAIM_GIFT_CARD_BALANCE_PROMPTS: readonly ClaimGiftCardBalancePromptFixture[] =
  [
    {
      id: 'redeem-code-gcm-customer',
      prompt: 'Redeem gift card code GCM-ABCD1234',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
      giftCardCode: 'GCM-ABCD1234',
    },
    {
      id: 'add-gift-card-account-customer',
      prompt: 'Add gift card to account',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
    },
    {
      id: 'claim-gcb-code-customer',
      prompt: 'Claim gift card GCB-SPECIAL123',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
      giftCardCode: 'GCB-SPECIAL123',
    },
    {
      id: 'link-gift-card-my-account-customer',
      prompt: 'Link gift card to my account',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
    },
    {
      id: 'register-code-account-customer',
      prompt: 'Register gift card code on my account',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
    },
    {
      id: 'redeem-gcs-wellness-customer',
      prompt: 'Redeem my gift card code GCS-WELLNESS',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
      giftCardCode: 'GCS-WELLNESS',
    },
    {
      id: 'add-code-to-account-customer',
      prompt: 'Add this gift card code to my account GCM-TEST1234',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
      giftCardCode: 'GCM-TEST1234',
    },
    {
      id: 'claim-for-account-customer',
      prompt: 'Claim a gift card for my account',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
    },
    {
      id: 'attach-gcm-friend-customer',
      prompt: 'Attach gift card GCM-FRIEND99 to account',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
      giftCardCode: 'GCM-FRIEND99',
    },
    {
      id: 'have-code-redeem-customer',
      prompt: 'I have a gift card code to redeem GCB-HOLIDAY',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
      giftCardCode: 'GCB-HOLIDAY',
    },
  ];

export const CLAIM_GIFT_CARD_BALANCE_RESCUE_SCENARIOS = [
  {
    id: 'rescue-from-apply-checkout',
    prompt: 'Redeem gift card code GCM-ABCD1234',
    misclassifiedAction: 'apply_gift_card_code',
    expectedAction: 'claim_gift_card_balance' as const,
    rescueReason: 'claim_gift_card_balance',
  },
  {
    id: 'rescue-from-check-balance',
    prompt: 'Add gift card GCM-SAVE50 to my account',
    misclassifiedAction: 'check_gift_card_balance',
    expectedAction: 'claim_gift_card_balance' as const,
    rescueReason: 'claim_gift_card_balance',
    giftCardCode: 'GCM-SAVE50',
  },
  {
    id: 'rescue-from-gift-card-balance',
    prompt: 'Claim gift card GCB-PACKAGE1 for my account',
    misclassifiedAction: 'gift_card_balance',
    expectedAction: 'claim_gift_card_balance' as const,
    rescueReason: 'claim_gift_card_balance',
    giftCardCode: 'GCB-PACKAGE1',
  },
  {
    id: 'rescue-from-book-with-gift-card',
    prompt: 'Add gift card to account',
    misclassifiedAction: 'book_with_gift_card',
    expectedAction: 'claim_gift_card_balance' as const,
    rescueReason: 'claim_gift_card_balance',
  },
] as const;
