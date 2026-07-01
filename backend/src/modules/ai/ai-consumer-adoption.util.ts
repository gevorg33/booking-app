import { CONSUMER_ADOPTION_CLASSIFIER_RULES } from './ai-consumer-adoption.fixtures.js';
import { rescueFindMySavedSalonsIntent } from './ai-find-my-saved-salons.util.js';
import { rescueSwitchSalonTenantIntent } from './ai-switch-salon-tenant.util.js';
import { isConfigureNotificationSettingsPrompt } from './ai-notification-settings.util.js';
import { isConfigureWhatsappIntegrationPrompt } from './ai-whatsapp-integration.util.js';
import { isConfigureProviderPushDateFormatPrompt } from './ai-provider-date-format.util.js';
import { rescueRebookLastAppointmentIntent } from './ai-rebook-last-appointment.util.js';
import { rescueRebookAndPayCompoundIntent } from './ai-rebook-and-pay-compound.util.js';
import { rescueSubscriptionFirstVisitCompoundIntent } from './ai-subscription-first-visit-compound.util.js';
import { rescueResultsThenRebookCompoundIntent } from './ai-results-then-rebook-compound.util.js';
import {
  isExplainMyNotificationsPrompt,
  rescueExplainMyNotificationsIntent,
} from './ai-explain-my-notifications.util.js';
import {
  isManageNotificationPreferencesPrompt,
  rescueManageNotificationPreferencesIntent,
} from './ai-manage-notification-preferences.util.js';
import { rescueShareMyBookingIntent } from './ai-share-my-booking.util.js';
import { rescueExplainShareRewardIntent } from './ai-explain-share-reward.util.js';
import { rescueGrowthLoopsCustomerIntent } from './ai-growth-loops-customer.util.js';
import {
  rescueCustomerEnablePushNotificationsIntent,
  isCustomerEnablePushNotificationsPrompt,
} from './ai-customer-enable-push-notifications.util.js';
import {
  rescueExplainPushPermissionIntent,
  isExplainPushPermissionPrompt,
} from './ai-explain-push-permission.util.js';
import {
  rescueExplainOfflineModeIntent,
  isExplainOfflineModePrompt,
} from './ai-explain-offline-mode.util.js';
import {
  rescueExplainAppUpdateRequiredIntent,
  isExplainAppUpdateRequiredPrompt,
} from './ai-explain-app-update-required.util.js';
import {
  rescueExplainAnalyticsConsentIntent,
  isExplainAnalyticsConsentPrompt,
} from './ai-explain-analytics-consent.util.js';
import {
  rescueExplainHomeScreenWidgetIntent,
  isExplainHomeScreenWidgetPrompt,
} from './ai-explain-home-screen-widget.util.js';
import {
  rescueExplainPatientAlertIntent,
  isExplainPatientAlertPrompt,
} from './ai-explain-patient-alert.util.js';

export const CONSUMER_ADOPTION_INTENTS = [
  'explain_my_notifications',
  'manage_notification_preferences',
  'enable_push_notifications',
  'explain_push_permission',
  'explain_offline_mode',
  'explain_app_update_required',
  'explain_analytics_consent',
  'explain_home_screen_widget',
  'explain_patient_alert',
  'explain_share_reward',
  'refer_a_friend',
  'share_salon_link',
  'share_my_booking',
  'rebook_last_appointment',
  'find_my_saved_salons',
  'switch_salon_tenant',
  'compound_intent',
] as const;

export type ConsumerAdoptionIntent = (typeof CONSUMER_ADOPTION_INTENTS)[number];

const EXPLAIN_NOTIFICATIONS = isExplainMyNotificationsPrompt;

export function isConsumerAdoptionIntent(
  action: string,
): action is ConsumerAdoptionIntent {
  return (CONSUMER_ADOPTION_INTENTS as readonly string[]).includes(action);
}

