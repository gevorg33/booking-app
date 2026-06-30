import { isConfigureNotificationSettingsPrompt } from './ai-notification-settings.util.js';
import type {
  BusinessNotificationSettings,
  CustomerNotificationPreferences,
} from '../notifications/notification.types.js';

export const CUSTOMER_EXPLAIN_MY_NOTIFICATIONS_CLASSIFIER_RULES = `- explain_my_notifications: READ — signed-in customer/consumer app: explain appointment reminders and booking notifications they may receive based on this salon's notification settings (business.settings.notifications from configure_notification_settings) and the customer's own opt-in preferences. Covers confirmation email/WhatsApp/push, 24h and 1h reminders per enabled channel (email, SMS, WhatsApp, push). Triggers: what/will/do I get notifications/reminders, will you WhatsApp/text/email me, reminder before appointment. NOT configure_notification_settings (dashboard salon mutate), NOT manage_notification_preferences (customer toggle), NOT enable_notifications (legacy toggle), NOT notification_history (dashboard log), NOT explain_notification_currency (currency display).`;

export type ExplainMyNotificationsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_my_notifications';
};

export const EXPLAIN_MY_NOTIFICATIONS_PROMPTS: readonly ExplainMyNotificationsPromptFixture[] =
  [
    {
      id: 'what-notifications-after-booking-customer',
      prompt: 'What notifications will I get after booking?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: 'will-whatsapp-me-customer',
      prompt: 'Will you WhatsApp me about my appointment?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: 'text-reminders-customer',
      prompt: 'Do I get text message reminders?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: 'email-confirmation-customer',
      prompt: 'Will I get an email confirmation?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: '24h-reminder-customer',
      prompt: 'Do you send a 24 hour reminder?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: '1h-reminder-customer',
      prompt: 'Will I get a reminder 1 hour before?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: 'push-notifications-customer',
      prompt: 'What push notifications does the app send?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: 'how-reminded-customer',
      prompt: 'How will I be reminded about my visit?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: 'sms-before-appointment-customer',
      prompt: 'Do you SMS me before my appointment?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: 'explain-reminders-customer',
      prompt: 'Explain my appointment reminders',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: 'whatsapp-reminder-customer',
      prompt: 'Will I get WhatsApp reminders?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: 'notification-types-customer',
      prompt: 'What types of notifications can I receive?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: 'email-reminders-customer',
      prompt: 'Do I get email reminders for bookings?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: 'tell-about-notifications-customer',
      prompt: 'Tell me about booking notifications',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
    {
      id: 'confirmation-whatsapp-customer',
      prompt: 'Do you send WhatsApp booking confirmations?',
      surface: 'customer',
      expectedAction: 'explain_my_notifications',
    },
  ];

const MANAGE_NOTIFICATIONS =
  /\b(turn|switch|disable|stop|manage|change|update|set)\b.{0,30}\b(notifications?|reminders?|push|sms|whatsapp|alerts?)\b|անջատ.{0,20}(ծանուց|հիշեց)|միաց.{0,20}ծանուց|отключ.{0,30}(напоминан|уведом)|выключ.{0,30}(напоминан|уведом)/i;

export type MyNotificationsExplainCopy = {
  summary: string;
  salonChannels: string[];
  confirmations: string[];
  reminders: string[];
  pushNotifications: string[];
  customerOptIn: string[];
  businessSettings: Pick<
    BusinessNotificationSettings,
    | 'emailEnabled'
    | 'smsEnabled'
    | 'whatsappEnabled'
    | 'sendConfirmationEmail'
    | 'sendConfirmationWhatsapp'
    | 'sendConfirmationPush'
    | 'sendReminder24hPush'
    | 'sendReminder1hPush'
    | 'reminder24hEmail'
    | 'reminder1hEmail'
    | 'reminder24hSms'
    | 'reminder1hSms'
    | 'reminder24hWhatsapp'
    | 'reminder1hWhatsapp'
  >;
};

function channelLabel(channel: 'email' | 'sms' | 'whatsapp'): string {
  if (channel === 'email') return 'email';
  if (channel === 'sms') return 'SMS';
  return 'WhatsApp';
}

export function listSalonEnabledChannels(
  settings: BusinessNotificationSettings,
): string[] {
  const channels: string[] = [];
  if (settings.emailEnabled) channels.push('email');
  if (settings.smsEnabled) channels.push('SMS');
  if (settings.whatsappEnabled) channels.push('WhatsApp');
  return channels;
}

export function listSalonConfirmationChannels(
  settings: BusinessNotificationSettings,
): string[] {
  const confirmations: string[] = [];
  if (settings.sendConfirmationEmail && settings.emailEnabled) {
    confirmations.push('email confirmation');
  }
  if (settings.sendConfirmationWhatsapp && settings.whatsappEnabled) {
    confirmations.push('WhatsApp confirmation');
  }
  if (settings.sendConfirmationPush) {
    confirmations.push('app push on booking confirmation');
  }
  return confirmations;
}

export function listSalonReminderChannels(
  settings: BusinessNotificationSettings,
): string[] {
  const reminders: string[] = [];
  const entries: Array<{
    enabled: boolean;
    channel: 'email' | 'sms' | 'whatsapp';
    window: '24h' | '1h';
  }> = [
    {
      enabled: settings.reminder24hEmail,
      channel: 'email',
      window: '24h',
    },
    {
      enabled: settings.reminder1hEmail,
      channel: 'email',
      window: '1h',
    },
    {
      enabled: settings.reminder24hSms,
      channel: 'sms',
      window: '24h',
    },
    {
      enabled: settings.reminder1hSms,
      channel: 'sms',
      window: '1h',
    },
    {
      enabled: settings.reminder24hWhatsapp,
      channel: 'whatsapp',
      window: '24h',
    },
    {
      enabled: settings.reminder1hWhatsapp,
      channel: 'whatsapp',
      window: '1h',
    },
  ];

  for (const entry of entries) {
    if (!entry.enabled) continue;
    if (entry.channel === 'email' && !settings.emailEnabled) continue;
    if (entry.channel === 'sms' && !settings.smsEnabled) continue;
    if (entry.channel === 'whatsapp' && !settings.whatsappEnabled) continue;
    reminders.push(`${entry.window} ${channelLabel(entry.channel)} reminder`);
  }

  if (settings.sendReminder24hPush) {
    reminders.push('24h app push reminder');
  }
  if (settings.sendReminder1hPush) {
    reminders.push('1h app push reminder');
  }

  return reminders;
}

export function listCustomerOptInChannels(
  prefs: CustomerNotificationPreferences,
): string[] {
  const channels: string[] = [];
  if (prefs.emailReminders) channels.push('email reminders');
  if (prefs.smsReminders) channels.push('SMS reminders');
  if (prefs.whatsappReminders) channels.push('WhatsApp reminders');
  if (prefs.pushReminders) channels.push('transactional push');
  return channels;
}

export function buildMyNotificationsExplainCopy(options: {
  businessSettings: BusinessNotificationSettings;
  customerPrefs: CustomerNotificationPreferences;
}): MyNotificationsExplainCopy {
  const salonChannels = listSalonEnabledChannels(options.businessSettings);
  const confirmations = listSalonConfirmationChannels(options.businessSettings);
  const reminders = listSalonReminderChannels(options.businessSettings);
  const pushNotifications: string[] = [];
  if (options.businessSettings.sendConfirmationPush) {
    pushNotifications.push('booking confirmation');
  }
  if (options.businessSettings.sendReminder24hPush) {
    pushNotifications.push('24h reminder');
  }
  if (options.businessSettings.sendReminder1hPush) {
    pushNotifications.push('1h reminder');
  }
  if (options.businessSettings.sendCancellationPush) {
    pushNotifications.push('cancellation');
  }
  if (options.businessSettings.sendReschedulePush) {
    pushNotifications.push('reschedule');
  }

  const customerOptIn = listCustomerOptInChannels(options.customerPrefs);

  const parts: string[] = [];
  if (salonChannels.length) {
    parts.push(
      `This salon has ${salonChannels.join(', ')} notifications enabled.`,
    );
  } else {
    parts.push('This salon has not enabled outbound notification channels.');
  }

  if (confirmations.length) {
    parts.push(`After booking you may receive: ${confirmations.join(', ')}.`);
  }

  if (reminders.length) {
    parts.push(`Appointment reminders may include: ${reminders.join(', ')}.`);
  } else {
    parts.push('No appointment reminder windows are enabled at this salon.');
  }

  if (pushNotifications.length) {
    parts.push(
      `Consumer app push covers: ${pushNotifications.join(', ')} when enabled on your device.`,
    );
  }

  if (customerOptIn.length) {
    parts.push(
      `Your account is opted in to: ${customerOptIn.join(', ')}. Open Account → Notification preferences to change channels.`,
    );
  } else {
    parts.push(
      'Your reminder channels are currently off — turn them on in Account → Notification preferences to receive messages the salon sends.',
    );
  }

  return {
    summary: parts.join(' '),
    salonChannels,
    confirmations,
    reminders,
    pushNotifications,
    customerOptIn,
    businessSettings: {
      emailEnabled: options.businessSettings.emailEnabled,
      smsEnabled: options.businessSettings.smsEnabled,
      whatsappEnabled: options.businessSettings.whatsappEnabled,
      sendConfirmationEmail: options.businessSettings.sendConfirmationEmail,
      sendConfirmationWhatsapp: options.businessSettings.sendConfirmationWhatsapp,
      sendConfirmationPush: options.businessSettings.sendConfirmationPush,
      sendReminder24hPush: options.businessSettings.sendReminder24hPush,
      sendReminder1hPush: options.businessSettings.sendReminder1hPush,
      reminder24hEmail: options.businessSettings.reminder24hEmail,
      reminder1hEmail: options.businessSettings.reminder1hEmail,
      reminder24hSms: options.businessSettings.reminder24hSms,
      reminder1hSms: options.businessSettings.reminder1hSms,
      reminder24hWhatsapp: options.businessSettings.reminder24hWhatsapp,
      reminder1hWhatsapp: options.businessSettings.reminder1hWhatsapp,
    },
  };
}

export function isExplainMyNotificationsPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isConfigureNotificationSettingsPrompt(text)) return false;
  if (MANAGE_NOTIFICATIONS.test(text)) return false;
  if (/\bcurrency\b/i.test(text)) return false;
  if (
    /\b(push actions?|offline queue|last push|notification history|provider push)\b/i.test(
      text,
    )
  ) {
    return false;
  }

  if (
    /\b(you might also like|product cards?|recommended products?|checkout success|booking success|success screen|post[- ]?booking)\b/i.test(
      text,
    ) &&
    /\b(products?|recommendations?|shop link|external link)\b/i.test(text)
  ) {
    return false;
  }

  if (
    /\bconfirmation\s+screen\b/i.test(text) &&
    /\b(products?|you might also like|recommendations?|shop link)\b/i.test(text)
  ) {
    return false;
  }

  if (
    /\b(what|which|explain|tell me about|do i get|will i get|how do|how will|will you|do you send|do you)\b/i.test(
      text,
    ) &&
    /\b(notifications?|reminders?|reminded|texts?|text\s+message|sms|whatsapp|push|email alerts?|confirmation)\b/i.test(
      text,
    )
  ) {
    return true;
  }

  if (
    /\bwill\s+you\s+(?:whatsapp|text|sms|email)\s+me\b/i.test(text) ||
    /\b(?:24\s*-?\s*(?:h|hour)|1\s*-?\s*(?:h|hour))\b/i.test(text)
  ) {
    return /\b(remind|notification|appointment|booking|visit)\b/i.test(text);
  }

  return (
    /\b(ինչ|ծանուց|հիշեց|что|какие|уведомлен|напоминан)/i.test(text) &&
    !MANAGE_NOTIFICATIONS.test(text)
  );
}

export function rescueExplainMyNotificationsIntent(
  prompt: string,
  action: string,
): {
  action: 'explain_my_notifications';
  rescueReason: string;
} | null {
  if (action === 'explain_my_notifications') return null;
  if (!isExplainMyNotificationsPrompt(prompt)) return null;
  return {
    action: 'explain_my_notifications',
    rescueReason: 'explain_my_notifications',
  };
}
