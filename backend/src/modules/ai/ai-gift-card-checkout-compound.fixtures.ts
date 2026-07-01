export type GiftCardCheckoutCompoundFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  orderedActions: readonly string[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const GIFT_CARD_CHECKOUT_CLASSIFIER_RULES = `- gift_card_checkout (compound): customer multi-step verify gift card balance, apply code at checkout, then book nearest slot. Decomposes to check_gift_card_balance → apply_gift_card_code → book_nearest_slot with shared giftCardCode and bookingFirstAvailable=true. Use for "Use gift card GCM-XXX and book nearest haircut", "Check gift card GCM-ABCD balance and book the soonest massage slot". Requires gift card code (GCM-/GCB-/GCS-) AND book-nearest cue (nearest/soonest/next available). NOT book_with_gift_card alone; NOT customer book→apply→choose payment compounds; NOT check_gift_card_balance alone; NOT buy_gift_card / buy_gift_card_physical.`;

export const GIFT_CARD_CHECKOUT_CUSTOMER_PROMPTS: readonly GiftCardCheckoutCompoundFixture[] =
  [
    {
      id: 'gift-checkout-use-code-haircut-en',
      prompt: 'Use gift card GCM-ABCD1234 and book nearest haircut',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-ABCD1234',
        serviceName: 'haircut',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-check-balance-massage-en',
      prompt:
        'Check gift card GCM-TEST5678 balance and book nearest massage slot',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-TEST5678',
        serviceName: 'massage',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-verify-apply-soonest-en',
      prompt:
        'Verify gift card GCM-XYZ9876 then apply it and book the soonest slot',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-XYZ9876',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-whats-on-facial-en',
      prompt: "What's on gift card GCM-FACE99 — use it and book nearest facial",
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-FACE99',
        serviceName: 'facial',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-my-card-haircut-en',
      prompt: 'Use my gift card GCM-SPA2024 to book the next available haircut',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-SPA2024',
        serviceName: 'haircut',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-check-apply-tomorrow-en',
      prompt:
        'Check GCM-XYZ1111 balance, apply code, and book nearest slot tomorrow',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-XYZ1111',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-redeem-haircut-en',
      prompt: 'Redeem gift card GCM-HAIR50 and book nearest haircut opening',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-HAIR50',
        serviceName: 'haircut',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-code-massage-en',
      prompt: 'Use gift card code GCM-FACE99 and book the soonest massage slot',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-FACE99',
        serviceName: 'massage',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-balance-nearest-en',
      prompt:
        'Check gift card GCM-DAYSPA balance and book nearest available slot',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-DAYSPA',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-apply-manicure-en',
      prompt: 'Apply gift card GCM-TEST1234 and book nearest manicure',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-TEST1234',
        serviceName: 'manicure',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-earliest-facial-en',
      prompt:
        'Use gift card GCM-BOOK456 and book the earliest available facial',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-BOOK456',
        serviceName: 'facial',
        bookingFirstAvailable: true,
      },
    },
    {
      id: 'gift-checkout-then-massage-en',
      prompt: 'Check balance on GCM-ABC789 then book nearest slot for massage',
      surface: 'customer',
      orderedActions: [
        'check_gift_card_balance',
        'apply_gift_card_code',
        'book_nearest_slot',
      ],
      expectedParams: {
        giftCardCode: 'GCM-ABC789',
        serviceName: 'massage',
        bookingFirstAvailable: true,
      },
    },
  ];

export const GIFT_CARD_CHECKOUT_COMPOUND_PROMPTS = [
  ...GIFT_CARD_CHECKOUT_CUSTOMER_PROMPTS,
] as const;

export const GIFT_CARD_CHECKOUT_RESCUE_SCENARIOS: readonly GiftCardCheckoutCompoundFixture[] =
  GIFT_CARD_CHECKOUT_CUSTOMER_PROMPTS.slice(0, 4).map((row) => ({
    ...row,
    misclassifiedAction: 'check_gift_card_balance',
  }));

export const GIFT_CARD_CHECKOUT_NEGATIVE_PROMPTS = [
  {
    id: 'check-balance-only',
    prompt: 'Check gift card GCM-ABCD1234 balance',
  },
  {
    id: 'book-only-no-gift',
    prompt: 'Book the nearest slot tomorrow',
  },
  {
    id: 'book-apply-choose-payment-legacy',
    prompt:
      'Book nearest slot for massage tomorrow and apply gift card GCM-ABCD1234 and choose payment method',
  },
  {
    id: 'buy-gift-card',
    prompt: 'Buy gift card $100',
  },
  {
    id: 'book-with-gift-card-single',
    prompt: 'Book haircut and pay with my gift card',
  },
] as const;
