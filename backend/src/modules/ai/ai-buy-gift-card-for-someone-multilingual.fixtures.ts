export type BuyGiftCardForSomeoneMultilingualScenario = {
  id: string;
  prompt: string;
  locale: 'hy' | 'ru';
  surface: 'customer';
  expectedAction: 'buy_gift_card_for_someone';
  rescueReason: 'gift_card_for_someone';
  amount?: number;
  recipientName?: string;
  deliveryMethod?: 'digital' | 'physical';
};

export const BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_CLASSIFIER_RULES = `- buy_gift_card_for_someone HY/RU: hy «Գնել $100 նվեր քարտ մայրիս համար», «Էլ. փոստով թվային նվեր քարտ»; ru «Купить подарочную карту маме», «Отправить цифровую подарочную карту». MUTATE navigate gift-for-someone — NOT buy_gift_card and NOT book_with_gift_card.`;

export const BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_SCENARIOS: readonly BuyGiftCardForSomeoneMultilingualScenario[] =
  [
    {
      id: 'hy-buy-for-mom',
      prompt: 'Գնել $100 նվեր քարտ մայրիս համար',
      locale: 'hy',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      amount: 100,
      recipientName: 'Mom',
      deliveryMethod: 'digital',
    },
    {
      id: 'hy-email-digital',
      prompt: 'Էլ. փոստով թվային նվեր քարտ ուղարկել',
      locale: 'hy',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      deliveryMethod: 'digital',
    },
    {
      id: 'hy-gift-for-friend',
      prompt: 'Նվեր քարտ ընկերոջ համար',
      locale: 'hy',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      recipientName: 'Friend',
      deliveryMethod: 'digital',
    },
    {
      id: 'ru-buy-for-mom',
      prompt: 'Купить подарочную карту на $100 для мамы',
      locale: 'ru',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      amount: 100,
      recipientName: 'Mom',
      deliveryMethod: 'digital',
    },
    {
      id: 'ru-email-digital',
      prompt: 'Отправить цифровую подарочную карту по email',
      locale: 'ru',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      deliveryMethod: 'digital',
    },
    {
      id: 'ru-gift-for-friend',
      prompt: 'Подарочная карта для друга',
      locale: 'ru',
      surface: 'customer',
      expectedAction: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
      recipientName: 'Friend',
      deliveryMethod: 'digital',
    },
  ];
