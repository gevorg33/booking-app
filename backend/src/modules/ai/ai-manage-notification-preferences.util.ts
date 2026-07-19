import { isConfigureNotificationSettingsPrompt } from './ai-notification-settings.util.js';
import {
  MANAGE_NOTIFICATION_PREFERENCES_PROMPTS,
  type ManageNotificationPreferencesPromptFixture,
} from './ai-manage-notification-preferences.fixtures.js';
import { MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS } from './ai-manage-notification-preferences-multilingual.fixtures.js';
import { isCustomerEnablePushNotificationsPrompt } from './ai-customer-enable-push-notifications.util.js';
import { isPushNotificationsDomainPrompt } from './ai-push-notifications.util.js';
import { isOpenBillingSettingsPrompt } from './ai-billing-loyalty-dashboard.util.js';
import { isOpenComplianceDashboardPrompt } from './ai-business-compliance.util.js';
import {
  isCreatePackagePrompt,
  isUpdatePackagePrompt,
  isCreateSubscriptionPlanPrompt,
  isUpdateSubscriptionPlanPrompt,
} from './ai-catalog.util.js';
import { isConfigureLoyaltySettingsPrompt } from './ai-configure-loyalty-settings.util.js';
import { isConfigureOpenaiIntegrationPrompt } from './ai-openai-integration.util.js';

export const MANAGE_NOTIFICATION_PREFERENCES_INTENTS = [
  'manage_notification_preferences',
] as const;

export type ManageNotificationPreferencesIntent =
  (typeof MANAGE_NOTIFICATION_PREFERENCES_INTENTS)[number];

export type ManageNotificationPreferencesFocus =
  | 'disable'
  | 'enable'
  | 'channel'
  | 'settings';

const MANAGE_MUTATE_CUE =
  /\b(turn|switch|disable|stop|manage|change|update|set|enable|prefer|only|open)\b.{0,40}\b(notifications?|reminders?|push|sms|whatsapp|alerts?|email|settings)\b|\b(text|sms|whatsapp|email|push)\b.{0,30}\b(me|not|only)\b|\bnotification\s+settings\b|\breminder\s+preferences\b|\bdon'?t\s+want\b.{0,25}\b(text|sms|email|whatsapp|remind)/i;

const MANAGE_HY_RU_CUE =
  /անջատ.{0,25}(ծանուց|հիշեց|sms|email)|միաց.{0,25}(email|sms|whatsapp)|отключ.{0,30}(напоминан|уведом|sms)|выключ.{0,30}(напоминан|уведом|sms)|включ.{0,30}(email|sms|whatsapp|напоминан)(?!.*push)|(?:գր|sms).{0,25}(email|ինձ)|пишите.{0,25}(sms|email)|только.{0,25}(email|sms|whatsapp)/iu;

const EXPLAIN_QUESTION_CUE =
  /\b(what|which|explain|tell\s+me\s+about|do\s+i\s+get|will\s+i\s+get|how\s+do|how\s+will|will\s+you|do\s+you\s+send)\b/i;

const CONSUMER_OS_PUSH_PERMISSION_CUE =
  /\b(why (?:didn'?t|did not|don'?t|do not) (?:i )?(?:get|receive)|didn'?t (?:get|receive)|missed (?:my )?(?:push|alert|notification|booking alert)|blocked on my phone|notifications?\s+(?:are\s+)?blocked|denied push|turn it back on|provisional push|quiet notifications?|post_notifications|android (?:13|asks|permission)|fix push permissions?)\b/i;

const CONSUMER_OS_OPEN_PUSH_SETTINGS_CUE =
  /\b(open|take me to|go to|show)\s+(?!my\s)(?:notification settings|system settings|phone settings|app settings)\b/i;

function matchManageNotificationPreferencesScenario(
  prompt: string,
): ManageNotificationPreferencesPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of MANAGE_NOTIFICATION_PREFERENCES_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function inferManageNotificationPreferencesFocus(
  prompt: string,
): ManageNotificationPreferencesFocus {
  const scenario = matchManageNotificationPreferencesScenario(prompt);
  if (scenario?.focus) return scenario.focus;
  if (/\b(turn\s+off|disable|stop|don'?t\s+want|not)\b/i.test(prompt)) {
    return 'disable';
  }
  if (/\b(enable|turn\s+on|turn\s+on)\b/i.test(prompt)) return 'enable';
  if (
    /\b(only|prefer|not)\b.{0,20}\b(email|sms|whatsapp|text|push)\b/i.test(
      prompt,
    )
  ) {
    return 'channel';
  }
  return 'settings';
}

export function isManageNotificationPreferencesPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isOpenBillingSettingsPrompt(text)) return false;
  if (isOpenComplianceDashboardPrompt(text)) return false;
  if (isConfigureLoyaltySettingsPrompt(text)) return false;
  if (isConfigureOpenaiIntegrationPrompt(text)) return false;
  if (
    isCreatePackagePrompt(text) ||
    isUpdatePackagePrompt(text) ||
    isCreateSubscriptionPlanPrompt(text) ||
    isUpdateSubscriptionPlanPrompt(text)
  ) {
    return false;
  }
  if (CONSUMER_OS_PUSH_PERMISSION_CUE.test(text)) return false;
  if (CONSUMER_OS_OPEN_PUSH_SETTINGS_CUE.test(text)) return false;
  if (isPushNotificationsDomainPrompt(text)) return false;
  if (isCustomerEnablePushNotificationsPrompt(text)) return false;
  if (matchManageNotificationPreferencesScenario(text)) return true;
  if (isConfigureNotificationSettingsPrompt(text)) return false;
  if (
    /\bexplain\b/i.test(text) &&
    /\b(notifications?|reminders?)\b/i.test(text) &&
    !/\b(turn|disable|stop|manage|change|update|set|enable|open)\b/i.test(text)
  ) {
    return false;
  }
  if (/\bcurrency\b/i.test(text)) return false;
  if (
    /\b(push actions?|offline queue|last push|notification history|provider push)\b/i.test(
      text,
    )
  ) {
    return false;
  }
  if (
    /\benable notifications\b/i.test(text) &&
    !/\b(appointment|reminder|booking)\b/i.test(text)
  ) {
    return false;
  }

  if (MANAGE_HY_RU_CUE.test(text)) return true;

  if (MANAGE_MUTATE_CUE.test(text)) {
    if (EXPLAIN_QUESTION_CUE.test(text)) return false;
    return true;
  }

  return false;
}

export function isManageNotificationPreferencesIntent(
  action: string,
): action is ManageNotificationPreferencesIntent {
  return (
    MANAGE_NOTIFICATION_PREFERENCES_INTENTS as readonly string[]
  ).includes(action);
}

export function parseManageNotificationPreferencesFromPrompt(
  prompt: string,
): { focus: ManageNotificationPreferencesFocus } | null {
  if (!isManageNotificationPreferencesPrompt(prompt)) return null;
  return { focus: inferManageNotificationPreferencesFocus(prompt) };
}

export function rescueManageNotificationPreferencesIntent(
  prompt: string,
  action: string,
): {
  action: 'manage_notification_preferences';
  rescueReason: string;
} | null {
  if (action === 'manage_notification_preferences') return null;
  if (!isManageNotificationPreferencesPrompt(prompt)) return null;
  return {
    action: 'manage_notification_preferences',
    rescueReason: 'manage_notification_preferences',
  };
}