export function rescueConsumerAdoptionIntent(
  prompt: string,
  action: string,
): { action: ConsumerAdoptionIntent; rescueReason: string } | null {
  const text = prompt.trim();
  if (!text) return null;

  if (isConfigureProviderPushDateFormatPrompt(text)) {
    return null;
  }

  if (isConfigureNotificationSettingsPrompt(text)) {
    return null;
  }

  if (isConfigureWhatsappIntegrationPrompt(text)) {
    return null;
  }

  if (
    /\b(push actions?|offline queue|last push|new booking push|push recipients|notification history)\b/i.test(
      text,
    )
  ) {
    return null;
  }

  if (
    /\benable notifications\b/i.test(text) &&
    !/\bappointment reminders?\b/i.test(text)
  ) {
    return null;
  }

  if (/\bexplain\b[\s\S]{0,30}\blast push\b/i.test(text)) {
    return null;
  }

  if (
    /\b(configure|change|set|enable|switch)\b[\s\S]{0,40}\b(push|provider app)\b[\s\S]{0,40}\b(date|time)\b[\s\S]{0,20}\b(format|display|12|24)\b/i.test(
      text,
    ) ||
    /\b12[\s-]?hour\b[\s\S]{0,30}\bpush\b/i.test(text)
  ) {
    return null;
  }

  if (
    /\bexplain\b[\s\S]{0,40}\b(notification|whatsapp|sms)\b[\s\S]{0,20}\bcurrency\b/i.test(
      text,
    )
  ) {
    return null;
  }

  const explainNotifications = rescueExplainMyNotificationsIntent(text, action);
  if (explainNotifications) return explainNotifications;

  const enablePush = rescueCustomerEnablePushNotificationsIntent(text, action);
  if (enablePush) return enablePush;

  const explainPushPermission = rescueExplainPushPermissionIntent(text, action);
  if (explainPushPermission) return explainPushPermission;

  const explainOfflineMode = rescueExplainOfflineModeIntent(text, action);
  if (explainOfflineMode) return explainOfflineMode;

  const explainAppUpdate = rescueExplainAppUpdateRequiredIntent(text, action);
  if (explainAppUpdate) return explainAppUpdate;

  const explainAnalyticsConsent = rescueExplainAnalyticsConsentIntent(
    text,
    action,
  );
  if (explainAnalyticsConsent) return explainAnalyticsConsent;

  const explainPatientAlert = rescueExplainPatientAlertIntent(text, action);
  if (explainPatientAlert) return explainPatientAlert;

  const explainHomeScreenWidget = rescueExplainHomeScreenWidgetIntent(
    text,
    action,
  );
  if (explainHomeScreenWidget) return explainHomeScreenWidget;

  const managePreferences = rescueManageNotificationPreferencesIntent(
    text,
    action,
  );
  if (managePreferences) return managePreferences;

  const explainShareReward = rescueExplainShareRewardIntent(text, action);
  if (explainShareReward) return explainShareReward;

  const switchSalonSteal = rescueSwitchSalonTenantIntent(text, action);
  if (switchSalonSteal) return switchSalonSteal;

  if (isConsumerAdoptionIntent(action)) {
    return { action, rescueReason: action };
  }

  if (
    EXPLAIN_NOTIFICATIONS(text) &&
    !isManageNotificationPreferencesPrompt(text) &&
    !/\bcurrency\b/i.test(text)
  ) {
    return {
      action: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    };
  }
  if (isCustomerEnablePushNotificationsPrompt(text)) {
    return {
      action: 'enable_push_notifications',
      rescueReason: 'customer_enable_push',
    };
  }
  if (isExplainPushPermissionPrompt(text)) {
    return {
      action: 'explain_push_permission',
      rescueReason: 'push_permission',
    };
  }
  if (isExplainOfflineModePrompt(text)) {
    return {
      action: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
    };
  }
  if (isExplainAppUpdateRequiredPrompt(text)) {
    return {
      action: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
    };
  }
  if (isExplainAnalyticsConsentPrompt(text)) {
    return {
      action: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
    };
  }
  if (isExplainPatientAlertPrompt(text)) {
    return {
      action: 'explain_patient_alert',
      rescueReason: 'patient_alert',
    };
  }
  if (isExplainHomeScreenWidgetPrompt(text)) {
    return {
      action: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
    };
  }
  if (isManageNotificationPreferencesPrompt(text)) {
    return {
      action: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
    };
  }

  const growthLoops = rescueGrowthLoopsCustomerIntent(text, action);
  if (growthLoops) return growthLoops;

  const shareBooking = rescueShareMyBookingIntent(text, action);
  if (shareBooking) return shareBooking;

  const subscriptionFirstVisit = rescueSubscriptionFirstVisitCompoundIntent(
    text,
    action,
  );
  if (subscriptionFirstVisit) {
    return {
      action: subscriptionFirstVisit.action,
      rescueReason: subscriptionFirstVisit.rescueReason,
    };
  }

  const resultsThenRebook = rescueResultsThenRebookCompoundIntent(text, action);
  if (resultsThenRebook) {
    return {
      action: resultsThenRebook.action,
      rescueReason: resultsThenRebook.rescueReason,
    };
  }

  const rebookAndPay = rescueRebookAndPayCompoundIntent(text, action);
  if (rebookAndPay) {
    return {
      action: rebookAndPay.action,
      rescueReason: rebookAndPay.rescueReason,
    };
  }

  const rebookLast = rescueRebookLastAppointmentIntent(text, action);
  if (rebookLast) return rebookLast;

  const switchSalon = rescueSwitchSalonTenantIntent(text, action);
  if (switchSalon) return switchSalon;

  const savedSalons = rescueFindMySavedSalonsIntent(text, action);
  if (savedSalons) return savedSalons;

  return null;
}

export { CONSUMER_ADOPTION_CLASSIFIER_RULES };
