/** Classifier rules for gift card checkout & payment compounds (ai-cmd-h3.4). */
export const GIFT_CARD_PAYMENTS_CLASSIFIER_RULES = `- Customer checkout compounds (one message): book_nearest_slot or check_providers_for_service → apply_gift_card_code → choose_payment_method / pay_online / pay_cash_at_visit. Multi-step execution is automatic — inherit serviceName, date, giftCardCode across steps.
- apply_gift_card_code: redeem/preview a code at checkout (GCM-/GCB-/GCS-). NOT validate_gift_card (dashboard admin), NOT my_gift_cards (account balance), NOT claim_gift_card_balance (add code to account).
- choose_payment_method: pick cash, online/Stripe, gift card, or subscription credit before completing checkout.
- buy_gift_card_physical: order a mailed/shipped gift card. buy_gift_card is digital only. buy_gift_card_for_someone navigates to gift catalog/checkout with recipient fields when buying for someone else.
- track_physical_gift_card_order: customer self-service tracking after a physical order — NOT track_gift_card_shipment (provider fulfillment).
- Physical order handoff: "buy physical gift card … and track my order" → buy_gift_card_physical then track_physical_gift_card_order; inherit amount, deliveryMethod, giftCardOrderId when returned from purchase step.
- Example compound: "Book nearest slot for massage tomorrow and apply gift card GCM-ABCD1234 and choose payment method" → book_nearest_slot, apply_gift_card_code, choose_payment_method with shared serviceName/date.
- Example compound: "Check who is free tomorrow for massage, book nearest slot, apply my gift card, pay online" → four-step checkout with shared booking context.
- Example follow-up: after book_nearest_slot, "apply gift card GCM-TEST" → apply_gift_card_code, inherit serviceName/date from session.
- Example follow-up: after apply_gift_card_code, "choose payment method" / "pay online" → choose_payment_method or pay_online, inherit giftCardCode from session.`;

export type GiftCardCheckoutPromptFixture = {
  id: string;
  prompt: string;
  serviceName?: string;
  giftCardCode?: string;
  orderedActions: string[];
};

/** Natural-language variants for gift-card checkout compounds (ai-cmd-h4.1). */
export const GIFT_CARD_CHECKOUT_PROMPTS: GiftCardCheckoutPromptFixture[] = [
  {
    id: 'book-apply-choose',
    prompt:
      'Book nearest slot for massage tomorrow and apply gift card GCM-ABCD1234 and choose payment method',
    serviceName: 'massage',
    giftCardCode: 'GCM-ABCD1234',
    orderedActions: [
      'book_nearest_slot',
      'apply_gift_card_code',
      'choose_payment_method',
    ],
  },
  {
    id: 'check-book-apply',
    prompt:
      'Check who is free tomorrow evening for massage and book the nearest slot and apply my gift card GCM-ABCD1234',
    serviceName: 'massage',
    giftCardCode: 'GCM-ABCD1234',
    orderedActions: [
      'check_providers_for_service',
      'book_nearest_slot',
      'apply_gift_card_code',
    ],
  },
  {
    id: 'book-apply-pay-online',
    prompt:
      'Book nearest slot for facial tomorrow and apply gift card GCM-TEST1234 and pay online',
    serviceName: 'facial',
    giftCardCode: 'GCM-TEST1234',
    orderedActions: ['book_nearest_slot', 'apply_gift_card_code', 'pay_online'],
  },
];

export const SIMILAR_GIFT_CARD_CHECKOUT_PROMPTS: GiftCardCheckoutPromptFixture[] =
  [
    {
      id: 'nearest-slot-gift-card',
      prompt:
        'Book the nearest slot for massage tomorrow and apply gift card GCM-ABCD1234',
      serviceName: 'massage',
      giftCardCode: 'GCM-ABCD1234',
      orderedActions: ['book_nearest_slot', 'apply_gift_card_code'],
    },
    {
      id: 'check-book-gift-pay',
      prompt:
        'Who is available tomorrow for massage and book nearest slot and apply gift card GCM-ABCD1234 and choose payment',
      serviceName: 'massage',
      giftCardCode: 'GCM-ABCD1234',
      orderedActions: [
        'check_providers_for_service',
        'book_nearest_slot',
        'apply_gift_card_code',
      ],
    },
    {
      id: 'book-gift-cash',
      prompt:
        'Book nearest slot for massage tomorrow and apply my gift card GCM-XYZ9876 and pay cash at visit',
      serviceName: 'massage',
      giftCardCode: 'GCM-XYZ9876',
      orderedActions: [
        'book_nearest_slot',
        'apply_gift_card_code',
        'pay_cash_at_visit',
      ],
    },
  ];

export const GIFT_CARD_PHYSICAL_HANDOFF_PROMPTS = [
  {
    id: 'buy-track',
    prompt: 'Buy physical gift card $100 and track my order',
    orderedActions: [
      'buy_gift_card_physical',
      'track_physical_gift_card_order',
    ] as const,
    amount: 100,
  },
  {
    id: 'order-track',
    prompt: 'Order mailed physical gift card $50 and track my order',
    orderedActions: [
      'buy_gift_card_physical',
      'track_physical_gift_card_order',
    ] as const,
    amount: 50,
  },
] as const;

export const ALL_GIFT_CARD_CHECKOUT_PROMPTS = [
  ...GIFT_CARD_CHECKOUT_PROMPTS,
  ...SIMILAR_GIFT_CARD_CHECKOUT_PROMPTS,
];
