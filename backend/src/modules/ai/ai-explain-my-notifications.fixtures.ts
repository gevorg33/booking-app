export type ExplainMyNotificationsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_my_notifications';
  rescueReason: 'explain_my_notifications';
};

export const CUSTOMER_EXPLAIN_MY_NOTIFICATIONS_CLASSIFIER_RULES = `- explain_my_notifications: READ — signed-in customer/consumer app: explain appointment reminders and booking notifications they may receive based on this salon's notification settings (business.settings.notifications from configure_notification_settings) and the customer's own opt-in preferences. Covers confirmation email/WhatsApp/push, 24h and 1h reminders per enabled channel (email, SMS, WhatsApp, push). Triggers: what/will/do I get notifications/reminders, will you WhatsApp/text/email me, reminder before appointment. NOT configure_notification_settings (dashboard salon mutate), NOT manage_notification_preferences (customer toggle), NOT enable_notifications (legacy toggle), NOT notification_history (dashboard log), NOT explain_notification_currency (currency display).`;

export const EXPLAIN_MY_NOTIFICATIONS_PROMPTS: readonly ExplainMyNotificationsPromptFixture[] =
  [
    {
      id: 'what-notifications-after-booking-customer',
      prompt: 'What notifications will I get after booking?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'will-whatsapp-me-customer',
      prompt: 'Will you WhatsApp me about my appointment?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'text-reminders-customer',
      prompt: 'Do I get text message reminders?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'email-confirmation-customer',
      prompt: 'Will I get an email confirmation?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: '24h-reminder-customer',
      prompt: 'Do you send a 24 hour reminder?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: '1h-reminder-customer',
      prompt: 'Will I get a reminder 1 hour before?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'push-notifications-customer',
      prompt: 'What push notifications does the app send?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'how-reminded-customer',
      prompt: 'How will I be reminded about my visit?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'sms-before-appointment-customer',
      prompt: 'Do you SMS me before my appointment?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'explain-reminders-customer',
      prompt: 'Explain my appointment reminders',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'whatsapp-reminder-customer',
      prompt: 'Will I get WhatsApp reminders?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'notification-types-customer',
      prompt: 'What types of notifications can I receive?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'email-reminders-customer',
      prompt: 'Do I get email reminders for bookings?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'tell-about-notifications-customer',
      prompt: 'Tell me about booking notifications',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
    {
      id: 'confirmation-whatsapp-customer',
      prompt: 'Do you send WhatsApp booking confirmations?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    },
  ];

export const EXPLAIN_MY_NOTIFICATIONS_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-manage-preferences',
    prompt: 'What notifications will I get after booking?',
    misclassifiedAction: 'manage_notification_preferences',
    expectedAction: 'explain_my_notifications' as const,
  },
  {
    id: 'misclassified-enable-notifications',
    prompt: 'Will you WhatsApp me about my appointment?',
    misclassifiedAction: 'enable_notifications',
    expectedAction: 'explain_my_notifications' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'Do I get text message reminders?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_my_notifications' as const,
  },
  {
    id: 'misclassified-manage-explain-reminders',
    prompt: 'Explain my appointment reminders',
    misclassifiedAction: 'manage_notification_preferences',
    expectedAction: 'explain_my_notifications' as const,
  },
] as const;
