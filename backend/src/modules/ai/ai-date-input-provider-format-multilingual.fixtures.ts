import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type DateInputProviderFormatEvalAction =
  | 'explain_date_input_format'
  | 'preview_date_input_parse'
  | 'explain_provider_date_display'
  | 'configure_provider_push_date_format';

export interface DateInputProviderFormatEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: DateInputProviderFormatEvalAction;
  rescueReason?: string;
  needsMultilingual?: boolean;
}

/** Armenian/Russian date-input parse + provider date-format phrasing (ai-cmd-fmt-17). */
export const DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian date-input parse + provider date-format (fmt-1.7..1.8):
  - explain_date_input_format: hy «ինչպես են մուտքագրվող ամսաթվի դաշտերը վերլուծում մուտքը մեր dateFormat-ով», «բացատրիր ամսաթվի մուտքագրումը calendar picker-ի համեմատ»; ru «как поля ввода дат разбирают ввод с нашим dateFormat», «объясни ввод даты vs календарь picker». READ typed-field parsing rules — NOT preview_date_input_parse (sample ISO output) and NOT explain_business_date_format (display settings).
  - preview_date_input_parse: hy «նախադիտել ինչպես կվերլուծվի 04/06/2026 մուտքը», «ցույց տուր ISO օրը 15/08/2026 մուտքագրման համար»; ru «предпросмотр как 04/06/2026 разбирается при вводе», «какой ISO день для 15/08/2026 в поле ввода». READ sample parse — NOT explain_date_input_format (rules) and NOT preview_business_date_format.
  - explain_provider_date_display: hy «ինչպես է provider հավելվածը ցույց տալիս ամսաթվերը քարտերում», «ինչ dateFormat է օգտագործում իմ գրաֆիկը»; ru «как приложение провайдера форматирует даты на карточках», «какой формат дат в моём расписании». READ provider auth settings (fmt-1.8) — NOT explain_provider_payment_currency (currency) and NOT configure_provider_push_date_format (mutate).
  - configure_provider_push_date_format: hy «կարգավորել push ծանուցումները օգտագործելու salon ժամի ձևաչափը», «միացնել 24-ժամյա ժամը provider push-ում»; ru «настроить push уведомления использовать формат времени салона», «включить 24-часовой формат в push провайдера». MUTATE fmt-1.8 FCM time wiring — NOT explain_provider_date_display and NOT explain_last_push.`;

export const MULTILINGUAL_DATE_INPUT_PROVIDER_FORMAT_EVAL_SCENARIOS: DateInputProviderFormatEvalScenario[] =
  [
    {
      id: 'hy-explain-typed-field-parse',
      locale: 'hy',
      prompt:
        'Ինչպես են մուտքագրվող ամսաթվի դաշտերը վերլուծում մուտքը մեր dateFormat-ով',
      expectedAction: 'explain_date_input_format',
      rescueReason: 'explain_date_input_format',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-input-vs-picker',
      locale: 'hy',
      prompt: 'Բացատրիր ամսաթվի մուտքագրումը calendar picker-ի համեմատ',
      expectedAction: 'explain_date_input_format',
      rescueReason: 'explain_date_input_format',
      needsMultilingual: true,
    },
    {
      id: 'hy-preview-parse-0406',
      locale: 'hy',
      prompt: 'Նախադիտել ինչպես կվերլուծվի 04/06/2026 մուտքը',
      expectedAction: 'preview_date_input_parse',
      rescueReason: 'preview_date_input_parse',
      needsMultilingual: true,
    },
    {
      id: 'hy-preview-iso-1508',
      locale: 'hy',
      prompt: 'Ցույց տուր ISO օրը 15/08/2026 մուտքագրման համար',
      expectedAction: 'preview_date_input_parse',
      rescueReason: 'preview_date_input_parse',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-provider-cards',
      locale: 'hy',
      prompt:
        'Ինչպես է provider հավելվածը ցույց տալիս ամսաթվերը քարտերում',
      expectedAction: 'explain_provider_date_display',
      rescueReason: 'explain_provider_date_display',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-schedule-format',
      locale: 'hy',
      prompt: 'Ինչ dateFormat է օգտագործում իմ գրաֆիկը',
      expectedAction: 'explain_provider_date_display',
      rescueReason: 'explain_provider_date_display',
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-push-time',
      locale: 'hy',
      prompt:
        'Կարգավորել push ծանուցումները օգտագործելու salon ժամի ձևաչափը',
      expectedAction: 'configure_provider_push_date_format',
      rescueReason: 'configure_provider_push_date_format',
      needsMultilingual: true,
    },
    {
      id: 'hy-enable-24h-push',
      locale: 'hy',
      prompt: 'Միացնել 24-ժամյա ժամը provider push-ում',
      expectedAction: 'configure_provider_push_date_format',
      rescueReason: 'configure_provider_push_date_format',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-typed-field-parse',
      locale: 'ru',
      prompt: 'Как поля ввода дат разбирают ввод с нашим dateFormat',
      expectedAction: 'explain_date_input_format',
      rescueReason: 'explain_date_input_format',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-input-vs-picker',
      locale: 'ru',
      prompt: 'Объясни ввод даты vs календарь picker',
      expectedAction: 'explain_date_input_format',
      rescueReason: 'explain_date_input_format',
      needsMultilingual: true,
    },
    {
      id: 'ru-preview-parse-0406',
      locale: 'ru',
      prompt: 'Предпросмотр как 04/06/2026 разбирается при вводе',
      expectedAction: 'preview_date_input_parse',
      rescueReason: 'preview_date_input_parse',
      needsMultilingual: true,
    },
    {
      id: 'ru-preview-iso-1508',
      locale: 'ru',
      prompt: 'Какой ISO день для 15/08/2026 в поле ввода',
      expectedAction: 'preview_date_input_parse',
      rescueReason: 'preview_date_input_parse',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-provider-cards',
      locale: 'ru',
      prompt: 'Как приложение провайдера форматирует даты на карточках',
      expectedAction: 'explain_provider_date_display',
      rescueReason: 'explain_provider_date_display',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-schedule-format',
      locale: 'ru',
      prompt: 'Какой формат дат в моём расписании',
      expectedAction: 'explain_provider_date_display',
      rescueReason: 'explain_provider_date_display',
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-push-time',
      locale: 'ru',
      prompt:
        'Настроить push уведомления использовать формат времени салона',
      expectedAction: 'configure_provider_push_date_format',
      rescueReason: 'configure_provider_push_date_format',
      needsMultilingual: true,
    },
    {
      id: 'ru-enable-24h-push',
      locale: 'ru',
      prompt: 'Включить 24-часовой формат в push провайдера',
      expectedAction: 'configure_provider_push_date_format',
      rescueReason: 'configure_provider_push_date_format',
      needsMultilingual: true,
    },
  ];
