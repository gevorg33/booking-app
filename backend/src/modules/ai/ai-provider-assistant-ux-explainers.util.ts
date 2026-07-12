import {
  PROVIDER_EXPLAIN_OFFLINE_SUGGESTIONS_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_ACCESSIBILITY_SETTINGS_PROMPT_SCENARIOS,
} from './ai-provider-assistant-ux-explainers.fixtures.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

/** ai-cmd-provider-5.24.1 — why Today's suggestion cards can look stale offline and when they refresh. */
export function isExplainOfflineSuggestionsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(mark|set|update|block|cancel|reschedule|check\s+in)\b/.test(lower)) {
    return false;
  }

  if (
    /\bstale\s+suggestions?\b/i.test(lower) ||
    /\bsuggestions?\s+(?:not|aren'?t)\s+updat(?:ing|ed)\b/i.test(lower) ||
    /\brefresh\s+(?:the\s+)?suggestions?\s+when\s+online\b/i.test(lower) ||
    /\bwhy\s+(?:are\s+)?(?:these|my)\s+suggestions?\s+(?:stale|old|outdated)\b/i.test(
      lower,
    ) ||
    /\bwhen\s+do\s+suggestions?\s+refresh\b/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(հուշում)/i.test(prompt) &&
    /(հին|թարմ)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(подсказ)/i.test(prompt) &&
    /(устарел|обнов)/i.test(prompt)
  ) {
    return true;
  }

  return PROVIDER_EXPLAIN_OFFLINE_SUGGESTIONS_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

/** ai-cmd-provider-5.24.6 — local OS-level accessibility settings (font size, tap targets); no in-app control. */
export function isExplainAccessibilitySettingsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  if (
    /\bbigger\s+text\s+in\s+(?:the\s+)?app\b/i.test(lower) ||
    /\blarger\s+tap\s+targets?\b/i.test(lower) ||
    /\b(increase|bigger|larger)\s+(?:the\s+)?font\s+size\b/i.test(lower) ||
    /\baccessibility\s+settings?\b/i.test(lower) ||
    /\bmake\s+(?:the\s+)?text\s+bigger\b/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(հասանելիություն)/i.test(prompt) &&
    /(տառաչափ|մեծ)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(доступност)/i.test(prompt) &&
    /(шрифт|крупн)/i.test(prompt)
  ) {
    return true;
  }

  return PROVIDER_EXPLAIN_ACCESSIBILITY_SETTINGS_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function buildExplainOfflineSuggestionsSummary(): string {
  return [
    "Today's suggestion cards are cached on your device so they still show up while you're offline.",
    'That means they can go stale while you have no connection — they were computed the last time you were online.',
    'Once your phone reconnects, the app automatically refreshes them in the background, or you can pull to refresh on the Today tab.',
  ].join(' ');
}

export function buildExplainAccessibilitySettingsSummary(): string {
  return [
    'Text size and tap target size follow your phone\'s system accessibility settings, not a setting inside this app.',
    'On iOS: Settings → Accessibility → Display & Text Size.',
    'On Android: Settings → Accessibility → Display size and text.',
    'The app scales its layout to match whatever your device is set to.',
  ].join(' ');
}

export function rescueAssistantUxExplainersIntent(
  prompt: string,
  action: string,
): {
  action: 'explain_offline_suggestions' | 'explain_accessibility_settings';
  rescueReason: string;
} | null {
  if (
    isExplainOfflineSuggestionsPrompt(prompt) &&
    action !== 'explain_offline_suggestions'
  ) {
    return {
      action: 'explain_offline_suggestions',
      rescueReason: 'explain_offline_suggestions',
    };
  }
  if (
    isExplainAccessibilitySettingsPrompt(prompt) &&
    action !== 'explain_accessibility_settings'
  ) {
    return {
      action: 'explain_accessibility_settings',
      rescueReason: 'explain_accessibility_settings',
    };
  }
  return null;
}
