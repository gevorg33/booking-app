import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type BusinessCurrencyEvalAction =
  | 'configure_business_currency'
  | 'explain_business_currency'
  | 'bulk_update_service_currency';

export interface BusinessCurrencyEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: BusinessCurrencyEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Classifier guidance for Armenian/Russian business currency phrasing (ai-cmd-curr-4). */
export const BUSINESS_CURRENCY_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian business currency (dashboard):
  - configure_business_currency: hy «սահմանել լռելյա արժույթը AMD», «սալոնը փոխել եվրոյի», «նոր ծառայությունների համար օգտագործել ռուբլեր»; ru «установить валюту по умолчанию AMD», «переключить салон на евро», «использовать рубли для новых услуг». Set currencyCode ISO (AMD|EUR|RUB|USD|…).
  - explain_business_currency: hy «որն է մեր լռելյա արժույթը», «բացատրիր սալոնի արժույթը», «քանի ծառայություն է այլ արժույթով»; ru «какая валюта по умолчанию», «объясни настройки валюты салона», «сколько услуг в другой валюте», «поддерживает ли Stripe нашу валюту».
  - bulk_update_service_currency: hy «հավասարեցնել բոլոր ծառայությունները լռելյա արժույթին»; ru «синхронизировать валюту услуг с валютой по умолчанию», «привести все услуги к валюте по умолчанию». Align service.currency to business default only — confirm before mutate.`;

export const MULTILINGUAL_BUSINESS_CURRENCY_EVAL_SCENARIOS: BusinessCurrencyEvalScenario[] =
  [
    {
      id: 'hy-configure-amd',
      locale: 'hy',
      prompt: 'Սահմանել լռելյաոն արժույթը AMD',
      expectedAction: 'configure_business_currency',
      rescueReason: 'configure_business_currency',
      paramsPartial: { currencyCode: 'AMD' },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-euros',
      locale: 'hy',
      prompt: 'Սալոնը փոխել եվրոյի',
      expectedAction: 'configure_business_currency',
      rescueReason: 'configure_business_currency',
      paramsPartial: { currencyCode: 'EUR' },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-rubles',
      locale: 'hy',
      prompt: 'Նոր ծառայությունների համար օգտագործել ռուբլեր',
      expectedAction: 'configure_business_currency',
      rescueReason: 'configure_business_currency',
      paramsPartial: { currencyCode: 'RUB' },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-amd',
      locale: 'ru',
      prompt: 'Установить валюту по умолчанию AMD',
      expectedAction: 'configure_business_currency',
      rescueReason: 'configure_business_currency',
      paramsPartial: { currencyCode: 'AMD' },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-euros',
      locale: 'ru',
      prompt: 'Переключить салон на евро',
      expectedAction: 'configure_business_currency',
      rescueReason: 'configure_business_currency',
      paramsPartial: { currencyCode: 'EUR' },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-rubles',
      locale: 'ru',
      prompt: 'Использовать рубли для новых услуг',
      expectedAction: 'configure_business_currency',
      rescueReason: 'configure_business_currency',
      paramsPartial: { currencyCode: 'RUB' },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-default',
      locale: 'hy',
      prompt: 'Որն է մեր լռելյա արժույթը',
      expectedAction: 'explain_business_currency',
      rescueReason: 'explain_business_currency',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-settings',
      locale: 'hy',
      prompt: 'Բացատրիր սալոնի արժույթի կարգավորումները',
      expectedAction: 'explain_business_currency',
      rescueReason: 'explain_business_currency',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-mismatch-count',
      locale: 'hy',
      prompt: 'Քանի ծառայություն է այլ արժույթով',
      expectedAction: 'explain_business_currency',
      rescueReason: 'explain_business_currency',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-default',
      locale: 'ru',
      prompt: 'Какая у нас валюта по умолчанию',
      expectedAction: 'explain_business_currency',
      rescueReason: 'explain_business_currency',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-settings',
      locale: 'ru',
      prompt: 'Объясни настройки валюты салона',
      expectedAction: 'explain_business_currency',
      rescueReason: 'explain_business_currency',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-stripe',
      locale: 'ru',
      prompt: 'Поддерживает ли Stripe нашу валюту',
      expectedAction: 'explain_business_currency',
      rescueReason: 'explain_business_currency',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-mismatch-count',
      locale: 'ru',
      prompt: 'Сколько услуг в другой валюте',
      expectedAction: 'explain_business_currency',
      rescueReason: 'explain_business_currency',
      needsMultilingual: true,
    },
    {
      id: 'hy-bulk-align-default',
      locale: 'hy',
      prompt: 'Հավասարեցնել բոլոր ծառայությունները լռելյա արժույթին',
      expectedAction: 'bulk_update_service_currency',
      rescueReason: 'bulk_update_service_currency',
      needsMultilingual: true,
    },
    {
      id: 'hy-bulk-sync-catalog',
      locale: 'hy',
      prompt:
        'Կատալոգի ծառայությունների արժույթը սինք անել բիզնեսի default-ի հետ',
      expectedAction: 'bulk_update_service_currency',
      rescueReason: 'bulk_update_service_currency',
      needsMultilingual: true,
    },
    {
      id: 'ru-bulk-sync-default',
      locale: 'ru',
      prompt: 'Синхронизировать валюту услуг с валютой по умолчанию',
      expectedAction: 'bulk_update_service_currency',
      rescueReason: 'bulk_update_service_currency',
      needsMultilingual: true,
    },
    {
      id: 'ru-bulk-align-all',
      locale: 'ru',
      prompt: 'Привести все услуги к валюте по умолчанию',
      expectedAction: 'bulk_update_service_currency',
      rescueReason: 'bulk_update_service_currency',
      needsMultilingual: true,
    },
    {
      id: 'ru-bulk-update-existing',
      locale: 'ru',
      prompt: 'Обновить валюты всех существующих услуг на default',
      expectedAction: 'bulk_update_service_currency',
      rescueReason: 'bulk_update_service_currency',
      needsMultilingual: true,
    },
  ] as const;
