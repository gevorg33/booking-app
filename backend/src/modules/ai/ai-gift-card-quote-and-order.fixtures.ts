export const GIFT_CARD_QUOTE_AND_ORDER_INTENTS = [
  'get_gift_card_quote',
  'explain_gift_card_order',
] as const;

export type GiftCardQuoteAndOrderIntent =
  (typeof GIFT_CARD_QUOTE_AND_ORDER_INTENTS)[number];

export const GIFT_CARD_QUOTE_AND_ORDER_CLASSIFIER_RULES = `- get_gift_card_quote: READ — calculate the live price of a gift card before buying it, for any card type (monetary, service, package, subscription, bundle) and delivery method, including shipping when physical. Triggers: "How much would a $100 gift card cost?", "how much would a 100 dollar gift card cost?", "if I buy a gift card for 100 dollars, what would the total price be including any fees?", "Quote a physical gift card with shipping", "What's the total for a spa package gift card?". Set amount/cardType/serviceId/packageId/subscriptionPlanId/bundleId/deliveryMethod/shippingMethodId when named. Prefer over apply_gift_card_code whenever the user asks cost/price/fees without a GCM-/GCB-/GCS- code. Prefer over buy_gift_card when the user is only asking for a price (even if they say "if I buy"). NOT buy_gift_card / buy_gift_card_physical (those quote internally as part of purchasing — use get_gift_card_quote only when the user is just asking for a price), NOT apply_gift_card_code (redeem an existing code at checkout).
- explain_gift_card_order: READ — look up full detail (balance, status, delivery, cancel/modify eligibility) for one gift card order the signed-in customer owns. Triggers: "Tell me about my gift card order", "What's the status of gift card order GC-123?", "Can I still cancel or modify this gift card?". Requires giftCardId. NOT my_gift_cards (lists all cards, no single-order detail), NOT track_physical_gift_card_order (shipping status only), NOT request_gift_card_cancel/modify (those submit a change request).`;

export type GiftCardQuoteAndOrderPromptFixture = {
  id: string;
  prompt: string;
  expectedAction: GiftCardQuoteAndOrderIntent;
  amount?: number;
  giftCardId?: string;
};

export const GIFT_CARD_QUOTE_AND_ORDER_PROMPTS: readonly GiftCardQuoteAndOrderPromptFixture[] =
  [
    {
      id: 'quote-monetary-amount',
      prompt: 'How much would a $100 gift card cost?',
      expectedAction: 'get_gift_card_quote',
      amount: 100,
    },
    {
      id: 'quote-physical-shipping',
      prompt: 'Quote a physical gift card with shipping',
      expectedAction: 'get_gift_card_quote',
    },
    {
      id: 'explain-order-status',
      prompt: 'What is the status of my gift card order GC-123?',
      expectedAction: 'explain_gift_card_order',
      giftCardId: 'GC-123',
    },
    {
      id: 'explain-order-cancel-eligibility',
      prompt: 'Can I still cancel or modify this gift card order?',
      expectedAction: 'explain_gift_card_order',
    },
  ];
