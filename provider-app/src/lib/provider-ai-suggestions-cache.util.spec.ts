import { describe, expect, it, beforeEach } from 'vitest';
import {
  PROVIDER_AI_SUGGESTIONS_CACHE_KEY,
  clearSuggestionsCache,
  loadSuggestionsCache,
  saveSuggestionsCache,
} from './provider-ai-suggestions-cache.util';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

describe('provider-ai-suggestions-cache.util', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('saves and loads suggestions per business', () => {
    saveSuggestionsCache(
      'biz-1',
      [{ id: 's1', priority: 'high', title: 'Mark paid', prompt: 'mark paid', category: 'pay' }],
      storage,
    );
    expect(loadSuggestionsCache('biz-1', storage)).toHaveLength(1);
    saveSuggestionsCache('biz-1', [], storage);
    expect(loadSuggestionsCache('biz-1', storage)).toEqual([]);
    expect(loadSuggestionsCache('biz-2', storage)).toEqual([]);
  });

  it('returns empty list for invalid cache payloads', () => {
    storage.setItem(PROVIDER_AI_SUGGESTIONS_CACHE_KEY, '{bad');
    expect(loadSuggestionsCache('biz-1', storage)).toEqual([]);
    storage.setItem(
      PROVIDER_AI_SUGGESTIONS_CACHE_KEY,
      JSON.stringify({ businessId: 'biz-1', suggestions: 'nope' }),
    );
    expect(loadSuggestionsCache('biz-1', storage)).toEqual([]);
    storage.setItem(PROVIDER_AI_SUGGESTIONS_CACHE_KEY, 'null');
    expect(loadSuggestionsCache('biz-1', storage)).toEqual([]);
    storage.setItem(
      PROVIDER_AI_SUGGESTIONS_CACHE_KEY,
      JSON.stringify({ suggestions: [] }),
    );
    expect(loadSuggestionsCache('biz-1', storage)).toEqual([]);
    clearSuggestionsCache(storage);
    expect(storage.getItem(PROVIDER_AI_SUGGESTIONS_CACHE_KEY)).toBeNull();
  });
});
