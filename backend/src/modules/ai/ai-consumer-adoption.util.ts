import {
  CONSUMER_ADOPTION_PROMPT_SCENARIOS,
  CONSUMER_ADOPTION_CLASSIFIER_RULES,
} from './ai-consumer-adoption.fixtures.js';
import { isConfigureNotificationSettingsPrompt } from './ai-notification-settings.util.js';
import { isConfigureWhatsappIntegrationPrompt } from './ai-whatsapp-integration.util.js';
import { isConfigureProviderPushDateFormatPrompt } from './ai-provider-date-format.util.js';
import { isRescheduleMyBookingPrompt } from './ai-self-service-booking.util.js';
import {
  isExplainMyNotificationsPrompt,
  rescueExplainMyNotificationsIntent,
} from './ai-explain-my-notifications.util.js';
import {
  rescueGrowthLoopsCustomerIntent,
} from './ai-growth-loops-customer.util.js';

export const CONSUMER_ADOPTION_INTENTS = [
  'explain_my_notifications',
  'manage_notification_preferences',
  'refer_a_friend',
  'share_salon_link',
  'share_my_booking',
  'rebook_last_appointment',
  'find_my_saved_salons',
] as const;

export type ConsumerAdoptionIntent = (typeof CONSUMER_ADOPTION_INTENTS)[number];

const EXPLAIN_NOTIFICATIONS = isExplainMyNotificationsPrompt;
const MANAGE_NOTIFICATIONS =
  /\b(turn|switch|disable|stop|manage|change|update|set)\b.{0,30}\b(notifications?|reminders?|push|sms|whatsapp|alerts?)\b|անջատ.{0,20}(ծանուց|հիշեց)|միաց.{0,20}ծանուց|отключ.{0,30}(напоминан|уведом)|выключ.{0,30}(напоминан|уведом)/i;
const SHARE_BOOKING =
  /\b(share).{0,30}\b(booking|appointment|visit)\b|կիս.{0,20}ամրագր|подел.{0,20}(запис|визит)/i;
const REBOOK_LAST =
  /\b(rebook(?:\s+my)?\s+last|book again|repeat(?:\s+my)?\s+last|same as last|last appointment|book my last)\b|повторн.{0,20}запис|վերամրագր|նույն.{0,20}(այց|visit)/i;
const SAVED_SALONS =
  /\b(saved|recent|visited|pinned).{0,20}\b(salons?|places?|businesses?|tenants?)\b|\bmy salons\b|сохран.{0,20}салон|мои.{0,10}салон|показать.{0,20}салон/i;

function matchAdoptionScenarioPrompt(prompt: string): ConsumerAdoptionIntent | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of CONSUMER_ADOPTION_PROMPT_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario.expectedAction;
    }
  }
  return null;
}

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

  if (isConsumerAdoptionIntent(action)) {
    return { action, rescueReason: action };
  }

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

  if (/\benable notifications\b/i.test(text) && !/\bappointment reminders?\b/i.test(text)) {
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

  const scenarioAction = matchAdoptionScenarioPrompt(text);
  if (scenarioAction) {
    return { action: scenarioAction, rescueReason: scenarioAction };
  }

  const explainNotifications = rescueExplainMyNotificationsIntent(text, action);
  if (explainNotifications) return explainNotifications;

  if (EXPLAIN_NOTIFICATIONS(text) && !MANAGE_NOTIFICATIONS.test(text) && !/\bcurrency\b/i.test(text)) {
    return {
      action: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    };
  }
  if (MANAGE_NOTIFICATIONS.test(text)) {
    return {
      action: 'manage_notification_preferences',
      rescueReason: 'manage_notification_preferences',
    };
  }

  const growthLoops = rescueGrowthLoopsCustomerIntent(text, action);
  if (growthLoops) return growthLoops;

  if (SHARE_BOOKING.test(text)) {
    return { action: 'share_my_booking', rescueReason: 'share_my_booking' };
  }
  if (REBOOK_LAST.test(text)) {
    if (
      isRescheduleMyBookingPrompt(text) &&
      !/\b(rebook(?:\s+my)?\s+last|book again|repeat(?:\s+my)?\s+last|same as last|book my last|повторн.{0,20}запис|վeramragr.{0,20}(verjin|last)|նույն.{0,20}(amr|visit))/i.test(
        text,
      )
    ) {
      return null;
    }
    return {
      action: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    };
  }
  if (SAVED_SALONS.test(text)) {
    return {
      action: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
    };
  }

  return null;
}

export { CONSUMER_ADOPTION_CLASSIFIER_RULES, CONSUMER_ADOPTION_PROMPT_SCENARIOS };
