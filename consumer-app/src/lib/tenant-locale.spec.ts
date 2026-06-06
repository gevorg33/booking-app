import { describe, expect, it, beforeEach } from 'vitest';
import {
  localeStorageKey,
  readDefaultLocale,
  readEnabledLocales,
  resolveConsumerLocale,
  writeStoredConsumerLocale,
} from './tenant-locale.js';

describe('tenant-locale (Sprint 29)', () => {
  const profile = {
    locale: 'en',
    defaultLocale: 'hy',
    enabledLocales: ['en', 'hy'],
  };

  beforeEach(() => {
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
});
