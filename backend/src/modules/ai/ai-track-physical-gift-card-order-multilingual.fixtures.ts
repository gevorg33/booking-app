import type { TrackPhysicalGiftCardOrderPromptFixture } from './ai-track-physical-gift-card-order.fixtures.js';

export const TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_CLASSIFIER_RULES = `- track_physical_gift_card_order HY/RU: hy «որտեղ է իմ ֆիզիկական նվer քart-ը», «gift card պատվeri կargavijak»; ru «где моя физическая подарочная карта», «статус заказа подарочной карты».`;

export const TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_SCENARIOS: readonly (TrackPhysicalGiftCardOrderPromptFixture & {
  locale: 'hy' | 'ru';
})[] = [
  {
    id: 'where-physical-gift-card-hy',
    locale: 'hy',
    prompt: 'Որտեղ է իմ ֆիզիկական նվer kart-ը',
    surface: 'customer',
    expectedAction: 'track_physical_gift_card_order',
    rescueReason: 'track_gift_card',
  },
  {
    id: 'track-order-hy',
    locale: 'hy',
    prompt: 'Gift card պատվeri կargavijak',
    surface: 'customer',
    expectedAction: 'track_physical_gift_card_order',
    rescueReason: 'track_gift_card',
  },
  {
    id: 'where-physical-gift-card-ru',
    locale: 'ru',
    prompt: 'Где моя физическая подарочная карта',
    surface: 'customer',
    expectedAction: 'track_physical_gift_card_order',
    rescueReason: 'track_gift_card',
  },
  {
    id: 'order-status-ru',
    locale: 'ru',
    prompt: 'Статус заказа подарочной карты',
    surface: 'customer',
    expectedAction: 'track_physical_gift_card_order',
    rescueReason: 'track_gift_card',
  },
  {
    id: 'shipping-status-ru',
    locale: 'ru',
    prompt: 'Где моя отправленная подарочная карта',
    surface: 'customer',
    expectedAction: 'track_physical_gift_card_order',
    rescueReason: 'track_gift_card',
  },
  {
    id: 'delivery-hy',
    locale: 'hy',
    prompt: 'Ուղարկված gift card-ի առաքման կargavijak',
    surface: 'customer',
    expectedAction: 'track_physical_gift_card_order',
    rescueReason: 'track_gift_card',
  },
];
