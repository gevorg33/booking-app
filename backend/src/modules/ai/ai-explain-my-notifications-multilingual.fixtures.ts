import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ExplainMyNotificationsMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_my_notifications';
  rescueReason: 'explain_my_notifications';
};

export const EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian explain my notifications (customer mobile):
  - explain_my_notifications: hy «Ինչ ծանուցումներ կստանամ ամրագրումից հետո?», «WhatsApp հիշեցումներ կստանամ?», «Ինչպե՞ս եք հիշեցումnum իմ այցի մասին», «SMS հիշեցումներ կստանամ ամրագրումից առաջ?»; ru «Какие уведомления я получу после записи?», «Пришлёте WhatsApp напоминание о записи?», «Как вы напомните мне о визите?», «Получу ли SMS напоминание перед записью?». READ what reminders/channels customer may receive — NOT manage_notification_preferences (toggle channels).`;

export const EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS: readonly ExplainMyNotificationsMultilingualScenario[] =
  [
    {
      id: 'what-notifications-after-booking-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ ծանուցումներ կստանամ ամրագրումից հետո?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'whatsapp-reminders-hy-customer',
      locale: 'hy',
      prompt: 'WhatsApp հիշեցումներ կստանամ?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'how-reminded-hy-customer',
      locale: 'hy',
      prompt: 'Ինչպե՞ս եք հիշեցումnum իմ այցի մասին',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'sms-reminders-hy-customer',
      locale: 'hy',
      prompt: 'SMS հիշեցումներ կստանամ ամրագրումից առաջ?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'what-notifications-after-booking-ru-customer',
      locale: 'ru',
      prompt: 'Какие уведомления я получу после записи?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'whatsapp-reminders-ru-customer',
      locale: 'ru',
      prompt: 'Пришлёте WhatsApp напоминание о записи?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'how-reminded-ru-customer',
      locale: 'ru',
      prompt: 'Как вы напомните мне о визите?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'sms-reminders-ru-customer',
      locale: 'ru',
      prompt: 'Получу ли SMS напоминание перед записью?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
  ];
