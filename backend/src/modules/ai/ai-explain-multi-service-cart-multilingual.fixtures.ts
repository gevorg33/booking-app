import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ExplainMultiServiceCartFocus } from './ai-explain-multi-service-cart.fixtures.js';

export type ExplainMultiServiceCartMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_multi_service_cart';
  rescueReason: 'explain_multi_service_cart';
  focus?: ExplainMultiServiceCartFocus;
};

export const EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian explain multi-service cart (customer mobile):
  - explain_multi_service_cart: hy «Ինչ կա զambyugh-ում», «Քանի ժամ է spa day-ս»; ru «Что в моей корзине», «Сколько длится мой spa day». READ cart contents + total time — NOT add_services_to_cart, NOT show_cart_total_duration (minutes-only).`;

export const EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_SCENARIOS: readonly ExplainMultiServiceCartMultilingualScenario[] =
  [
    {
      id: 'whats-in-cart-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ կա զambyugh-ում',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'contents',
    },
    {
      id: 'spa-day-duration-hy-customer',
      locale: 'hy',
      prompt: 'Քանի ժամ է spa day-ս',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'duration',
    },
    {
      id: 'explain-cart-hy-customer',
      locale: 'hy',
      prompt: 'Բացատրել իմ cart-ը',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'overview',
    },
    {
      id: 'whats-in-cart-ru-customer',
      locale: 'ru',
      prompt: 'Что в моей корзине',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'contents',
    },
    {
      id: 'spa-day-duration-ru-customer',
      locale: 'ru',
      prompt: 'Сколько длится мой spa day',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'duration',
    },
    {
      id: 'list-cart-services-ru-customer',
      locale: 'ru',
      prompt: 'Показать услуги в корзине',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'contents',
    },
  ];
