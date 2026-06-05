import { mergeCustomerReminderChoiceSettings } from './appointment-reminder-settings.util.js';
import { mergeMarketingNotificationSettings } from './marketing-notification-settings.util.js';
import {
  DEFAULT_BUSINESS_NOTIFICATION_SETTINGS,
  type BusinessNotificationSettings,
} from './notification.types.js';

function mergePushRecipientSettings(
  raw?: Record<string, unknown>,
): Pick<
  BusinessNotificationSettings,
  'pushManagerAlertsEnabled' | 'pushAdditionalRecipientUserIds'
> {
  const ids = Array.isArray(raw?.pushAdditionalRecipientUserIds)
    ? raw.pushAdditionalRecipientUserIds.filter(
        (id): id is string => typeof id === 'string' && id.length > 0,
      )
    : [];
  return {
    pushManagerAlertsEnabled: raw?.pushManagerAlertsEnabled !== false,
    pushAdditionalRecipientUserIds: [...new Set(ids)],
  };
}

export function mergeBusinessNotificationSettings(
  raw?: Record<string, unknown>,
): BusinessNotificationSettings {
  const reminderChoice = mergeCustomerReminderChoiceSettings(raw);
  const marketing = mergeMarketingNotificationSettings(raw);
  const pushRecipients = mergePushRecipientSettings(raw);
  return {
    ...DEFAULT_BUSINESS_NOTIFICATION_SETTINGS,
    ...(raw as Partial<BusinessNotificationSettings>),
    ...reminderChoice,
    ...marketing,
    ...pushRecipients,
  };
}

/** @deprecated Use mergeBusinessNotificationSettings — kept for existing tests */
export const mergeBusinessNotificationSettingsWithReminders =
  mergeBusinessNotificationSettings;
