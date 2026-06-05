export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export type NotificationKind =
  | 'confirmation'
  | 'cancellation'
  | 'reminder_immediate'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'review_request'
  | 'business_booking_cancelled'
  | 'business_booking_rescheduled'
  | `reminder_${number}h`;

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
  /** Email business when a customer cancels or reschedules online (separate from marketing). */
  notifyBusinessOnCustomerBookingChange: boolean;
  /** When true, customers pick reminder lead time at checkout. */
  allowCustomerReminderChoice: boolean;
  /** Hours-before options offered at checkout (e.g. 24, 12, 1). */
  customerReminderOptionsHours: number[];
  /** Default hours-before selection at checkout. */
  defaultCustomerReminderHours: number | null;
  /** Email marketing team when a new customer record is created. */
  emailOnNewCustomerRegistration: boolean;
  /** Recipients for new-customer marketing alerts. */
  marketingTeamEmails: string[];
  /** Managers receive copies of provider booking pushes. */
  pushManagerAlertsEnabled: boolean;
  /** Extra user IDs (besides assigned provider) that receive booking pushes. */
  pushAdditionalRecipientUserIds: string[];
}

export interface CustomerNotificationPreferences {
  emailReminders: boolean;
  smsReminders: boolean;
  whatsappReminders: boolean;
}

export const DEFAULT_BUSINESS_NOTIFICATION_SETTINGS: BusinessNotificationSettings =
  {
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
    notifyBusinessOnCustomerBookingChange: false,
    allowCustomerReminderChoice: false,
    customerReminderOptionsHours: [24, 1],
    defaultCustomerReminderHours: 24,
    emailOnNewCustomerRegistration: false,
    marketingTeamEmails: [],
    pushManagerAlertsEnabled: true,
    pushAdditionalRecipientUserIds: [],
  };

export const DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES: CustomerNotificationPreferences =
  {
    emailReminders: true,
    smsReminders: false,
    whatsappReminders: true,
  };

export { mergeBusinessNotificationSettings } from './merge-business-notification-settings.js';

export function getCustomerNotificationPreferences(
  metadata?: Record<string, unknown>,
): CustomerNotificationPreferences {
  const prefs = metadata?.notifications as
    | Partial<CustomerNotificationPreferences>
    | undefined;
  return {
    ...DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES,
    ...prefs,
  };
}
