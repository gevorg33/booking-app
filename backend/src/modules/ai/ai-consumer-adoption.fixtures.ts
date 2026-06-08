/** adopt-6.6 — consumer adoption assistant intents (notifications, referral, rebook, saved salons). */
export const CONSUMER_ADOPTION_CLASSIFIER_RULES = `- explain_my_notifications: READ — signed-in customer/consumer app: explain appointment reminder and booking notifications they may receive (email, SMS, WhatsApp, push when enabled) and where to manage preferences in Account. NOT enable_notifications (toggle), NOT manage_notification_preferences (change settings), NOT dashboard notification_history.
- manage_notification_preferences: MUTATE — signed-in customer: turn appointment reminders on/off or adjust reminder channels. Triggers: enable/disable notifications, turn off reminders, notification settings, push preferences. NOT explain_my_notifications (read-only overview), NOT dashboard configure_push_recipients.
- refer_a_friend: READ — signed-in customer: explain referral program and return personal referral code + share link when enabled. Triggers: refer a friend, invite code, share link, referral bonus. NOT promo_code_help (checkout promo), NOT dashboard trigger_reengagement.
- rebook_last_appointment: READ — signed-in customer: one-tap rebook last completed visit with same service, provider, and time prefilled. Returns navigate to book flow. Triggers: rebook last appointment, book same again, repeat last visit. NOT book_appointment (new service/time), NOT list_my_appointments (list only).
- find_my_saved_salons: READ — consumer app: list recently visited or pinned salons from client context (recentSalons) or explain where saved salons appear (home quick return, tenant switcher). Triggers: my saved salons, recent salons, salons I visited. NOT switch_to_consumer_app, NOT list_providers.

Examples:
  - "What notifications will I get after booking?" → explain_my_notifications
  - "Turn off appointment reminders" → manage_notification_preferences
  - "How do I refer a friend?" → refer_a_friend
  - "Rebook my last haircut" → rebook_last_appointment
  - "Show my saved salons" → find_my_saved_salons`;

export const CONSUMER_ADOPTION_PROMPT_SCENARIOS = [
  {
    id: 'explain-notifications-en',
    prompt: 'What notifications will I get after booking?',
    surface: 'customer' as const,
    expectedAction: 'explain_my_notifications',
  },
  {
    id: 'manage-notifications-en',
    prompt: 'Turn off appointment reminders',
    surface: 'customer' as const,
    expectedAction: 'manage_notification_preferences',
  },
  {
    id: 'refer-friend-en',
    prompt: 'How do I refer a friend?',
    surface: 'customer' as const,
    expectedAction: 'refer_a_friend',
  },
  {
    id: 'rebook-last-en',
    prompt: 'Rebook my last appointment',
    surface: 'customer' as const,
    expectedAction: 'rebook_last_appointment',
  },
  {
    id: 'saved-salons-en',
    prompt: 'Show my saved salons',
    surface: 'customer' as const,
    expectedAction: 'find_my_saved_salons',
  },
  {
    id: 'explain-notifications-hy',
    prompt: 'Ինչ ծանուցումներ կստանամ ամրագրումից հետո?',
    surface: 'customer' as const,
    expectedAction: 'explain_my_notifications',
  },
  {
    id: 'refer-friend-hy',
    prompt: 'Ինչպե՞ս հրավիրել ընկերոջը',
    surface: 'customer' as const,
    expectedAction: 'refer_a_friend',
  },
  {
    id: 'rebook-last-ru',
    prompt: 'Повторно записаться на прошлый визит',
    surface: 'customer' as const,
    expectedAction: 'rebook_last_appointment',
  },
  {
    id: 'saved-salons-ru',
    prompt: 'Показать мои сохранённые салоны',
    surface: 'customer' as const,
    expectedAction: 'find_my_saved_salons',
  },
  {
    id: 'manage-notifications-ru',
    prompt: 'Отключить напоминания о записи',
    surface: 'customer' as const,
    expectedAction: 'manage_notification_preferences',
  },
] as const;
