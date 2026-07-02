export type BuyGiftCardForSomeonePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'buy_gift_card_for_someone';
  rescueReason: 'gift_card_for_someone';
  amount?: number;
  recipientName?: string;
  recipientEmail?: string;
  deliveryMethod?: 'digital' | 'physical';
};

export const CUSTOMER_BUY_GIFT_CARD_FOR_SOMEONE_CLASSIFIER_RULES = `- buy_gift_card_for_someone: MUTATE navigate — logged-in customer buys a gift card as a gift for someone else (recipient name/email, digital email delivery or mailed physical). Triggers: buy/purchase/gift card for my mom|dad|friend|wife|partner|someone; email/send a digital gift card; gift card for Sarah; buy $100 gift card for someone. Sets amount when stated, recipientName/recipientEmail when named, deliveryMethod digital|physical, buyAsGift=true, navigate to gift-cards catalog or checkout. Customer/consumer app only. NOT buy_gift_card (self purchase / no recipient), NOT buy_gift_card_physical alone (mailed card without gift-for-someone framing), NOT book_with_gift_card (pay for booking with code), NOT apply_gift_card_code, NOT check_gift_card_balance, NOT my_gift_cards.`;

export const BUY_GIFT_CARD_FOR_SOMEONE_PROMPTS: readonly BuyGiftCardForSomeonePromptFixture[] =
  [
    {
      id: 'buy-100-for-mom',
      prompt: 'Buy a $100 gift card for my mom',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      amount: 100,
      recipientName: 'Mom',
      deliveryMethod: 'digital',
    },
    {
      id: 'email-digital-gift-card',
      prompt: 'Email a digital gift card',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      deliveryMethod: 'digital',
    },
    {
      id: 'gift-card-for-friend',
      prompt: 'Purchase a gift card for my friend',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      recipientName: 'Friend',
      deliveryMethod: 'digital',
    },
    {
      id: 'send-gift-card-to-wife',
      prompt: 'Send a gift card to my wife',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      recipientName: 'Wife',
      deliveryMethod: 'digital',
    },
    {
      id: 'buy-gift-for-someone',
      prompt: 'Buy a gift card for someone else',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      deliveryMethod: 'digital',
    },
    {
      id: 'gift-card-for-sarah',
      prompt: 'Get a $50 gift card for Sarah',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      amount: 50,
      recipientName: 'Sarah',
      deliveryMethod: 'digital',
    },
    {
      id: 'mail-gift-card-for-dad',
      prompt: 'Mail a physical gift card for my dad',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      recipientName: 'Dad',
      deliveryMethod: 'physical',
    },
    {
      id: 'buy-as-gift',
      prompt: 'Buy a gift card as a gift',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      deliveryMethod: 'digital',
    },
    {
      id: 'email-gift-card-to-john',
      prompt: 'Email a gift card to john@example.com',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      recipientEmail: 'john@example.com',
      deliveryMethod: 'digital',
    },
    {
      id: 'surprise-gift-for-partner',
      prompt: 'Surprise gift card for my partner',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      recipientName: 'Partner',
      deliveryMethod: 'digital',
    },
    {
      id: 'order-gift-for-brother',
      prompt: 'Order a $75 gift card for my brother',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      amount: 75,
      recipientName: 'Brother',
      deliveryMethod: 'digital',
    },
    {
      id: 'send-digital-card',
      prompt: 'Send a digital gift card to a friend',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      recipientName: 'Friend',
      deliveryMethod: 'digital',
    },
  ];

export const BUY_GIFT_CARD_FOR_SOMEONE_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-buy-gift-card',
    prompt: 'Buy a $100 gift card for my mom',
    misclassifiedAction: 'buy_gift_card',
    surface: 'customer' as const,
  },
  {
    id: 'misclassified-buy-physical',
    prompt: 'Mail a physical gift card for my dad',
    misclassifiedAction: 'buy_gift_card_physical',
    surface: 'customer' as const,
  },
  {
    id: 'misclassified-discover-gift-cards',
    prompt: 'Email a digital gift card',
    misclassifiedAction: 'discover_gift_card_products',
    surface: 'customer' as const,
  },
  {
    id: 'misclassified-book-with-gift-card',
    prompt: 'Buy a gift card for my friend',
    misclassifiedAction: 'book_with_gift_card',
    surface: 'customer' as const,
  },
] as const;
