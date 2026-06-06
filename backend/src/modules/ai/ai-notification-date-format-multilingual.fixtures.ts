import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { NotificationMessageKind } from './ai-notification-date-format.util.js';

export type NotificationDateFormatEvalAction =
  | 'explain_notification_date_format'
  | 'preview_notification_datetime'
  | 'notify_patient_result_ready';

export interface NotificationDateFormatEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: NotificationDateFormatEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  messageKind?: NotificationMessageKind;
  needsMultilingual?: boolean;
}

/** Armenian/Russian notification date-format + result-ready phrasing (ai-cmd-fmt-12). */
export const NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian notification date-format + clinic result-ready (fmt-1.7):
  - explain_notification_date_format: hy «ինչպես են հաստատման նամակները ձևավորում ամսաթվերը dashboard-ի համեմատ», «որ ամսաթվի ձևաչափն են օգտագործում WhatsApp հիշեցումները», «նույն ժամի ձևաչափն են օգտագործում notification նամակները»; ru «как письма подтверждения форматируют даты по сравнению с dashboard», «какой формат дат в напоминаниях WhatsApp», «используют ли письма тот же формат времени что dashboard». READ notification channel date/time rules — NOT explain_notification_currency (сумма) and NOT notify_patient_result_ready (mutate).
  - preview_notification_datetime: hy «նախադիտել հաստատման նամակի օրինակը մեր ամսաթվի ձևաչափով», «ցույց տուր հիշեցման WhatsApp հաղորդագրությունը 12-ժամյա ժամով»; ru «предпросмотр примера письма подтверждения с нашим форматом дат», «покажи как будет выглядеть напоминание WhatsApp с 12-часовым временем». READ sample message — NOT preview_business_date_format (alternate settings) and NOT notify_patient_result_ready (mutate).
  - notify_patient_result_ready: hy «տեղեկացնել հիվանդին, որ արդյունքները պատրաստ են», «ուղարկել result-ready նամակ հիվանդին», «ուղարկել WhatsApp, որ լաբորատոր արդյունքները պատրաստ են»; ru «уведомить пациента, что результаты готовы», «отправить письмо о готовности результатов», «отправить WhatsApp что анализы готовы». MUTATE clinic result-ready notification (vert-clinic-1.7) — NOT preview_notification_datetime and NOT explain_notification_date_format.`;

export const MULTILINGUAL_NOTIFICATION_DATE_FORMAT_EVAL_SCENARIOS: NotificationDateFormatEvalScenario[] =
  [
    {
      id: 'hy-explain-confirmation-email-dates',
      locale: 'hy',
      prompt:
        'Ինչպես են հաստատման նամակները ձևավորում ամսաթվերը dashboard-ի համեմատ',
      expectedAction: 'explain_notification_date_format',
      rescueReason: 'explain_notification_date_format',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-whatsapp-reminder-format',
      locale: 'hy',
      prompt: 'Որ ամսաթվի ձևաչափն են օգտագործում WhatsApp հիշեցումները',
      expectedAction: 'explain_notification_date_format',
      rescueReason: 'explain_notification_date_format',
      needsMultilingual: true,
    },
    {
      id: 'hy-preview-confirmation-email',
      locale: 'hy',
      prompt: 'Նախադիտել հաստատման նամակի օրինակը մեր ամսաթվի ձևաչափով',
      expectedAction: 'preview_notification_datetime',
      rescueReason: 'preview_notification_datetime',
      paramsPartial: { messageKind: 'confirmation' },
      messageKind: 'confirmation',
      needsMultilingual: true,
    },
    {
      id: 'hy-preview-reminder-whatsapp',
      locale: 'hy',
      prompt:
        'Ցույց տուր հիշեցման WhatsApp հաղորդագրությունը 12-ժամյա ժամով',
      expectedAction: 'preview_notification_datetime',
      rescueReason: 'preview_notification_datetime',
      paramsPartial: { messageKind: 'reminder' },
      messageKind: 'reminder',
      needsMultilingual: true,
    },
    {
      id: 'hy-notify-results-ready',
      locale: 'hy',
      prompt: 'Տեղեկացնել հիվանդին, որ արդյունքները պատրաստ են',
      expectedAction: 'notify_patient_result_ready',
      rescueReason: 'notify_patient_result_ready',
      needsMultilingual: true,
    },
    {
      id: 'hy-send-result-ready-email',
      locale: 'hy',
      prompt: 'Ուղարկել result-ready նամակ հիվանդին',
      expectedAction: 'notify_patient_result_ready',
      rescueReason: 'notify_patient_result_ready',
      needsMultilingual: true,
    },
    {
      id: 'hy-whatsapp-lab-results',
      locale: 'hy',
      prompt: 'Ուղարկել WhatsApp, որ լաբորատոր արդյունքները պատրաստ են',
      expectedAction: 'notify_patient_result_ready',
      rescueReason: 'notify_patient_result_ready',
      needsMultilingual: true,
    },
    {
      id: 'hy-notify-test-results',
      locale: 'hy',
      prompt: 'Տեղեկացնել, որ թեստի արդյունքները պատրաստ են հիվանդին',
      expectedAction: 'notify_patient_result_ready',
      rescueReason: 'notify_patient_result_ready',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-confirmation-email-dates',
      locale: 'ru',
      prompt:
        'Как письма подтверждения форматируют даты по сравнению с dashboard',
      expectedAction: 'explain_notification_date_format',
      rescueReason: 'explain_notification_date_format',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-whatsapp-reminder-format',
      locale: 'ru',
      prompt: 'Какой формат дат в напоминаниях WhatsApp',
      expectedAction: 'explain_notification_date_format',
      rescueReason: 'explain_notification_date_format',
      needsMultilingual: true,
    },
    {
      id: 'ru-preview-confirmation-email',
      locale: 'ru',
      prompt: 'Предпросмотр примера письма подтверждения с нашим форматом дат',
      expectedAction: 'preview_notification_datetime',
      rescueReason: 'preview_notification_datetime',
      paramsPartial: { messageKind: 'confirmation' },
      messageKind: 'confirmation',
      needsMultilingual: true,
    },
    {
      id: 'ru-preview-reminder-whatsapp',
      locale: 'ru',
      prompt:
        'Покажи как будет выглядеть напоминание WhatsApp с 12-часовым временем',
      expectedAction: 'preview_notification_datetime',
      rescueReason: 'preview_notification_datetime',
      paramsPartial: { messageKind: 'reminder' },
      messageKind: 'reminder',
      needsMultilingual: true,
    },
    {
      id: 'ru-notify-results-ready',
      locale: 'ru',
      prompt: 'Уведомить пациента, что результаты готовы',
      expectedAction: 'notify_patient_result_ready',
      rescueReason: 'notify_patient_result_ready',
      needsMultilingual: true,
    },
    {
      id: 'ru-send-result-ready-email',
      locale: 'ru',
      prompt: 'Отправить письмо о готовности результатов',
      expectedAction: 'notify_patient_result_ready',
      rescueReason: 'notify_patient_result_ready',
      needsMultilingual: true,
    },
    {
      id: 'ru-whatsapp-lab-results',
      locale: 'ru',
      prompt: 'Отправить WhatsApp что анализы готовы',
      expectedAction: 'notify_patient_result_ready',
      rescueReason: 'notify_patient_result_ready',
      needsMultilingual: true,
    },
    {
      id: 'ru-notify-test-results',
      locale: 'ru',
      prompt: 'Сообщить пациенту, что тестовые результаты готовы',
      expectedAction: 'notify_patient_result_ready',
      rescueReason: 'notify_patient_result_ready',
      needsMultilingual: true,
    },
  ];
