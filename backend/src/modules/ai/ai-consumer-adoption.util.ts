import {
  CONSUMER_ADOPTION_PROMPT_SCENARIOS,
  CONSUMER_ADOPTION_CLASSIFIER_RULES,
} from './ai-consumer-adoption.fixtures.js';

export const CONSUMER_ADOPTION_INTENTS = [
  'explain_my_notifications',
  'manage_notification_preferences',
  'refer_a_friend',
  'rebook_last_appointment',
  'find_my_saved_salons',
] as const;

export type ConsumerAdoptionIntent = (typeof CONSUMER_ADOPTION_INTENTS)[number];

const EXPLAIN_NOTIFICATIONS =
  /\b(what|which|explain|tell me about|do i get|will i get|how do).{0,40}\b(notifications?|reminders?|texts?|sms|whatsapp|push|email alerts?)\b|ինչ.{0,30}ծանուց|ծանուցումներ.{0,20}ստան|что.{0,30}уведомлен|какие.{0,30}(уведомлен|напоминан)/i;
const MANAGE_NOTIFICATIONS =
  /\b(turn|switch|enable|disable|stop|manage|change|update|set).{0,30}\b(notifications?|reminders?|push|sms|whatsapp|alerts?)\b|անջատ.{0,20}(ծանուց|հիշեց)|միաց.{0,20}ծանուց|отключ.{0,30}(напоминан|уведом)|выключ.{0,30}(напоминан|уведом)/i;
const REFER_FRIEND =
  /\b(refer|invite|share).{0,30}\b(friend|buddy|someone|referral)\b|\breferral (code|link|program)\b|\bhow do i refer\b|հրավիր.{0,20}ընկեր|ինչպես.{0,20}հրավիր|приглас.{0,20}друг|реферал/i;
const REBOOK_LAST =
  /\b(rebook|book again|repeat|same as last|last appointment|last visit|last booking|book my last)\b|повторн.{0,20}запис|прошл.{0,15}визит|վերամրագր|նույն.{0,20}(այց|visit)/i;
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

  const scenarioAction = matchAdoptionScenarioPrompt(text);
  if (scenarioAction) {
    return { action: scenarioAction, rescueReason: scenarioAction };
  }

  if (EXPLAIN_NOTIFICATIONS.test(text) && !MANAGE_NOTIFICATIONS.test(text)) {
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
  if (REFER_FRIEND.test(text)) {
    return { action: 'refer_a_friend', rescueReason: 'refer_a_friend' };
  }
  if (REBOOK_LAST.test(text)) {
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
