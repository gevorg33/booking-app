import {
  providerSuggestionText,
  resolveProviderSuggestionsLocale,
} from './provider-ai-suggestions.i18n.js';
import { allProviderSuggestionI18nKeys } from './provider-suggestions-i18n.js';

describe('provider-ai-suggestions i18n', () => {
  describe('resolveProviderSuggestionsLocale', () => {
    it('prefers user locale over business', () => {
      expect(resolveProviderSuggestionsLocale('hy', 'ru')).toBe('hy');
    });

    it('uses business locale when user locale is invalid', () => {
      expect(resolveProviderSuggestionsLocale('de', 'ru')).toBe('ru');
      expect(resolveProviderSuggestionsLocale(null, 'hy')).toBe('hy');
    });

    it('defaults to English', () => {
      expect(resolveProviderSuggestionsLocale(null, null)).toBe('en');
      expect(resolveProviderSuggestionsLocale('fr', 'de')).toBe('en');
    });
  });

  describe('providerSuggestionText', () => {
    const keys = allProviderSuggestionI18nKeys();

    it('resolves every suggestion key in en, hy, and ru', () => {
      for (const key of keys) {
        for (const locale of ['en', 'hy', 'ru'] as const) {
          const text = providerSuggestionText(locale, key, { count: 2, customer: 'Anna', time: '13:00', date: '2026-06-02' });
          expect(text).not.toBe(`providerSuggestions.${key}`);
          expect(text.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('interpolates count and names in Armenian', () => {
      const title = providerSuggestionText('hy', 'confirmPendingTitle', { count: 3 });
      expect(title).toContain('3');
      const next = providerSuggestionText('hy', 'nextUpTitle', { customer: 'Anna', time: '14:00' });
      expect(next).toContain('Anna');
      expect(next).toContain('14:00');
    });

    it('falls back to English for unknown keys', () => {
      const text = providerSuggestionText('hy', 'nonexistentKey' as 'confirmPendingTitle');
      expect(text).toBe('providerSuggestions.nonexistentKey');
    });
  });
});
