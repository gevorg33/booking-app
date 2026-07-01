import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ManageNotificationPreferencesMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'manage_notification_preferences';
  rescueReason: 'manage_notification_preferences';
  focus?: 'disable' | 'enable' | 'channel' | 'settings';
};

export const MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian manage notification preferences (customer mobile):
  - manage_notification_preferences: hy «Անջատել ամրագրման հիշեցումները», «Գրի ինձ SMS-ով, ոչ թե email-ով», «Միացնել email հիշեցումները»; ru «Отключить напоминания о записи», «Пишите мне в SMS, а не на email», «Отключить SMS напоминания». MUTATE reminder channels — NOT explain_my_notifications (read-only overview), NOT enable_push_notifications (native FCM on device).`;

export const MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS: readonly ManageNotificationPreferencesMultilingualScenario[] =
  [
    {
      id: 'turn-off-reminders-hy-customer',
      locale: 'hy',
      prompt: 'Անջատել ամրագրման հիշեցումները',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'disable',
    },
    {
      id: 'text-not-email-hy-customer',
      locale: 'hy',
      prompt: 'Գրի ինձ SMS-ով, ոչ թե email-ով',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'channel',
    },
    {
      id: 'enable-email-hy-customer',
      locale: 'hy',
      prompt: 'Միացնել email հիշեցումները',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'enable',
    },
    {
      id: 'disable-sms-hy-customer',
      locale: 'hy',
      prompt: 'SMS հիշեցումները անջատել',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'disable',
    },
    {
      id: 'turn-off-reminders-ru-customer',
      locale: 'ru',
      prompt: 'Отключить напоминания о записи',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'disable',
    },
    {
      id: 'text-not-email-ru-customer',
      locale: 'ru',
      prompt: 'Пишите мне в SMS, а не на email',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'channel',
    },
    {
      id: 'enable-email-ru-customer',
      locale: 'ru',
      prompt: 'Включить email напоминания',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'enable',
    },
    {
      id: 'disable-sms-ru-customer',
      locale: 'ru',
      prompt: 'Отключить SMS напоминания',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'disable',
    },
  ];
