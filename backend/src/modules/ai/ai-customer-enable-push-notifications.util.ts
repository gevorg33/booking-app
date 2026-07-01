import {
  CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS,
  type CustomerEnablePushNotificationsFixture,
} from './ai-customer-enable-push-notifications.fixtures.js';
import { CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_MULTILINGUAL_SCENARIOS } from './ai-customer-enable-push-notifications-multilingual.fixtures.js';

export const CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_INTENTS = [
  'enable_push_notifications',
] as const;

export type CustomerEnablePushNotificationsIntent =
  (typeof CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_INTENTS)[number];

export { CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_CLASSIFIER_RULES } from './ai-customer-enable-push-notifications.fixtures.js';

const PROVIDER_PUSH_CUE =
  /\b(provider\s+(?:mobile\s+)?app|provider\s+app|new\s+booking\s+push|booking\s+alert\s+for\s+providers?|(?:enable|turn\s+on).{0,30}push.{0,30}new\s+bookings?)\b/i;

const CHANNEL_PREF_CUE =
  /\b(text\s+me|sms|whatsapp|email)\b.{0,30}\b(not|only|prefer|instead)\b|\bonly\s+(email|sms|whatsapp)\b|\b(enable|turn\s+on|disable|turn\s+off).{0,20}\b(whatsapp|sms|email)\b/i;

const NATIVE_DEVICE_CUE =
  /\b(on my phone|my phone|this device|my device|native\s+push|mobile\s+push|fcm|firebase)\b/i;

const NATIVE_PUSH_MUTATE_CUE =
  /\b(turn\s+on|enable|activate|allow|register|subscribe|notify\s+me)\b/i;

const NATIVE_PUSH_TOPIC = /\b(push|notification|alert|reminder)\b/i;

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function matchCustomerEnablePushScenario(
  prompt: string,
): CustomerEnablePushNotificationsFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isCustomerEnablePushNotificationsPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchCustomerEnablePushScenario(text)) return true;
  if (PROVIDER_PUSH_CUE.test(text)) return false;
  if (/\bprovider\b/i.test(text) && NATIVE_PUSH_TOPIC.test(text)) return false;

  if (
    (containsArmenianScript(text) &&
      /(միաց|ակտիվ|թույլ\s+տուր)/i.test(text) &&
      /(push|ծանուց|հիշեց)/i.test(text) &&
      !/(sms|email|whatsapp)/i.test(text)) ||
    (containsCyrillicScript(text) &&
      /(включ|актив|разреши|уведомляй)/i.test(text) &&
      /(push|уведом|телефон|устройств)/i.test(text) &&
      !/(sms|email|whatsapp)/i.test(text))
  ) {
    return true;
  }

  if (CHANNEL_PREF_CUE.test(text) && !NATIVE_DEVICE_CUE.test(text)) {
    return false;
  }

  if (NATIVE_DEVICE_CUE.test(text) && NATIVE_PUSH_MUTATE_CUE.test(text)) {
    return true;
  }

  if (/\bnotify\s+me\b/i.test(text) && /\b(phone|device)\b/i.test(text)) {
    return true;
  }

  if (NATIVE_PUSH_MUTATE_CUE.test(text) && NATIVE_PUSH_TOPIC.test(text)) {
    if (/\b(turn\s+off|disable|stop)\b/i.test(text)) return false;
    if (/\b(email|sms|whatsapp)\b/i.test(text) && !/\bpush\b/i.test(text)) {
      return false;
    }
    return true;
  }

  return false;
}

export function isCustomerEnablePushNotificationsIntent(
  action: string,
): action is CustomerEnablePushNotificationsIntent {
  return (
    CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_INTENTS as readonly string[]
  ).includes(action);
}

export function rescueCustomerEnablePushNotificationsIntent(
  prompt: string,
  action: string,
): {
  action: CustomerEnablePushNotificationsIntent;
  rescueReason: string;
} | null {
  if (isCustomerEnablePushNotificationsIntent(action)) return null;
  if (!isCustomerEnablePushNotificationsPrompt(prompt)) return null;
  return {
    action: 'enable_push_notifications',
    rescueReason: 'customer_enable_push',
  };
}
