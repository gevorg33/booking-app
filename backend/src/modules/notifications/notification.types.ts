export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export type NotificationKind =
  | 'confirmation'
  | 'cancellation'
  | 'reminder_immediate'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'review_request';

export interface BusinessNotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  sendConfirmationEmail: boolean;
  sendConfirmationWhatsapp: boolean;
  reminder24hEmail: boolean;
  reminder1hEmail: boolean;
  reminder24hSms: boolean;
  reminder1hSms: boolean;
  reminder24hWhatsapp: boolean;
  reminder1hWhatsapp: boolean;
  /** Sends reminder template right after booking — for testing; disable in production. */
  reminderImmediateWhatsapp: boolean;
}

export interface CustomerNotificationPreferences {
  emailReminders: boolean;
  smsReminders: boolean;
  whatsappReminders: boolean;
}

export const DEFAULT_BUSINESS_NOTIFICATION_SETTINGS: BusinessNotificationSettings = {
  emailEnabled: true,
  smsEnabled: false,
  whatsappEnabled: true,
  sendConfirmationEmail: true,
  sendConfirmationWhatsapp: true,
  reminder24hEmail: true,
  reminder1hEmail: true,
  reminder24hSms: false,
  reminder1hSms: false,
  reminder24hWhatsapp: true,
  reminder1hWhatsapp: true,
  reminderImmediateWhatsapp: false,
};

export const DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES: CustomerNotificationPreferences = {
  emailReminders: true,
  smsReminders: false,
  whatsappReminders: true,
};

export function mergeBusinessNotificationSettings(
  raw?: Record<string, unknown>,
): BusinessNotificationSettings {
  return {
    ...DEFAULT_BUSINESS_NOTIFICATION_SETTINGS,
    ...(raw as Partial<BusinessNotificationSettings>),
  };
}

export function getCustomerNotificationPreferences(
  metadata?: Record<string, unknown>,
): CustomerNotificationPreferences {
  const prefs = metadata?.notifications as Partial<CustomerNotificationPreferences> | undefined;
  return {
    ...DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES,
    ...prefs,
  };
}
