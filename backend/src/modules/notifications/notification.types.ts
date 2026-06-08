export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export type NotificationKind =
  | 'confirmation'
  | 'cancellation'
  | 'reminder_immediate'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'review_request'
  | 'result_ready'
  | 'lab_booking_request'
  | 'business_booking_cancelled'
  | 'business_booking_rescheduled'
  | `reminder_${number}h`;

export interface BusinessNotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  sendConfirmationEmail: boolean;
  sendConfirmationWhatsapp: boolean;
  /** Clinic vertical — email when lab results are released to the patient. */
  sendResultReadyEmail: boolean;
  /** Clinic vertical — WhatsApp when lab results are released to the patient. */
  sendResultReadyWhatsapp: boolean;
  /** Clinic vertical — consumer app push when lab results are released (adopt-4.2). */
  sendResultReadyPush: boolean;
  /** Clinic vertical — consumer app push when staff pushes a lab collection booking request. */
  sendLabBookingRequestPush: boolean;
  /** Salon — consumer app push on booking confirmation (adopt-4.2). */
  sendConfirmationPush: boolean;
  /** Salon — consumer app push on booking cancellation (adopt-4.2). */
  sendCancellationPush: boolean;
  /** Salon — consumer app push 24h before appointment (adopt-4.2). */
  sendReminder24hPush: boolean;
  /** Salon — consumer app push 1h before appointment (adopt-4.2). */
  sendReminder1hPush: boolean;
  /** Salon — consumer app push when appointment is rescheduled (adopt-4.2). */
  sendReschedulePush: boolean;
  /** Salon — consumer app push when a digital gift card is delivered (adopt-4.2). */
  sendGiftCardReceivedPush: boolean;
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
  /** Transactional push — confirmations, reminders, clinic results (adopt-4.8). */
  pushReminders: boolean;
  /** Marketing push — rebook nudges, win-back, gift cards (adopt-4.8). */
  pushOffers: boolean;
  /** Salon news and engagement push — reviews, announcements (adopt-4.8). */
  pushNews: boolean;
}

export const DEFAULT_BUSINESS_NOTIFICATION_SETTINGS: BusinessNotificationSettings =
  {
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: true,
    sendConfirmationEmail: true,
    sendConfirmationWhatsapp: true,
    sendResultReadyEmail: true,
    sendResultReadyWhatsapp: true,
    sendResultReadyPush: true,
    sendLabBookingRequestPush: true,
    sendConfirmationPush: true,
    sendCancellationPush: true,
    sendReminder24hPush: true,
    sendReminder1hPush: true,
    sendReschedulePush: true,
    sendGiftCardReceivedPush: true,
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
    pushReminders: true,
    pushOffers: true,
    pushNews: true,
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
