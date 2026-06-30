import type { OnboardSalonNotificationsStepAction } from './ai-onboard-salon-notifications-compound.util.js';

export type OnboardSalonNotificationsCompoundFixture = {
  id: string;
  prompt: string;
  orderedActions: readonly OnboardSalonNotificationsStepAction[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS: OnboardSalonNotificationsCompoundFixture[] = [
  {
    id: 'salon-notifications-e2e-en',
    prompt:
      'Onboard salon notifications end-to-end: configure notification settings with email and WhatsApp reminders, connect WhatsApp integration with platform default, and test push notifications',
    orderedActions: [
      'configure_notification_settings',
      'configure_whatsapp_integration',
      'test_push',
    ] as const,
    expectedParams: {
      emailEnabled: true,
      whatsappEnabled: true,
      usePlatformDefault: true,
    },
    misclassifiedAction: 'configure_notification_settings',
  },
  {
    id: 'notification-onboarding-spa-en',
    prompt:
      'Notification onboarding for our spa — enable email and 24h WhatsApp reminders, use platform default WhatsApp connection, send test push',
    orderedActions: [
      'configure_notification_settings',
      'configure_whatsapp_integration',
      'test_push',
    ] as const,
    expectedParams: {
      emailEnabled: true,
      reminder24hWhatsapp: true,
      usePlatformDefault: true,
    },
    misclassifiedAction: 'configure_whatsapp_integration',
  },
  {
    id: 'onboard-salon-notifications-scratch-en',
    prompt:
      'Set up salon notifications from scratch; turn on email appointment reminders; configure WhatsApp integration; test push',
    orderedActions: [
      'configure_notification_settings',
      'configure_whatsapp_integration',
      'test_push',
    ] as const,
    misclassifiedAction: 'test_push',
  },
  {
    id: 'beauty-salon-notifications-en',
    prompt:
      'Configure our beauty salon notifications end-to-end — notification settings with email on, connect WhatsApp with platform default, and send test push',
    orderedActions: [
      'configure_notification_settings',
      'configure_whatsapp_integration',
      'test_push',
    ] as const,
    expectedParams: {
      emailEnabled: true,
      usePlatformDefault: true,
    },
  },
  {
    id: 'barbershop-notification-setup-en',
    prompt:
      'Barbershop notification setup: enable email and WhatsApp reminders for clients, set up WhatsApp integration with platform default, test push notifications',
    orderedActions: [
      'configure_notification_settings',
      'configure_whatsapp_integration',
      'test_push',
    ] as const,
  },
  {
    id: 'salon-reminders-whatsapp-push-en',
    prompt:
      'Salon client notifications — configure notification settings with 24h email reminders; connect WhatsApp integration; send test push',
    orderedActions: [
      'configure_notification_settings',
      'configure_whatsapp_integration',
      'test_push',
    ] as const,
    expectedParams: {
      reminder24hEmail: true,
    },
  },
  {
    id: 'notification-setup-semicolon-en',
    prompt:
      'Notifications setup end-to-end: enable email and WhatsApp channels; use platform default WhatsApp connection; test push',
    orderedActions: [
      'configure_notification_settings',
      'configure_whatsapp_integration',
      'test_push',
    ] as const,
  },
  {
    id: 'end-to-end-notifications-salon-en',
    prompt:
      'End-to-end salon notifications — configure notification settings with email reminders, connect WhatsApp integration with platform default, then test push',
    orderedActions: [
      'configure_notification_settings',
      'configure_whatsapp_integration',
      'test_push',
    ] as const,
  },
  {
    id: 'salon-client-notifications-complete-en',
    prompt:
      'Complete salon client notification onboarding: turn on email and WhatsApp appointment reminders, configure WhatsApp integration, and test push',
    orderedActions: [
      'configure_notification_settings',
      'configure_whatsapp_integration',
      'test_push',
    ] as const,
  },
  {
    id: 'onboard-notifications-then-test-push-en',
    prompt:
      'Onboard salon notifications — enable email reminders and WhatsApp channel, connect WhatsApp with platform default, and then send test push',
    orderedActions: [
      'configure_notification_settings',
      'configure_whatsapp_integration',
      'test_push',
    ] as const,
  },
  {
    id: 'configure-notifications-whatsapp-test-en',
    prompt:
      'Configure notification settings for the salon with email on; set up WhatsApp integration using platform default; test push notifications',
    orderedActions: [
      'configure_notification_settings',
      'configure_whatsapp_integration',
      'test_push',
    ] as const,
    expectedParams: {
      emailEnabled: true,
      usePlatformDefault: true,
    },
  },
];

export const ONBOARD_SALON_NOTIFICATIONS_EN_SCENARIO_IDS =
  ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS.map((row) => row.id);

export const ONBOARD_SALON_NOTIFICATIONS_RESCUE_SCENARIOS =
  ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS.filter(
    (scenario) =>
      'misclassifiedAction' in scenario && !!scenario.misclassifiedAction,
  ) as Array<
    OnboardSalonNotificationsCompoundFixture & { misclassifiedAction: string }
  >;
