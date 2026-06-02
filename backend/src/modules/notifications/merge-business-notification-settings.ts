import { mergeCustomerReminderChoiceSettings } from './appointment-reminder-settings.util.js';
import { mergeMarketingNotificationSettings } from './marketing-notification-settings.util.js';
import {
  DEFAULT_BUSINESS_NOTIFICATION_SETTINGS,
  type BusinessNotificationSettings,
} from './notification.types.js';

export function mergeBusinessNotificationSettings(
  raw?: Record<string, unknown>,
): BusinessNotificationSettings {
  const reminderChoice = mergeCustomerReminderChoiceSettings(raw);
  const marketing = mergeMarketingNotificationSettings(raw);
  return {
    ...DEFAULT_BUSINESS_NOTIFICATION_SETTINGS,
    ...(raw as Partial<BusinessNotificationSettings>),
    ...reminderChoice,
    ...marketing,
  };
}

/** @deprecated Use mergeBusinessNotificationSettings — kept for existing tests */
export const mergeBusinessNotificationSettingsWithReminders = mergeBusinessNotificationSettings;
