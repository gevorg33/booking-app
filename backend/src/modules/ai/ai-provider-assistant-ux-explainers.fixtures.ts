/** ai-cmd-provider-5.24.1 / 5.24.6 — static educational explainers for offline suggestion staleness and OS-level accessibility settings. */

export const PROVIDER_ASSISTANT_UX_EXPLAINERS_CLASSIFIER_RULES = `- explain_offline_suggestions: READ — provider mobile only: explains why Today's cached suggestion cards can look stale while offline and when they refresh. Triggers: why stale suggestions, refresh suggestions when online, suggestions not updating. NOT explain_offline_mode (general offline banner/queue), NOT explain_ai_suggestions (what a suggestion card/chip means).
- explain_accessibility_settings: READ — provider mobile only: explains that text size and tap target size follow the phone's OS-level accessibility settings, not an in-app control. Triggers: bigger text in app, larger tap targets, accessibility settings. Local device UI preference — no backend query.`;

export const PROVIDER_EXPLAIN_OFFLINE_SUGGESTIONS_PROMPT_SCENARIOS = [
  { id: 'explain-offline-suggestions-stale-en', prompt: 'Why stale suggestions?', surface: 'provider' as const, expectedAction: 'explain_offline_suggestions' },
  { id: 'explain-offline-suggestions-refresh-en', prompt: 'Refresh suggestions when online?', surface: 'provider' as const, expectedAction: 'explain_offline_suggestions' },
  { id: 'explain-offline-suggestions-not-updating-en', prompt: 'Suggestions are not updating', surface: 'provider' as const, expectedAction: 'explain_offline_suggestions' },
  { id: 'explain-offline-suggestions-hy', prompt: 'Ինչու է հուշումը հին', surface: 'provider' as const, expectedAction: 'explain_offline_suggestions' },
  { id: 'explain-offline-suggestions-ru', prompt: 'Почему подсказки устарели?', surface: 'provider' as const, expectedAction: 'explain_offline_suggestions' },
] as const;

export const PROVIDER_EXPLAIN_ACCESSIBILITY_SETTINGS_PROMPT_SCENARIOS = [
  { id: 'explain-accessibility-bigger-text-en', prompt: 'Bigger text in app?', surface: 'provider' as const, expectedAction: 'explain_accessibility_settings' },
  { id: 'explain-accessibility-tap-targets-en', prompt: 'Larger tap targets?', surface: 'provider' as const, expectedAction: 'explain_accessibility_settings' },
  { id: 'explain-accessibility-font-size-en', prompt: 'Increase the font size in the app', surface: 'provider' as const, expectedAction: 'explain_accessibility_settings' },
  { id: 'explain-accessibility-hy', prompt: 'Հասանելիության կարգավորումներում մեծ տառաչափ', surface: 'provider' as const, expectedAction: 'explain_accessibility_settings' },
  { id: 'explain-accessibility-ru', prompt: 'Настройки доступности — крупный шрифт', surface: 'provider' as const, expectedAction: 'explain_accessibility_settings' },
] as const;
