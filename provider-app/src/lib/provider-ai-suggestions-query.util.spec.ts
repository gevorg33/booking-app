import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchProviderAiSuggestions,
  shouldShowStaleSuggestionsBanner,
} from './provider-ai-suggestions-query.util';
import { loadSuggestionsCache } from './provider-ai-suggestions-cache.util';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(async () => ({
      data: { data: [{ id: 's1', priority: 'high', title: 'Live', prompt: 'live', category: 'pay' }] },
    })),
  },
  unwrap: <T,>(data: unknown) => ((data as { data?: T })?.data ?? data) as T,
}));

describe('provider-ai-suggestions-query.util', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('fetches suggestions and persists cache', async () => {
    const suggestions = await fetchProviderAiSuggestions('biz-1');
    expect(suggestions[0]?.title).toBe('Live');
    expect(loadSuggestionsCache('biz-1')).toHaveLength(1);
  });

  it('decides when stale banner should show', () => {
    expect(shouldShowStaleSuggestionsBanner(false, false, true, true)).toBe(true);
    expect(shouldShowStaleSuggestionsBanner(true, true, true, true)).toBe(true);
    expect(shouldShowStaleSuggestionsBanner(true, false, true, true)).toBe(false);
    expect(shouldShowStaleSuggestionsBanner(false, false, true, false)).toBe(false);
  });
});
