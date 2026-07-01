export type ExplainPushPermissionAspect =
  | 'missing_notification'
  | 'open_settings'
  | 'provisional'
  | 'android_permission'
  | 'denied_reask'
  | 'how_it_works';

export type ExplainPushPermissionFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_push_permission';
  rescueReason: 'push_permission';
  aspect?: ExplainPushPermissionAspect;
};

export const CUSTOMER_EXPLAIN_PUSH_PERMISSION_CLASSIFIER_RULES = `- explain_push_permission: READ — signed-in customer asks why a push did not arrive or how to fix OS notification permission on this phone (iOS provisional, Android POST_NOTIFICATIONS, denied → Settings). Triggers: why didn't I get a notification, notifications blocked on my phone, open notification settings, provisional push on iPhone. NOT explain_my_notifications (salon channel policy overview), NOT enable_push_notifications (mutate register FCM), NOT manage_notification_preferences (email/SMS/WhatsApp toggles), NOT explain_push_setup (provider app).`;

export const EXPLAIN_PUSH_PERMISSION_PROMPTS: readonly ExplainPushPermissionFixture[] =
  [
    {
      id: 'why-no-notification-customer',
      prompt: "Why didn't I get a notification?",
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'missing_notification',
    },
    {
      id: 'no-push-reminder-customer',
      prompt: "Why didn't my push reminder show up?",
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'missing_notification',
    },
    {
      id: 'open-notification-settings-customer',
      prompt: 'Open notification settings',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'open_settings',
    },
    {
      id: 'notifications-blocked-phone-customer',
      prompt: 'Notifications are blocked on my phone',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'denied_reask',
    },
    {
      id: 'push-permission-denied-customer',
      prompt: 'I denied push permission — how do I turn it back on?',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'denied_reask',
    },
    {
      id: 'ios-provisional-customer',
      prompt: 'What does provisional push mean on iPhone?',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'provisional',
    },
    {
      id: 'quiet-notification-ios-customer',
      prompt: 'Why are my iOS notifications quiet?',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'provisional',
    },
    {
      id: 'android-post-notifications-customer',
      prompt: 'Why is Android asking for notification permission?',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'android_permission',
    },
    {
      id: 'android-13-permission-customer',
      prompt: 'Do I need to allow POST_NOTIFICATIONS on Android?',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'android_permission',
    },
    {
      id: 'fix-push-permissions-customer',
      prompt: 'How do I fix push permissions in the app?',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'how_it_works',
    },
    {
      id: 'system-settings-notifications-customer',
      prompt: 'Take me to system notification settings',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'open_settings',
    },
    {
      id: 'missed-booking-alert-customer',
      prompt: 'I missed my booking alert on my phone',
      surface: 'customer',
      expectedAction: 'explain_push_permission',
      rescueReason: 'push_permission',
      aspect: 'missing_notification',
    },
  ];

export const EXPLAIN_PUSH_PERMISSION_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-explain-notifications',
    prompt: "Why didn't I get a notification?",
    misclassifiedAction: 'explain_my_notifications',
    expectedAction: 'explain_push_permission' as const,
  },
  {
    id: 'misclassified-enable-push',
    prompt: 'Open notification settings',
    misclassifiedAction: 'enable_push_notifications',
    expectedAction: 'explain_push_permission' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'Notifications are blocked on my phone',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_push_permission' as const,
  },
] as const;

export const EXPLAIN_PUSH_PERMISSION_BOUNDARY_PROMPTS = [
  {
    id: 'explain-my-notifications',
    prompt: 'What notifications will I get for my booking?',
    surface: 'customer' as const,
  },
  {
    id: 'enable-push',
    prompt: 'Turn on push reminders',
    surface: 'customer' as const,
  },
  {
    id: 'provider-push-setup',
    prompt: 'How do push notifications work in the provider app?',
    surface: 'provider' as const,
  },
] as const;
