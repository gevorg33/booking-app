import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type BusinessLanguagesEvalAction =
  | 'configure_business_languages'
  | 'explain_business_languages';

export interface BusinessLanguagesEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: BusinessLanguagesEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Classifier guidance for Armenian/Russian business language phrasing (ai-cmd-lang-4). */
export const BUSINESS_LANGUAGES_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian business languages (dashboard):
  - configure_business_languages: hy «միացրու հայերեն և ռուսերեն», «անջատիր ռուսերենը», «սահմանիր լռելյայի լեզուն անգլերեն», «ակտիվացնել բոլոր լեզուները»; ru «включи армянский и русский», «отключи русский для салона», «установи английский по умолчанию», «добавить английский как язык салона», «выключить армянский для клиентов». Updates settings.enabledLocales and settings.defaultLocale — NOT catalog localizedNames creation.
  - explain_business_languages: hy «ինչ լեզուներ են միացված», «բացատրիր լեզվական կարգավորումները», «որ լեզուն է հիմնականը», «քանի ծառայություն ունի թարգմանություն անջատված լեզուներով»; ru «объясни настройки языков салона», «какой язык по умолчанию», «какие языки включены в салоне», «сколько услуг с переводами на отключённых языках». Read-only status — NOT configure_business_languages (mutate) and NOT bulk_strip_disabled_locale_translations (cleanup).`;

export const MULTILINGUAL_BUSINESS_LANGUAGES_EVAL_SCENARIOS: BusinessLanguagesEvalScenario[] =
  [
    {
      id: 'hy-configure-hy-ru',
      locale: 'hy',
      prompt: 'Միացրու հայերեն և ռուսերեն լեզուները',
      expectedAction: 'configure_business_languages',
      rescueReason: 'configure_business_languages',
      paramsPartial: { operation: 'enable' },
      needsMultilingual: true,
    },
    {
      id: 'hy-disable-ru',
      locale: 'hy',
      prompt: 'Անջատի՛ր ռուսերենը մեր սալոնում',
      expectedAction: 'configure_business_languages',
      rescueReason: 'configure_business_languages',
      paramsPartial: { operation: 'disable' },
      needsMultilingual: true,
    },
    {
      id: 'hy-default-en',
      locale: 'hy',
      prompt: 'Սահմանի՛ր լռելյայի լեզուն անգլերեն',
      expectedAction: 'configure_business_languages',
      rescueReason: 'configure_business_languages',
      paramsPartial: { operation: 'set_default' },
      needsMultilingual: true,
    },
    {
      id: 'hy-enable-all',
      locale: 'hy',
      prompt: 'Ակտիվացնել բոլոր լեզուները',
      expectedAction: 'configure_business_languages',
      rescueReason: 'configure_business_languages',
      paramsPartial: { operation: 'enable' },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-enabled',
      locale: 'hy',
      prompt: 'Ինչ լեզուներ են միացված մեր սալոնում',
      expectedAction: 'explain_business_languages',
      rescueReason: 'explain_business_languages',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-settings',
      locale: 'hy',
      prompt: 'Բացատրի՛ր մեր լեզվական կարգավորումները',
      expectedAction: 'explain_business_languages',
      rescueReason: 'explain_business_languages',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-primary',
      locale: 'hy',
      prompt: 'Որ լեզուն է հիմնականը',
      expectedAction: 'explain_business_languages',
      rescueReason: 'explain_business_languages',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-disabled-translations',
      locale: 'hy',
      prompt: 'Քանի ծառայություն ունի թարգմանություն անջատված լեզուներով',
      expectedAction: 'explain_business_languages',
      rescueReason: 'explain_business_languages',
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-hy-ru',
      locale: 'ru',
      prompt: 'Включи армянский и русский языки',
      expectedAction: 'configure_business_languages',
      rescueReason: 'configure_business_languages',
      paramsPartial: { operation: 'enable' },
      needsMultilingual: true,
    },
    {
      id: 'ru-disable-ru',
      locale: 'ru',
      prompt: 'Отключи русский для нашего салона',
      expectedAction: 'configure_business_languages',
      rescueReason: 'configure_business_languages',
      paramsPartial: { operation: 'disable' },
      needsMultilingual: true,
    },
    {
      id: 'ru-default-en',
      locale: 'ru',
      prompt: 'Установи английский язык по умолчанию',
      expectedAction: 'configure_business_languages',
      rescueReason: 'configure_business_languages',
      paramsPartial: { operation: 'set_default' },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-add-en',
      locale: 'ru',
      prompt: 'Добавить английский как язык салона',
      expectedAction: 'configure_business_languages',
      rescueReason: 'configure_business_languages',
      paramsPartial: { operation: 'enable' },
      needsMultilingual: true,
    },
    {
      id: 'ru-disable-hy',
      locale: 'ru',
      prompt: 'Выключить армянский для клиентов',
      expectedAction: 'configure_business_languages',
      rescueReason: 'configure_business_languages',
      paramsPartial: { operation: 'disable' },
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-settings',
      locale: 'ru',
      prompt: 'Объясни настройки языков салона',
      expectedAction: 'explain_business_languages',
      rescueReason: 'explain_business_languages',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-default',
      locale: 'ru',
      prompt: 'Какой язык по умолчанию у салона?',
      expectedAction: 'explain_business_languages',
      rescueReason: 'explain_business_languages',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-enabled',
      locale: 'ru',
      prompt: 'Какие языки включены в салоне',
      expectedAction: 'explain_business_languages',
      rescueReason: 'explain_business_languages',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-disabled-translations',
      locale: 'ru',
      prompt: 'Сколько услуг с переводами на отключённых языках?',
      expectedAction: 'explain_business_languages',
      rescueReason: 'explain_business_languages',
      needsMultilingual: true,
    },
  ] as const;
