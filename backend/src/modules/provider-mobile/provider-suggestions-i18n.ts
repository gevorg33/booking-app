/** Backend provider AI suggestion chip copy (`providerSuggestions.*`). */
export const PROVIDER_SUGGESTION_I18N_KEYS = [
  'confirmPendingTitle',
  'confirmPendingPrompt',
  'unpaidTodayTitle',
  'unpaidTodayPrompt',
  'gapsTodayTitle',
  'gapsTodayPrompt',
  'nextUpTitle',
  'nextUpPrompt',
  'emptyTodayTitle',
  'emptyTodayPrompt',
  'defaultClient',
] as const;

export type ProviderSuggestionI18nKey = (typeof PROVIDER_SUGGESTION_I18N_KEYS)[number];

export function allProviderSuggestionI18nKeys(): ProviderSuggestionI18nKey[] {
  return [...PROVIDER_SUGGESTION_I18N_KEYS];
}
