import { isConfigureHipaaSessionTimeoutPrompt } from './ai-business-compliance.util.js';

export const PROVIDER_SESSION_TIMEOUT_INTENTS = [
  'explain_provider_session_timeout',
] as const;

export type ProviderSessionTimeoutIntent =
  (typeof PROVIDER_SESSION_TIMEOUT_INTENTS)[number];

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function hasProviderAppContext(prompt: string): boolean {
  if (/\bprovider\s+(?:mobile\s+)?app\b/i.test(prompt)) {
    return true;
  }
  if (/\b(?:mobile\s+app|provider\s+app)\b/i.test(prompt)) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(հավելված|բժշկական\s+հավելված)/i.test(prompt);
  }
  if (containsCyrillicScript(prompt)) {
    return /(приложен|мобильн)/i.test(prompt);
  }
  return false;
}

export function isExplainProviderSessionTimeoutPrompt(prompt: string): boolean {
  if (isConfigureHipaaSessionTimeoutPrompt(prompt)) return false;

  const logoutCue =
    /\b(?:log(?:ged|s)?\s+(?:me\s+)?out|session\s+timeout|auto\s+logout|inactivity)\b/i.test(
      prompt,
    ) ||
    (containsArmenianScript(prompt) &&
      /(ելք|գրանցում|նիստ|անգործունակություն)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(выйд|выход|сесси|бездейств)/i.test(prompt));

  if (!logoutCue) return false;

  if (/\bwhen\s+will\s+(?:the\s+)?provider\b/i.test(prompt)) {
    return true;
  }

  if (hasProviderAppContext(prompt)) {
    if (
      /\b(?:when|what|how\s+long)\b/i.test(prompt) ||
      (containsArmenianScript(prompt) && /(երբ|ինչ|որքան)/i.test(prompt)) ||
      (containsCyrillicScript(prompt) &&
        /(когда|что|как\s+долго)/i.test(prompt))
    ) {
      return true;
    }
  }

  return false;
}

export function rescueProviderSessionTimeoutIntent(
  prompt: string,
  action: string,
): { action: ProviderSessionTimeoutIntent; rescueReason: string } | null {
  if (
    (PROVIDER_SESSION_TIMEOUT_INTENTS as readonly string[]).includes(action)
  ) {
    return null;
  }
  if (isExplainProviderSessionTimeoutPrompt(prompt)) {
    return {
      action: 'explain_provider_session_timeout',
      rescueReason: 'explain_provider_session_timeout',
    };
  }
  return null;
}
