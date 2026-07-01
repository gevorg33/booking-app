import type { BookWithGiftCardPromptFixture } from './ai-book-with-gift-card.fixtures.js';

export const BOOK_WITH_GIFT_CARD_MULTILINGUAL_CLASSIFIER_RULES = `- book_with_gift_card HY/RU: hy «amragrel gift card-ով», «օգտագործել նվեր քարտը ամրագրության համար»; ru «забронировать с подарочной картой», «оплатить подарочной картой при записи».`;

export const BOOK_WITH_GIFT_CARD_MULTILINGUAL_SCENARIOS: readonly (BookWithGiftCardPromptFixture & {
  locale: 'hy' | 'ru';
})[] = [
  {
    id: 'book-with-gift-card-hy',
    locale: 'hy',
    prompt: 'Ամրագրել gift card-ով',
    surface: 'customer',
    expectedAction: 'book_with_gift_card',
    rescueReason: 'book_gift_card',
    requiresCode: true,
  },
  {
    id: 'use-gift-card-booking-hy',
    locale: 'hy',
    prompt: 'Օգտագործել նվեր քարտը այս ամրագրության համար',
    surface: 'customer',
    expectedAction: 'book_with_gift_card',
    rescueReason: 'book_gift_card',
    requiresCode: true,
  },
  {
    id: 'book-with-gift-card-ru',
    locale: 'ru',
    prompt: 'Забронировать с подарочной картой',
    surface: 'customer',
    expectedAction: 'book_with_gift_card',
    rescueReason: 'book_gift_card',
    requiresCode: true,
  },
  {
    id: 'pay-gift-card-booking-ru',
    locale: 'ru',
    prompt: 'Оплатить подарочной картой при записи',
    surface: 'customer',
    expectedAction: 'book_with_gift_card',
    rescueReason: 'book_gift_card',
    requiresCode: true,
  },
  {
    id: 'gift-card-code-ru',
    locale: 'ru',
    prompt: 'Записаться с подарочной картой GCM-RU1234',
    surface: 'customer',
    expectedAction: 'book_with_gift_card',
    rescueReason: 'book_gift_card',
    giftCardCode: 'GCM-RU1234',
  },
  {
    id: 'gift-card-code-hy',
    locale: 'hy',
    prompt: 'Amragrel GCM-HY5678 gift card-ով',
    surface: 'customer',
    expectedAction: 'book_with_gift_card',
    rescueReason: 'book_gift_card',
    giftCardCode: 'GCM-HY5678',
  },
];
