import { PROVIDER_PUSH_SETUP_PROMPT_SCENARIOS } from './ai-provider-push-setup.fixtures.js';
import { hasProviderPushTimeContext } from './ai-provider-date-format.util.js';
import {
  isExplainLastPushPrompt,
} from './ai-push-notifications.util.js';

export const PROVIDER_PUSH_SETUP_INTENTS = [
  'explain_push_setup',
  'enable_push_notifications',
] as const;

export const PROVIDER_PUSH_SETUP_MUTATE_INTENTS = [
  'enable_push_notifications',
] as const;

export type ProviderPushSetupIntent =
  (typeof PROVIDER_PUSH_SETUP_INTENTS)[number];

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasProviderPushSetupContext(prompt: string): boolean {
  if (
    /\b(provider\s+(?:mobile\s+)?app|mobile\s+app|provider\s+app)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(հավելված|provider)/i.test(prompt);
  }
  if (containsCyrillicScript(prompt)) {
    return /(приложен|провайдер)/i.test(prompt);
  }
  return /\b(on my phone|this device|my device)\b/i.test(prompt);
}

function hasNativePushTopic(prompt: string): boolean {
  if (
    /\b(push|notification|alert|fcm|firebase|booking\s+alert)\b/i.test(prompt)
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(push|ծանուց|հաղորդ)/i.test(prompt);
  }
  if (containsCyrillicScript(prompt)) {
    return /(push|уведомлен|оповещ)/i.test(prompt);
  }
  return false;
}

export function isExplainPushSetupPrompt(prompt: string): boolean {
  if (isExplainLastPushPrompt(prompt)) return false;
  if (hasProviderPushTimeContext(prompt)) return false;
  if (!hasNativePushTopic(prompt)) return false;

  const explainCue =
    /\b(?:how|what|where|explain|help|set\s+up|setup|need|work|permissions?)\b/i.test(
      prompt,
    ) ||
    (containsArmenianScript(prompt) &&
      /(ինչպես|ինչ|օգն|բացատր|կարգավոր)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(как|что|где|объясн|настро|помог)/i.test(prompt));

  if (!explainCue) return false;

  const mutateCue =
    /\b(?:enable|turn\s+on|activate|switch\s+on|start)\b/i.test(prompt) ||
    (containsArmenianScript(prompt) && /(միաց|ակտիվ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) && /(включ|актив)/i.test(prompt));

  if (mutateCue && !/\b(?:how|what|where|explain|help)\b/i.test(prompt)) {
    return false;
  }

  return hasProviderPushSetupContext(prompt) || /\bprovider\b/i.test(prompt);
}

export function isEnablePushNotificationsPrompt(prompt: string): boolean {
  if (isExplainLastPushPrompt(prompt)) return false;
  if (hasProviderPushTimeContext(prompt)) return false;
  if (
    /\b(?:appointment\s+reminder|sms|whatsapp|email\s+reminder)\b/i.test(
      prompt,
    ) &&
    !/\b(?:provider|booking\s+alert|new\s+booking)\b/i.test(prompt)
  ) {
    return false;
  }
  if (!hasNativePushTopic(prompt)) return false;

  const mutateCue =
    /\b(?:enable|turn\s+on|activate|switch\s+on|allow|subscribe)\b/i.test(
      prompt,
    ) ||
    (containsArmenianScript(prompt) && /(միաց|ակտիվ|թույլ\s+տուր)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(включ|актив|разреши|подключ)/i.test(prompt));

  if (!mutateCue) return false;

  return (
    hasProviderPushSetupContext(prompt) ||
    /\b(?:provider|booking\s+alert|new\s+booking)\b/i.test(prompt)
  );
}

function matchProviderPushSetupScenarioPrompt(
  prompt: string,
): ProviderPushSetupIntent | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of PROVIDER_PUSH_SETUP_PROMPT_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario.expectedAction;
    }
  }
  return null;
}

export function isProviderPushSetupIntent(
  action: string,
): action is ProviderPushSetupIntent {
  return (PROVIDER_PUSH_SETUP_INTENTS as readonly string[]).includes(action);
}

export function rescueProviderPushSetupIntent(
  prompt: string,
  action: string,
): { action: ProviderPushSetupIntent; rescueReason: string } | null {
  if (isProviderPushSetupIntent(action)) {
    return { action, rescueReason: action };
  }

  const scenarioAction = matchProviderPushSetupScenarioPrompt(prompt);
  if (scenarioAction) {
    return { action: scenarioAction, rescueReason: scenarioAction };
  }

  if (isEnablePushNotificationsPrompt(prompt)) {
    return {
      action: 'enable_push_notifications',
      rescueReason: 'enable_push_notifications',
    };
  }
  if (isExplainPushSetupPrompt(prompt)) {
    return {
      action: 'explain_push_setup',
      rescueReason: 'explain_push_setup',
    };
  }

  return null;
}
