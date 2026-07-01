export type BookWithGiftCardPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'book_with_gift_card';
  rescueReason: 'book_gift_card';
  giftCardCode?: string;
  requiresCode?: boolean;
};

export const CUSTOMER_BOOK_WITH_GIFT_CARD_CLASSIFIER_RULES = `- book_with_gift_card: MUTATE — customer selects gift-card payment for the booking/checkout flow (not balance check, not buying a card, not apply_gift_card_code at an existing checkout step). Triggers: book/reserve/schedule/pay/use my gift card for this booking, pay with gift card when I book, book with gift card code GCM-*. Sets paymentMethod=gift_card and giftCardCode when mentioned. NOT apply_gift_card_code (apply/redeem code at checkout after slot pick), NOT check_gift_card_balance, NOT claim_gift_card_balance (add/redeem code to account), NOT buy_gift_card / buy_gift_card_physical / buy_gift_card_for_someone, NOT my_gift_cards (account list), NOT list_services maxPrice budget filters.`;

export const BOOK_WITH_GIFT_CARD_PROMPTS: readonly BookWithGiftCardPromptFixture[] =
  [
    {
      id: 'use-my-gift-card-booking',
      prompt: 'Use my gift card for this booking',
      surface: 'customer',
      expectedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      requiresCode: true,
    },
    {
      id: 'book-with-gift-card',
      prompt: 'Book with gift card',
      surface: 'customer',
      expectedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      requiresCode: true,
    },
    {
      id: 'pay-with-gift-card-when-book',
      prompt: 'Pay with gift card when I book',
      surface: 'customer',
      expectedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      requiresCode: true,
    },
    {
      id: 'reserve-using-gift-card',
      prompt: 'Reserve my appointment using a gift card',
      surface: 'customer',
      expectedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      requiresCode: true,
    },
    {
      id: 'schedule-with-gift-card-code',
      prompt: 'Schedule massage with gift card code GCM-ABCD1234',
      surface: 'customer',
      expectedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      giftCardCode: 'GCM-ABCD1234',
    },
    {
      id: 'book-gift-card-code',
      prompt: 'Book with gift card GCM-TEST9999',
      surface: 'customer',
      expectedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      giftCardCode: 'GCM-TEST9999',
    },
    {
      id: 'checkout-pay-gift-card',
      prompt: 'Checkout and pay with my gift card',
      surface: 'customer',
      expectedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      requiresCode: true,
    },
    {
      id: 'use-gift-card-for-visit',
      prompt: 'Use gift card for my visit',
      surface: 'customer',
      expectedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      requiresCode: true,
    },
    {
      id: 'book-package-gift-card',
      prompt: 'Book spa day package with gift card GCM-SPA100',
      surface: 'customer',
      expectedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      giftCardCode: 'GCM-SPA100',
    },
    {
      id: 'pay-gift-card-this-booking',
      prompt: 'I want to pay with gift card for this booking',
      surface: 'customer',
      expectedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      requiresCode: true,
    },
    {
      id: 'book-nearest-gift-card-pref',
      prompt: 'Book nearest slot for massage and pay with gift card',
      surface: 'customer',
      expectedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      requiresCode: true,
    },
    {
      id: 'schedule-facial-gift-card',
      prompt: 'Schedule a facial using my gift card',
      surface: 'customer',
      expectedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      requiresCode: true,
    },
  ];

export const BOOK_WITH_GIFT_CARD_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-apply-code',
    prompt: 'Use my gift card for this booking',
    misclassifiedAction: 'apply_gift_card_code',
  },
  {
    id: 'misclassified-choose-payment',
    prompt: 'Book with gift card GCM-ABCD1234',
    misclassifiedAction: 'choose_payment_method',
  },
  {
    id: 'misclassified-buy-gift-card',
    prompt: 'Pay with gift card when I book',
    misclassifiedAction: 'buy_gift_card',
  },
  {
    id: 'misclassified-check-balance',
    prompt: 'Schedule massage with gift card code GCM-ABCD1234',
    misclassifiedAction: 'check_gift_card_balance',
  },
] as const;

export const BOOK_WITH_GIFT_CARD_COMPOUND_SCENARIOS = [
  {
    id: 'book-package-gift-card-compound',
    prompt: 'Book spa day package and pay with gift card GCM-SPA100',
    orderedActions: ['book_package', 'book_with_gift_card'] as const,
    giftCardCode: 'GCM-SPA100',
  },
  {
    id: 'book-nearest-gift-card-compound',
    prompt:
      'Book nearest slot for massage tomorrow and pay with gift card GCM-NEAR1',
    orderedActions: ['book_nearest_slot', 'book_with_gift_card'] as const,
    giftCardCode: 'GCM-NEAR1',
  },
] as const;
