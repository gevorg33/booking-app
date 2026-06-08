import { describe, expect, it, beforeEach } from 'vitest';
import {
  CONSUMER_LOCALE_LABELS,
  localeStorageKey,
  readDefaultLocale,
  readEnabledLocales,
  resolveConsumerLocale,
  formatStoredTenantLocaleLabel,
  writeStoredConsumerLocale,
} from './tenant-locale.js';

describe('tenant-locale (Sprint 29)', () => {
  const profile = {
    locale: 'en',
    defaultLocale: 'hy',
    enabledLocales: ['en', 'hy'],
  };

  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => store.clear(),
        get length() {
          return store.size;
        },
        key: (index: number) => [...store.keys()][index] ?? null,
      },
    });
    localStorage.clear();
  });

  it('reads enabled locales with backward-compatible default', () => {
    expect(readEnabledLocales({})).toEqual(['en', 'hy', 'ru']);
    expect(readEnabledLocales(profile)).toEqual(['en', 'hy']);
  });

  it('reads default locale from tenant settings', () => {
    expect(readDefaultLocale(profile)).toBe('hy');
    expect(
      readDefaultLocale({
        defaultLocale: 'ru',
        enabledLocales: ['en', 'hy'],
      }),
    ).toBe('en');
  });

  it('persists and resolves consumer locale per slug', () => {
    writeStoredConsumerLocale('salon', 'hy');
    expect(resolveConsumerLocale('salon', profile)).toBe('hy');
    expect(localStorage.getItem(localeStorageKey('salon'))).toBe('hy');
  });

  it('ignores stored locale when it is not enabled', () => {
    writeStoredConsumerLocale('salon', 'ru');
    expect(resolveConsumerLocale('salon', profile)).toBe('hy');
  });

  it('formats stored tenant locale labels for switcher subtitles', () => {
    writeStoredConsumerLocale('salon', 'hy');
    expect(formatStoredTenantLocaleLabel('salon')).toBe(CONSUMER_LOCALE_LABELS.hy);
    expect(formatStoredTenantLocaleLabel('missing')).toBeNull();
  });
});
