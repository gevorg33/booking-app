import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ApplyLoyaltyAtCheckoutMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'apply_loyalty_at_checkout';
  rescueReason: 'apply_loyalty_at_checkout';
  loyaltyPointsToRedeem?: number | 'max';
};

export const APPLY_LOYALTY_AT_CHECKOUT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian apply loyalty at checkout (customer mobile):
  - apply_loyalty_at_checkout: hy «օգտագործել իմ միավորները checkout-ում», «կիրառել loyalty points-ը»; ru «использовать мои баллы на checkout», «применить бонусные баллы к записи». MUTATE session loyaltyPointsToRedeem — NOT explain_loyalty_points.`;

export const APPLY_LOYALTY_AT_CHECKOUT_MULTILINGUAL_SCENARIOS: readonly ApplyLoyaltyAtCheckoutMultilingualScenario[] =
  [
    {
      id: 'use-points-hy-customer',
      locale: 'hy',
      prompt: 'Օգտագործել իմ միավորները checkout-ում',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'apply-loyalty-hy-customer',
      locale: 'hy',
      prompt: 'Կիրառել loyalty points-ը այս ամրագրման checkout-ում',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'use-points-ru-customer',
      locale: 'ru',
      prompt: 'Использовать мои баллы на checkout',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'apply-bonus-ru-customer',
      locale: 'ru',
      prompt: 'Применить бонусные баллы к этой записи',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'redeem-all-hy-customer',
      locale: 'hy',
      prompt: 'Վճարել բոլոր միավորներով checkout-ում',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
    {
      id: 'spend-points-ru-customer',
      locale: 'ru',
      prompt: 'Списать loyalty points на этот заказ',
      surface: 'customer',
      expectedAction: 'apply_loyalty_at_checkout',
      rescueReason: 'apply_loyalty_at_checkout',
      loyaltyPointsToRedeem: 'max',
    },
  ];
