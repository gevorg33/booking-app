export type ManageNotificationPreferencesPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'manage_notification_preferences';
  rescueReason: 'manage_notification_preferences';
  focus?: 'disable' | 'enable' | 'channel' | 'settings';
};

export const CUSTOMER_MANAGE_NOTIFICATION_PREFERENCES_CLASSIFIER_RULES = `- manage_notification_preferences: MUTATE — signed-in customer/consumer app: turn appointment reminders on/off or adjust reminder channels (email, SMS, WhatsApp, pushReminders/pushOffers/pushNews toggles). Triggers: "Turn off appointment reminders", "Text me not email", "Disable SMS reminders", "Enable WhatsApp notifications", "Manage my notification settings". Requires session customerId. NOT explain_my_notifications (read-only what will I get), NOT enable_push_notifications (native FCM registration on device), NOT configure_notification_settings (dashboard salon mutate), NOT enable_notifications (legacy generic toggle without reminder framing), NOT notification_history (dashboard log).`;

export const MANAGE_NOTIFICATION_PREFERENCES_PROMPTS: readonly ManageNotificationPreferencesPromptFixture[] =
  [
    {
      id: 'turn-off-reminders-customer',
      prompt: 'Turn off appointment reminders',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'disable',
    },
    {
      id: 'text-not-email-customer',
      prompt: 'Text me not email',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'channel',
    },
    {
      id: 'disable-sms-reminders-customer',
      prompt: 'Disable SMS reminders',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'disable',
    },
    {
      id: 'enable-whatsapp-notifications-customer',
      prompt: 'Enable WhatsApp notifications',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'enable',
    },
    {
      id: 'stop-email-reminders-customer',
      prompt: 'Stop sending me email reminders',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'disable',
    },
    {
      id: 'notification-settings-customer',
      prompt: 'Open my notification settings',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'settings',
    },
    {
      id: 'manage-reminder-preferences-customer',
      prompt: 'Manage my reminder preferences',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'settings',
    },
    {
      id: 'no-text-messages-customer',
      prompt: "I don't want text message reminders",
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'disable',
    },
    {
      id: 'email-only-not-whatsapp-customer',
      prompt: 'Only email me, not WhatsApp',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'channel',
    },
    {
      id: 'turn-off-all-alerts-customer',
      prompt: 'Turn off all appointment alerts',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'disable',
    },
    {
      id: 'enable-email-sms-reminders-customer',
      prompt: 'Enable email and SMS reminders',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'enable',
    },
    {
      id: 'turn-on-email-reminders-customer',
      prompt: 'Turn on email reminders',
      surface: 'customer',
      expectedAction: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
      focus: 'enable',
    },
  ];

export const MANAGE_NOTIFICATION_PREFERENCES_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-explain-notifications',
    prompt: 'Text me not email',
    misclassifiedAction: 'explain_my_notifications',
    expectedAction: 'manage_notification_preferences' as const,
  },
  {
    id: 'misclassified-enable-notifications',
    prompt: 'Turn off appointment reminders',
    misclassifiedAction: 'enable_notifications',
    expectedAction: 'manage_notification_preferences' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'Disable SMS reminders',
    misclassifiedAction: 'unknown',
    expectedAction: 'manage_notification_preferences' as const,
  },
  {
    id: 'misclassified-explain-channel',
    prompt: 'Only email me, not WhatsApp',
    misclassifiedAction: 'explain_my_notifications',
    expectedAction: 'manage_notification_preferences' as const,
  },
] as const;
