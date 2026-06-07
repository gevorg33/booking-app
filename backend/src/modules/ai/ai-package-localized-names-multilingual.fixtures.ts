import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type PackageLocalizedNamesEvalAction =
  | 'configure_package_localized_names'
  | 'explain_package_display_name';

export interface PackageLocalizedNamesEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: PackageLocalizedNamesEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Classifier guidance for Armenian/Russian package localized-name phrasing (ai-cmd-lang-8). */
export const PACKAGE_LOCALIZED_NAMES_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian package localized names (dashboard + public booking):
  - configure_package_localized_names: hy «ավելացրի՛ր հայերեն անուն», «հեռացրի՛ր հայերեն թարգմանությունը փաթեթից», «սահմանի՛ր ռուսերեն անվանում», «ջնջի՛ր բոլոր լեզուների թարգմանությունները փաթեթից»; ru «установи русское название для пакета», «удали русский перевод названия пакета», «добавь армянское название для пакета», «убери все локализованные названия пакета». MUTATE one package metadata.localizedNames — NOT configure_business_languages (tenant locale settings) and NOT bulk catalog translation creation.
  - explain_package_display_name: hy «ինչ անուն է ցուցադրվում», «որ անունն են տեսնում», «բացատրի՛ր փաթեթի ցուցադրման անունը», «ցույց տուր վերնագիրը»; ru «какое название видят посетители», «какой заголовок показывает пакет», «объясни отображаемое имя пакета», «почему пакет называется по-армянски». READ which title public booking shows for a visitor locale — NOT configure_package_localized_names (mutate) and NOT explain_package_currency (totals currency).`;

export const MULTILINGUAL_PACKAGE_LOCALIZED_NAMES_EVAL_SCENARIOS: PackageLocalizedNamesEvalScenario[] =
  [
    {
      id: 'hy-configure-add-spa-day',
      locale: 'hy',
      prompt: 'Ավելացրի՛ր հայերեն անուն «Սպա օր» Spa Day փաթեթի համար',
      expectedAction: 'configure_package_localized_names',
      rescueReason: 'configure_package_localized_names',
      paramsPartial: { operation: 'set' },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-clear-spa-day',
      locale: 'hy',
      prompt: 'Հեռացրի՛ր հայերեն թարգմանությունը Spa Day փաթեթից',
      expectedAction: 'configure_package_localized_names',
      rescueReason: 'configure_package_localized_names',
      paramsPartial: { operation: 'clear' },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-set-ru-wellness',
      locale: 'hy',
      prompt: 'Սահմանի՛ր ռուսերեն անվանում Wellness փաթեթի համար «Спа день»',
      expectedAction: 'configure_package_localized_names',
      rescueReason: 'configure_package_localized_names',
      paramsPartial: { operation: 'set' },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-clear-all-bridal',
      locale: 'hy',
      prompt: 'Ջնջի՛ր բոլոր լեզուների թարգմանությունները Bridal փաթեթից',
      expectedAction: 'configure_package_localized_names',
      rescueReason: 'configure_package_localized_names',
      paramsPartial: { operation: 'clear' },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-hy-spa-day',
      locale: 'hy',
      prompt: 'Ինչ անուն է ցուցադրվում Spa Day փաթեթի համար հայերենով',
      expectedAction: 'explain_package_display_name',
      rescueReason: 'explain_package_display_name',
      paramsPartial: { packageName: 'Spa Day', locale: 'hy' },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-ru-spa-day',
      locale: 'hy',
      prompt:
        'Որ անունն են տեսնում ռուսերենով Spa Day փաթեթի համար գրանցման էջում',
      expectedAction: 'explain_package_display_name',
      rescueReason: 'explain_package_display_name',
      paramsPartial: { packageName: 'Spa Day', locale: 'ru' },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-wellness-display',
      locale: 'hy',
      prompt: 'Բացատրի՛ր Wellness փաթեթի ցուցադրման անունը հայերենով',
      expectedAction: 'explain_package_display_name',
      rescueReason: 'explain_package_display_name',
      paramsPartial: { packageName: 'Wellness', locale: 'hy' },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-bridal-en-public',
      locale: 'hy',
      prompt:
        'Ցույց տուր Bridal փաթեթի վերնագիրը անգլերենով հանրային գրանցման էջում',
      expectedAction: 'explain_package_display_name',
      rescueReason: 'explain_package_display_name',
      paramsPartial: { packageName: 'Bridal', locale: 'en' },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-set-wellness',
      locale: 'ru',
      prompt: 'Установи русское название для пакета Wellness: Спа день',
      expectedAction: 'configure_package_localized_names',
      rescueReason: 'configure_package_localized_names',
      paramsPartial: { operation: 'set' },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-clear-bridal',
      locale: 'ru',
      prompt: 'Удали русский перевод названия пакета Bridal',
      expectedAction: 'configure_package_localized_names',
      rescueReason: 'configure_package_localized_names',
      paramsPartial: { operation: 'clear' },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-add-hy-spa-day',
      locale: 'ru',
      prompt: 'Добавь армянское название «Սպա օր» для пакета Spa Day',
      expectedAction: 'configure_package_localized_names',
      rescueReason: 'configure_package_localized_names',
      paramsPartial: { operation: 'set' },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-clear-all-bridal',
      locale: 'ru',
      prompt: 'Убери все локализованные названия пакета Bridal',
      expectedAction: 'configure_package_localized_names',
      rescueReason: 'configure_package_localized_names',
      paramsPartial: { operation: 'clear' },
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-armenian-spa-day',
      locale: 'ru',
      prompt: 'Почему пакет Spa Day называется по-армянски на этой странице?',
      expectedAction: 'explain_package_display_name',
      rescueReason: 'explain_package_display_name',
      paramsPartial: { packageName: 'Spa Day' },
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-ru-spa-day',
      locale: 'ru',
      prompt:
        'Какое название видят русскоязычные посетители для пакета Spa Day на странице записи?',
      expectedAction: 'explain_package_display_name',
      rescueReason: 'explain_package_display_name',
      paramsPartial: { packageName: 'Spa Day', locale: 'ru' },
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-hy-wellness',
      locale: 'ru',
      prompt: 'Какой заголовок показывает пакет Wellness на армянском языке?',
      expectedAction: 'explain_package_display_name',
      rescueReason: 'explain_package_display_name',
      paramsPartial: { packageName: 'Wellness', locale: 'hy' },
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-ru-bridal',
      locale: 'ru',
      prompt:
        'Объясни отображаемое имя пакета Bridal на русском для посетителей',
      expectedAction: 'explain_package_display_name',
      rescueReason: 'explain_package_display_name',
      paramsPartial: { packageName: 'Bridal', locale: 'ru' },
      needsMultilingual: true,
    },
  ] as const;
