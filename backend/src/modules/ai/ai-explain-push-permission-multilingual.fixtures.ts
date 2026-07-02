import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ExplainPushPermissionAspect } from './ai-explain-push-permission.fixtures.js';

export type ExplainPushPermissionMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_push_permission';
  rescueReason: 'push_permission';
  aspect?: ExplainPushPermissionAspect;
};

export const EXPLAIN_PUSH_PERMISSION_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian explain push permission (customer mobile):
  - explain_push_permission: hy «Ինչու չստացա ծանուցում», «Բացել ծանուցումների կարգավորումները»; ru «Почему я не получил уведомление», «Открыть настройки уведомлений». READ OS permission troubleshooting — NOT explain_my_notifications, NOT enable_push_notifications.`;

export const EXPLAIN_PUSH_PERMISSION_MULTILINGUAL_SCENARIOS: readonly ExplainPushPermissionMultilingualScenario[] =
  [
    {
      id: 'why-no-notification-hy-customer',
      locale: 'hy',
      prompt: 'Ինչու չստացա ծանուցում',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'missing_notification',
    },
    {
      id: 'open-settings-hy-customer',
      locale: 'hy',
      prompt: 'Բացել ծանուցումների կարգավորումները',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'open_settings',
    },
    {
      id: 'blocked-phone-hy-customer',
      locale: 'hy',
      prompt: 'Իմ հեռախոսում ծանուցումները արգելափակված են',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'denied_reask',
    },
    {
      id: 'why-no-notification-ru-customer',
      locale: 'ru',
      prompt: 'Почему я не получил уведомление?',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'missing_notification',
    },
    {
      id: 'open-settings-ru-customer',
      locale: 'ru',
      prompt: 'Открыть настройки уведомлений',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'open_settings',
    },
    {
      id: 'android-permission-ru-customer',
      locale: 'ru',
      prompt: 'Почему Android просит разрешение на уведомления?',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'android_permission',
    },
  ];
