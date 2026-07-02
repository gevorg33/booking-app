import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type CustomerEnablePushNotificationsMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'enable_push_notifications';
  rescueReason: 'customer_enable_push';
};

export const CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian customer native push enable (consumer mobile):
  - enable_push_notifications: hy «Միացնել push ծանուցումները», «Ծանուցիր ինձ հեռախոսում»; ru «Включить push-уведомления», «Уведомляй меня на телефоне». MUTATE native FCM registration — NOT manage_notification_preferences (channel prefs only).`;

export const CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_MULTILINGUAL_SCENARIOS: readonly CustomerEnablePushNotificationsMultilingualScenario[] =
  [
    {
      id: 'enable-push-hy-customer',
      locale: 'hy',
      prompt: 'Միացնել push ծանուցումները',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'notify-phone-hy-customer',
      locale: 'hy',
      prompt: 'Ծանուցիր ինձ հեռախոսում',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'allow-push-hy-customer',
      locale: 'hy',
      prompt: 'Թույլ տուր push հիշեցումները այս սարքում',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'enable-push-ru-customer',
      locale: 'ru',
      prompt: 'Включить push-уведомления',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'notify-phone-ru-customer',
      locale: 'ru',
      prompt: 'Уведомляй меня на телефоне',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'allow-push-ru-customer',
      locale: 'ru',
      prompt: 'Разреши push-напоминания на этом устройстве',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
  ];
