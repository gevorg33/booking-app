/** adopt-6.7 — provider mobile FCM push opt-in / setup assistant intents. */
export const PROVIDER_PUSH_SETUP_CLASSIFIER_RULES = `- explain_push_setup: READ — provider mobile app only: explain how native push notifications work (FCM on iOS/Android), permission priming, Profile → Enable push toggle, and what booking alerts providers receive. Triggers: how do push notifications work, set up alerts, explain push permissions. NOT explain_last_push (act on a received notification), NOT configure_provider_push_date_format (time format in push bodies), NOT enable_notifications (customer reminder metadata), NOT dashboard configure_push_recipients.
- enable_push_notifications: MUTATE — provider mobile app: turn on native FCM booking alerts for the signed-in provider on this device — opens Profile push toggle or requests OS permission. Triggers: enable push notifications, turn on alerts, activate booking notifications. NOT explain_push_setup (read-only overview), NOT retry_offline_action, NOT enable_notifications (consumer app).
- explain_push_registration_status: READ — provider mobile app: check whether push notifications are currently registered on this device (live GET …/push/native-status read). Triggers: is push notifications on for my provider account, did my push registration work, check my provider push status, am I registered for push. NOT enable_push_notifications (turns it on), NOT explain_push_setup (general how-to overview, not a live status check).
- Examples:
  - "How do push notifications work in the provider app?" → explain_push_setup
  - "Help me set up booking alerts on my phone" → explain_push_setup
  - "Enable push notifications for new bookings" → enable_push_notifications
  - "Turn on provider app alerts" → enable_push_notifications
  - "Is push notifications on for my provider account?" → explain_push_registration_status
  - "Did my provider app push registration work?" → explain_push_registration_status`;

export const PROVIDER_PUSH_SETUP_PROMPT_SCENARIOS = [
  {
    id: 'explain-push-setup-en',
    prompt: 'How do push notifications work in the provider app?',
    surface: 'provider' as const,
    expectedAction: 'explain_push_setup',
  },
  {
    id: 'explain-push-setup-en-2',
    prompt: 'Help me set up booking alerts on my phone',
    surface: 'provider' as const,
    expectedAction: 'explain_push_setup',
  },
  {
    id: 'explain-push-setup-en-3',
    prompt: 'What do I need to enable FCM alerts on the provider mobile app?',
    surface: 'provider' as const,
    expectedAction: 'explain_push_setup',
  },
  {
    id: 'explain-push-setup-en-4',
    prompt: 'Explain push notification permissions for providers',
    surface: 'provider' as const,
    expectedAction: 'explain_push_setup',
  },
  {
    id: 'explain-push-setup-en-5',
    prompt: 'Where do I turn on booking push alerts in the provider app?',
    surface: 'provider' as const,
    expectedAction: 'explain_push_setup',
  },
  {
    id: 'enable-push-en',
    prompt: 'Enable push notifications for new bookings',
    surface: 'provider' as const,
    expectedAction: 'enable_push_notifications',
  },
  {
    id: 'enable-push-en-2',
    prompt: 'Turn on provider app alerts',
    surface: 'provider' as const,
    expectedAction: 'enable_push_notifications',
  },
  {
    id: 'enable-push-en-3',
    prompt: 'Activate booking notifications on my phone',
    surface: 'provider' as const,
    expectedAction: 'enable_push_notifications',
  },
  {
    id: 'push-status-en',
    prompt: 'Is push notifications on for my provider account?',
    surface: 'provider' as const,
    expectedAction: 'explain_push_registration_status',
  },
  {
    id: 'push-status-en-2',
    prompt: 'Did my provider app push registration work?',
    surface: 'provider' as const,
    expectedAction: 'explain_push_registration_status',
  },
  {
    id: 'push-status-en-3',
    prompt: 'Check my provider push notification status',
    surface: 'provider' as const,
    expectedAction: 'explain_push_registration_status',
  },
  {
    id: 'explain-push-setup-hy',
    prompt: 'Ինչպե՞ս են աշխատում push ծանուցումները provider հավելվածում',
    surface: 'provider' as const,
    expectedAction: 'explain_push_setup',
  },
  {
    id: 'enable-push-hy',
    prompt: 'Միացնել push ծանուցումները նոր ամրագրումների համար',
    surface: 'provider' as const,
    expectedAction: 'enable_push_notifications',
  },
  {
    id: 'explain-push-setup-ru',
    prompt: 'Как работают push-уведомления в приложении провайдера?',
    surface: 'provider' as const,
    expectedAction: 'explain_push_setup',
  },
  {
    id: 'enable-push-ru',
    prompt: 'Включить push-уведомления о новых записях',
    surface: 'provider' as const,
    expectedAction: 'enable_push_notifications',
  },
] as const;
