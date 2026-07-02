export type CustomerEnablePushNotificationsFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'enable_push_notifications';
  rescueReason: 'customer_enable_push';
};

export const CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_CLASSIFIER_RULES = `- enable_push_notifications: MUTATE — signed-in customer/consumer native app: register FCM push on this phone (OS permission + POST /me/push/register-native). Triggers: "Turn on push reminders", "Notify me on my phone", "Enable push on this device", "Allow booking alerts on my phone". Opens Account → Notifications and requests native push. NOT manage_notification_preferences (email/SMS/WhatsApp/pushReminders channel toggles without native registration), NOT explain_my_notifications (read-only overview), NOT enable_notifications (legacy generic), NOT provider enable_push_notifications (provider mobile app / new booking alerts for staff).`;

export const CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS: readonly CustomerEnablePushNotificationsFixture[] =
  [
    {
      id: 'turn-on-push-reminders-customer',
      prompt: 'Turn on push reminders',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'notify-me-phone-customer',
      prompt: 'Notify me on my phone',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'enable-push-device-customer',
      prompt: 'Enable push notifications on this device',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'allow-push-phone-customer',
      prompt: 'Allow push alerts on my phone',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'turn-on-phone-notifications-customer',
      prompt: 'Turn on phone notifications for my bookings',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'register-push-customer',
      prompt: 'Register for push reminders on my phone',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'activate-push-customer',
      prompt: 'Activate push notifications in the app',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'enable-fcm-customer',
      prompt: 'Enable FCM alerts on my phone',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'subscribe-push-customer',
      prompt: 'Subscribe to push booking reminders',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'allow-notifications-device-customer',
      prompt: 'Allow notifications on this device',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'turn-on-native-push-customer',
      prompt: 'Turn on native push for appointment reminders',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
    {
      id: 'enable-mobile-push-customer',
      prompt: 'Enable mobile push for my account',
      surface: 'customer',
      expectedAction: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    },
  ];

export const CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-manage-preferences',
    prompt: 'Turn on push reminders',
    misclassifiedAction: 'manage_notification_preferences',
    expectedAction: 'enable_push_notifications' as const,
  },
  {
    id: 'misclassified-enable-notifications',
    prompt: 'Notify me on my phone',
    misclassifiedAction: 'enable_notifications',
    expectedAction: 'enable_push_notifications' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'Enable push notifications on this device',
    misclassifiedAction: 'unknown',
    expectedAction: 'enable_push_notifications' as const,
  },
] as const;

export const CUSTOMER_ENABLE_PUSH_BOUNDARY_PROMPTS = [
  {
    id: 'manage-whatsapp',
    prompt: 'Enable WhatsApp notifications',
    surface: 'customer' as const,
  },
  {
    id: 'manage-text-not-email',
    prompt: 'Text me not email',
    surface: 'customer' as const,
  },
  {
    id: 'provider-new-booking',
    prompt: 'Enable push notifications for new bookings',
    surface: 'provider' as const,
  },
] as const;
