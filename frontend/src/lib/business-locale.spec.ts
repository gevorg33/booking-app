import { describe, expect, it } from 'vitest';
import {
  filterLocalizedNamesPayload,
  normalizeAppLocale,
  readBusinessDefaultLocale,
  readBusinessEnabledLocales,
  resolveStaffLocale,
  resolveTenantLocale,
} from './business-locale';

describe('business-locale', () => {
  it('reads enabled locales with backward-compatible default', () => {
    expect(readBusinessEnabledLocales({})).toEqual(['en', 'hy', 'ru']);
    expect(
      readBusinessEnabledLocales({ enabledLocales: ['hy', 'en'] }),
    ).toEqual(['hy', 'en']);
  });

  it('reads default locale from settings', () => {
    expect(
      readBusinessDefaultLocale({
        defaultLocale: 'hy',
        enabledLocales: ['en', 'hy'],
      }),
    ).toBe('hy');
  });

  it('resolves tenant locale within enabled list', () => {
    expect(
      resolveTenantLocale('ru', {
        enabledLocales: ['en', 'hy'],
        defaultLocale: 'hy',
      }),
    ).toBe('hy');
  });

  it('resolves staff locale from user preference', () => {
    expect(resolveStaffLocale('ru', { defaultLocale: 'en' })).toBe('ru');
    expect(resolveStaffLocale('de', { defaultLocale: 'hy' })).toBe('hy');
  });

  it('normalizes app locale codes', () => {
    expect(normalizeAppLocale(' HY ')).toBe('hy');
    expect(normalizeAppLocale('de')).toBeNull();
  });

  it('filters localized name payloads to enabled locales', () => {
    expect(
      filterLocalizedNamesPayload(
        { en: ['A'], hy: ['B'], ru: ['C'] },
        ['en', 'hy'],
      ),
    ).toEqual({ en: ['A'], hy: ['B'] });
  });

  it('falls back when all enabled locale entries are invalid', () => {
    expect(
      readBusinessEnabledLocales({ enabledLocales: ['de', 1, null] }),
    ).toEqual(['en', 'hy', 'ru']);
  });

  it('uses legacy locale when defaultLocale missing', () => {
    expect(
      readBusinessDefaultLocale({
        locale: 'ru',
        enabledLocales: ['en', 'ru'],
      }),
    ).toBe('ru');
  });

  it('falls back when preferred default is not enabled', () => {
    expect(
      readBusinessDefaultLocale({
        defaultLocale: 'ru',
        enabledLocales: ['en', 'hy'],
      }),
    ).toBe('en');
  });

  it('defaults to en when settings omit locale fields', () => {
    expect(readBusinessDefaultLocale({ enabledLocales: ['en', 'hy'] })).toBe(
      'en',
    );
  });

  it('resolves tenant locale from cookie-like preference when enabled', () => {
    expect(
      resolveTenantLocale('hy', {
        enabledLocales: ['en', 'hy'],
        defaultLocale: 'en',
      }),
    ).toBe('hy');
  });

  it('dedupes enabled locale entries', () => {
    expect(
      readBusinessEnabledLocales({ enabledLocales: ['en', 'en', 'hy'] }),
    ).toEqual(['en', 'hy']);
  });

  it('skips invalid keys in localized payload filter', () => {
    expect(
      filterLocalizedNamesPayload({ en: ['A'], de: ['B'], hy: ['C'] }, ['en', 'hy']),
    ).toEqual({ en: ['A'], hy: ['C'] });
  });
});
