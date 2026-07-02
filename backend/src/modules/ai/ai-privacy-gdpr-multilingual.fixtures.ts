import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type PrivacyGdprMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'privacy_export' | 'privacy_delete';
  rescueReason: 'privacy_export' | 'privacy_delete';
};

export const PRIVACY_GDPR_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian GDPR self-service (customer mobile):
  - privacy_export: hy «արտահանել իմ տվյալները», «ներբեռնել իմ տվյալների պատճենը»; ru «экспортировать мои данные», «скачать копию моих данных». NOT privacy_delete.
  - privacy_delete: hy «ջնջել իմ հաշիվը», «մոռանալ իմ տվյալները»; ru «удалить мой аккаунт», «забыть мои данные». NOT privacy_export.`;

export const PRIVACY_GDPR_MULTILINGUAL_SCENARIOS: readonly PrivacyGdprMultilingualScenario[] =
  [
    {
      id: 'privacy-export-hy',
      locale: 'hy',
      prompt: 'Արտահանել իմ տվյալները',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'privacy-export-hy-copy',
      locale: 'hy',
      prompt: 'Ներբեռնել իմ տվյալների պատճենը',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'privacy-export-hy-gdpr',
      locale: 'hy',
      prompt: 'Ուղարկել իմ GDPR export-ը',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'privacy-export-ru',
      locale: 'ru',
      prompt: 'Экспортировать мои данные',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'privacy-export-ru-copy',
      locale: 'ru',
      prompt: 'Скачать копию моих данных',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'privacy-export-ru-gdpr',
      locale: 'ru',
      prompt: 'Запросить GDPR экспорт',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'privacy-delete-hy',
      locale: 'hy',
      prompt: 'Ջնջել իմ հաշիվը',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'privacy-delete-hy-forget',
      locale: 'hy',
      prompt: 'Մոռանալ իմ տվյալները',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'privacy-delete-hy-gdpr',
      locale: 'hy',
      prompt: 'Հեռացնել իմ consumer հաշիվը',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'privacy-delete-ru',
      locale: 'ru',
      prompt: 'Удалить мой аккаунт',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'privacy-delete-ru-forget',
      locale: 'ru',
      prompt: 'Забыть мои данные',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'privacy-delete-ru-gdpr',
      locale: 'ru',
      prompt: 'Удалить мой consumer аккаунт',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
  ];
