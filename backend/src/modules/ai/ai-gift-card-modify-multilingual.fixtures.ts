import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type GiftCardModifyMultilingualScenario = {
  id: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  surface: 'customer';
  expectedAction: 'request_gift_card_modify';
  rescueReason: 'gift_card_modify';
};

export const GIFT_CARD_MODIFY_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian gift card modify request (customer mobile):
  - request_gift_card_modify: hy «Փոխել իմ նվեր քարտի պատվերը», «Փոփոխել իմ նվեր քարտի ստացողին»; ru «Изменить мой заказ на подарочную карту», «Изменить получателя моей подарочной карты». MUTATE change-order-details request — NOT request_gift_card_cancel (cancel/refund).`;

export const GIFT_CARD_MODIFY_MULTILINGUAL_SCENARIOS: readonly GiftCardModifyMultilingualScenario[] =
  [
    {
      id: 'gift-card-modify-hy-1',
      locale: 'hy',
      prompt: 'Փոխել իմ նվեր քարտի պատվերը',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'gift-card-modify-hy-2',
      locale: 'hy',
      prompt: 'Ես ուզում եմ փոփոխել իմ նվեր քարտի պատվերը',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'gift-card-modify-hy-3',
      locale: 'hy',
      prompt: 'Փոփոխել իմ նվեր քարտի ստացողին',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'gift-card-modify-ru-1',
      locale: 'ru',
      prompt: 'Изменить мой заказ на подарочную карту',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'gift-card-modify-ru-2',
      locale: 'ru',
      prompt: 'Я хочу изменить мой заказ подарочной карты',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'gift-card-modify-ru-3',
      locale: 'ru',
      prompt: 'Изменить получателя моей подарочной карты',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
  ];
