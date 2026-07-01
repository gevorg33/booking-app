export type TrackPhysicalGiftCardOrderPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'track_physical_gift_card_order';
  rescueReason: 'track_gift_card';
  giftCardOrderId?: string;
};

export const CUSTOMER_TRACK_PHYSICAL_GIFT_CARD_ORDER_CLASSIFIER_RULES = `- track_physical_gift_card_order: READ — logged-in customer checks delivery/shipment status of a physical (mailed/shipped) gift card order they placed. Triggers: where|track|status|shipping|delivery + my physical gift card|gift card order|mailed gift card; when will my gift card arrive; gift card order status. NOT my_gift_cards (list cards without tracking), NOT buy_gift_card_physical (purchase only), NOT track_gift_card_shipment (provider fulfillment dashboard), NOT request_gift_card_cancel/modify, NOT check_gift_card_balance, NOT discover_gift_card_products.`;

export const TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS: readonly TrackPhysicalGiftCardOrderPromptFixture[] =
  [
    {
      id: 'where-physical-gift-card',
      prompt: 'Where is my physical gift card?',
      surface: 'customer',
      expectedAction: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    },
    {
      id: 'track-physical-order',
      prompt: 'Track my physical gift card order',
      surface: 'customer',
      expectedAction: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    },
    {
      id: 'gift-card-shipping-status',
      prompt: 'Gift card shipping status',
      surface: 'customer',
      expectedAction: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    },
    {
      id: 'where-mailed-gift-card',
      prompt: 'Where is my mailed gift card?',
      surface: 'customer',
      expectedAction: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    },
    {
      id: 'status-gift-card-order',
      prompt: 'Status of my gift card order',
      surface: 'customer',
      expectedAction: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    },
    {
      id: 'when-gift-card-arrive',
      prompt: 'When will my physical gift card arrive?',
      surface: 'customer',
      expectedAction: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    },
    {
      id: 'track-shipped-gift-card',
      prompt: 'Track my shipped gift card',
      surface: 'customer',
      expectedAction: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    },
    {
      id: 'delivery-status-gift-card',
      prompt: 'Delivery status for my gift card order',
      surface: 'customer',
      expectedAction: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    },
    {
      id: 'where-gift-card-shipment',
      prompt: 'Where is my gift card shipment?',
      surface: 'customer',
      expectedAction: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    },
    {
      id: 'has-gift-card-shipped',
      prompt: 'Has my physical gift card shipped yet?',
      surface: 'customer',
      expectedAction: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    },
    {
      id: 'check-gift-card-delivery',
      prompt: 'Check delivery on my gift card order',
      surface: 'customer',
      expectedAction: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    },
    {
      id: 'track-gift-card-order-id',
      prompt: 'Track gift card order 550e8400-e29b-41d4-a716-446655440099',
      surface: 'customer',
      expectedAction: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
      giftCardOrderId: '550e8400-e29b-41d4-a716-446655440099',
    },
  ];

export const TRACK_PHYSICAL_GIFT_CARD_ORDER_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-my-gift-cards',
    prompt: 'Where is my physical gift card?',
    misclassifiedAction: 'my_gift_cards',
  },
  {
    id: 'misclassified-buy-physical',
    prompt: 'Track my physical gift card order',
    misclassifiedAction: 'buy_gift_card_physical',
  },
  {
    id: 'misclassified-contact-support',
    prompt: 'Where is my mailed gift card?',
    misclassifiedAction: 'contact_support',
  },
  {
    id: 'misclassified-discover-products',
    prompt: 'Status of my gift card order',
    misclassifiedAction: 'discover_gift_card_products',
  },
] as const;
