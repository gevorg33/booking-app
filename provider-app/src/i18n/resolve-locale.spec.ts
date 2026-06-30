import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearStoredLocale, writeStoredLocale } from './locale-storage';
import { normalizeAppLocale, resolveProviderAppLocale } from './resolve-locale';

describe('resolve-locale', () => {
  beforeEach(() => {
    clearStoredLocale();
  });

  afterEach(() => {
    clearStoredLocale();
    vi.restoreAllMocks();
  });

  describe('normalizeAppLocale', () => {
    it('returns supported locales unchanged', () => {
      expect(normalizeAppLocale('en')).toBe('en');
      expect(normalizeAppLocale('hy')).toBe('hy');
      expect(normalizeAppLocale('ru')).toBe('ru');
    });

    it('falls back to English for unknown values', () => {
      expect(normalizeAppLocale(null)).toBe('en');
      expect(normalizeAppLocale(undefined)).toBe('en');
      expect(normalizeAppLocale('de')).toBe('en');
      expect(normalizeAppLocale('')).toBe('en');
    });
  });

  describe('resolveProviderAppLocale', () => {
    it('prefers stored locale over user and business when set', () => {
      writeStoredLocale('ru');
      expect(resolveProviderAppLocale('hy', 'en')).toBe('ru');
    });

    it('prefers user locale over business when no stored override', () => {
      expect(resolveProviderAppLocale('hy', 'ru')).toBe('hy');
    });

    it('uses business locale when user locale is missing or invalid and no stored override', () => {
      expect(resolveProviderAppLocale(null, 'ru')).toBe('ru');
      expect(resolveProviderAppLocale('de', 'hy')).toBe('hy');
    });

    it('uses stored locale when user and business are absent', () => {
      writeStoredLocale('hy');
      expect(resolveProviderAppLocale(null, null)).toBe('hy');
      expect(resolveProviderAppLocale(undefined, undefined)).toBe('hy');
    });

    it('defaults to English when nothing is configured', () => {
      expect(resolveProviderAppLocale(null, null)).toBe('en');
    });

    it('ignores invalid stored locale', () => {
      localStorage.setItem('provider-app-locale', 'fr');
      expect(resolveProviderAppLocale(null, null)).toBe('en');
    });

    it('constrains user preference to tenant enabled locales', () => {
      expect(
        resolveProviderAppLocale('ru', 'ru', ['en', 'hy'], 'hy'),
      ).toBe('hy');
    });

    it('uses enabled user preference when allowed', () => {
      expect(
        resolveProviderAppLocale('hy', 'en', ['en', 'hy'], 'en'),
      ).toBe('hy');
    });

    it('falls back to tenant default when stored locale is disabled', () => {
      writeStoredLocale('ru');
      expect(
        resolveProviderAppLocale(null, null, ['en', 'hy'], 'hy'),
      ).toBe('hy');
    });
  });
});
