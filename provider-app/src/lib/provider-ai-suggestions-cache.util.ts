export interface CachedAiSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  prompt: string;
  category: string;
}

export interface CachedAiSuggestionsEntry {
  businessId: string;
  fetchedAt: string;
  suggestions: CachedAiSuggestion[];
}

export const PROVIDER_AI_SUGGESTIONS_CACHE_KEY = 'provider_ai_suggestions_cache_v1';

export function loadSuggestionsCache(
  businessId: string,
  storage: Storage = localStorage,
): CachedAiSuggestion[] {
  try {
    const raw = storage.getItem(PROVIDER_AI_SUGGESTIONS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CachedAiSuggestionsEntry;
    if (parsed?.businessId !== businessId || !Array.isArray(parsed.suggestions)) return [];
    return parsed.suggestions;
  } catch {
    return [];
  }
}

export function saveSuggestionsCache(
  businessId: string,
  suggestions: CachedAiSuggestion[],
  storage: Storage = localStorage,
): void {
  const entry: CachedAiSuggestionsEntry = {
    businessId,
    fetchedAt: new Date().toISOString(),
    suggestions,
  };
  storage.setItem(PROVIDER_AI_SUGGESTIONS_CACHE_KEY, JSON.stringify(entry));
}

export function clearSuggestionsCache(storage: Storage = localStorage): void {
  storage.removeItem(PROVIDER_AI_SUGGESTIONS_CACHE_KEY);
}
