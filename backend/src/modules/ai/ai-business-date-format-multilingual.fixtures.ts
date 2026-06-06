import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { BusinessDateFormat, BusinessTimeFormat } from '../../common/utils/business-date-format.util.js';

export type BusinessDateFormatEvalAction =
  | 'configure_business_date_format'
  | 'explain_business_date_format';

export interface BusinessDateFormatEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: BusinessDateFormatEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  dateFormat?: BusinessDateFormat;
  timeFormat?: BusinessTimeFormat;
  needsMultilingual?: boolean;
}

/** Classifier guidance for Armenian/Russian business date/time format phrasing (ai-cmd-fmt-3). */
export const BUSINESS_DATE_FORMAT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian business date/time format (dashboard):
  - configure_business_date_format: hy «օգտագործել US ամսաթվի ձևաչափը», «անցնել 12-ժամյա ժամացույցին», «սահմանել ISO ամսաթվեր մեր սալոնի համար», «օգտագործել եվրոպական ամսաթվի ձևաչափը»; ru «использовать американский формат дат», «переключить на 12-часовой формат времени», «установить ISO даты для салона», «использовать европейский формат дат». Set dateFormat (DD/MM/YYYY | MM/DD/YYYY | YYYY-MM-DD) and/or timeFormat (24h | 12h) — NOT explain_business_date_format (read-only status).
  - explain_business_date_format: hy «ինչ ամսաթվի ձևաչափ է օգտագործում մեր սալոնը», «բացատրիր մեր ամսաթվի և ժամի կարգավորումները», «որ ժամի ձևաչափն է հիմնականը», «ցույց տուր այսօրվա ամսաթվի օրինակները»; ru «какой формат дат использует наш салон», «объясни настройки формата дат и времени», «какой у нас формат времени», «покажи примеры дат на сегодня». Read-only salon settings — NOT configure_business_date_format (mutate) and NOT explain_booking_date_format (customer booking page visitor display).`;

export const MULTILINGUAL_BUSINESS_DATE_FORMAT_EVAL_SCENARIOS: BusinessDateFormatEvalScenario[] =
  [
    {
      id: 'hy-configure-us-date',
      locale: 'hy',
      prompt: 'Օգտագործել US ամսաթվի ձևաչափը',
      expectedAction: 'configure_business_date_format',
      rescueReason: 'configure_business_date_format',
      paramsPartial: { dateFormat: 'MM/DD/YYYY' },
      dateFormat: 'MM/DD/YYYY',
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-12-hour',
      locale: 'hy',
      prompt: 'Անցնել 12-ժամյա ժամացույցին',
      expectedAction: 'configure_business_date_format',
      rescueReason: 'configure_business_date_format',
      paramsPartial: { timeFormat: '12h' },
      timeFormat: '12h',
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-iso-dates',
      locale: 'hy',
      prompt: 'Սահմանել ISO ամսաթվեր մեր սալոնի համար',
      expectedAction: 'configure_business_date_format',
      rescueReason: 'configure_business_date_format',
      paramsPartial: { dateFormat: 'YYYY-MM-DD' },
      dateFormat: 'YYYY-MM-DD',
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-european-date',
      locale: 'hy',
      prompt: 'Օգտագործել եվրոպական ամսաթվի ձևաչափը',
      expectedAction: 'configure_business_date_format',
      rescueReason: 'configure_business_date_format',
      paramsPartial: { dateFormat: 'DD/MM/YYYY' },
      dateFormat: 'DD/MM/YYYY',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-date-format',
      locale: 'hy',
      prompt: 'Ինչ ամսաթվի ձևաչափ է օգտագործում մեր սալոնը',
      expectedAction: 'explain_business_date_format',
      rescueReason: 'explain_business_date_format',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-date-time-settings',
      locale: 'hy',
      prompt: 'Բացատրիր մեր ամսաթվի և ժամի կարգավորումները',
      expectedAction: 'explain_business_date_format',
      rescueReason: 'explain_business_date_format',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-time-format',
      locale: 'hy',
      prompt: 'Որ ժամի ձևաչափն է հիմնականը',
      expectedAction: 'explain_business_date_format',
      rescueReason: 'explain_business_date_format',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-date-examples',
      locale: 'hy',
      prompt: 'Ցույց տուր այսօրվա ամսաթվի օրինակները',
      expectedAction: 'explain_business_date_format',
      rescueReason: 'explain_business_date_format',
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-us-date',
      locale: 'ru',
      prompt: 'Использовать американский формат дат',
      expectedAction: 'configure_business_date_format',
      rescueReason: 'configure_business_date_format',
      paramsPartial: { dateFormat: 'MM/DD/YYYY' },
      dateFormat: 'MM/DD/YYYY',
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-12-hour',
      locale: 'ru',
      prompt: 'Переключить на 12-часовой формат времени',
      expectedAction: 'configure_business_date_format',
      rescueReason: 'configure_business_date_format',
      paramsPartial: { timeFormat: '12h' },
      timeFormat: '12h',
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-iso-dates',
      locale: 'ru',
      prompt: 'Установить ISO даты для салона',
      expectedAction: 'configure_business_date_format',
      rescueReason: 'configure_business_date_format',
      paramsPartial: { dateFormat: 'YYYY-MM-DD' },
      dateFormat: 'YYYY-MM-DD',
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-european-date',
      locale: 'ru',
      prompt: 'Использовать европейский формат дат',
      expectedAction: 'configure_business_date_format',
      rescueReason: 'configure_business_date_format',
      paramsPartial: { dateFormat: 'DD/MM/YYYY' },
      dateFormat: 'DD/MM/YYYY',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-date-format',
      locale: 'ru',
      prompt: 'Какой формат дат использует наш салон',
      expectedAction: 'explain_business_date_format',
      rescueReason: 'explain_business_date_format',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-date-time-settings',
      locale: 'ru',
      prompt: 'Объясни настройки формата дат и времени',
      expectedAction: 'explain_business_date_format',
      rescueReason: 'explain_business_date_format',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-time-format',
      locale: 'ru',
      prompt: 'Какой у нас формат времени',
      expectedAction: 'explain_business_date_format',
      rescueReason: 'explain_business_date_format',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-date-examples',
      locale: 'ru',
      prompt: 'Покажи примеры дат на сегодня',
      expectedAction: 'explain_business_date_format',
      rescueReason: 'explain_business_date_format',
      needsMultilingual: true,
    },
  ] as const;
