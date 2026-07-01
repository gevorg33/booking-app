import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type CustomerMarketingGrowthDeferredIntent =
  | 'switch_to_consumer_app'
  | 'promo_code_help'
  | 'loyalty_points_balance';

export type MarketingGrowthMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  expectedAction: CustomerMarketingGrowthDeferredIntent;
  rescueReason: string;
};

/** Customer-only marketing/growth intents in the deferred acc-2.4 sweep. */
export const CUSTOMER_MARKETING_GROWTH_DEFERRED_INTENTS = [
  'switch_to_consumer_app',
  'promo_code_help',
  'loyalty_points_balance',
] as const satisfies readonly CustomerMarketingGrowthDeferredIntent[];

/** Classifier guidance for hy/ru customer marketing/growth (acc-2.4). */
export const MARKETING_GROWTH_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian customer marketing/growth (logged-in consumer app):
  - switch_to_consumer_app: hy «բացել consumer app-ը»; ru «перейти в приложение для клиентов». NOT how_to_download_app (install).
  - promo_code_help: hy «ինչպես աշխատում են promo codes»; ru «как работают промокоды». NOT refer_a_friend (referral program).
  - loyalty_points_balance: hy «ցույց տal loyalty points-ը»; ru «показать мои бонусные баллы». NOT loyalty_points_balance dashboard summaries.`;

export const MARKETING_GROWTH_MULTILINGUAL_SCENARIOS: MarketingGrowthMultilingualScenario[] =
  [
    {
      id: 'switch-to-consumer-app-en',
      locale: 'en',
      prompt: 'Switch to consumer app',
      expectedAction: 'switch_to_consumer_app',
      rescueReason: 'switch_app',
    },
    {
      id: 'switch-to-consumer-app-hy',
      locale: 'hy',
      prompt: 'Բացել consumer app-ը',
      expectedAction: 'switch_to_consumer_app',
      rescueReason: 'switch_app',
    },
    {
      id: 'switch-to-consumer-app-ru',
      locale: 'ru',
      prompt: 'Перейти в приложение для клиентов',
      expectedAction: 'switch_to_consumer_app',
      rescueReason: 'switch_app',
    },
    {
      id: 'promo-code-help-en',
      locale: 'en',
      prompt: 'How do promo codes work',
      expectedAction: 'promo_code_help',
      rescueReason: 'promo_help',
    },
    {
      id: 'promo-code-help-hy',
      locale: 'hy',
      prompt: 'Ինչպե՞ս աշխատում են promo codes',
      expectedAction: 'promo_code_help',
      rescueReason: 'promo_help',
    },
    {
      id: 'promo-code-help-ru',
      locale: 'ru',
      prompt: 'Как работают промокоды',
      expectedAction: 'promo_code_help',
      rescueReason: 'promo_help',
    },
    {
      id: 'promo-code-help-hy-2',
      locale: 'hy',
      prompt: 'Ինչպե՞ս կիրառել promo code checkout-ում',
      expectedAction: 'promo_code_help',
      rescueReason: 'promo_help',
    },
    {
      id: 'promo-code-help-ru-2',
      locale: 'ru',
      prompt: 'Как применить промокод при оплате',
      expectedAction: 'promo_code_help',
      rescueReason: 'promo_help',
    },
    {
      id: 'loyalty-points-balance-en',
      locale: 'en',
      prompt: 'Check my loyalty points',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'loyalty-points-balance-hy',
      locale: 'hy',
      prompt: 'Ցույց տal loyalty points-ը',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'loyalty-points-balance-ru',
      locale: 'ru',
      prompt: 'Показать мои бонусные баллы',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'loyalty-points-balance-hy-2',
      locale: 'hy',
      prompt: 'Քանի loyalty point ունեմ',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'loyalty-points-balance-ru-2',
      locale: 'ru',
      prompt: 'Сколько у меня бонусных баллов',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
  ];
