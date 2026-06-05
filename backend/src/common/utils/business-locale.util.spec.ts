import { BadRequestException } from '@nestjs/common';
import {
  assertBusinessLocaleSettings,
  filterTranslationLocaleKeys,
  getBusinessDefaultLocale,
  getBusinessEnabledLocales,
  isSupportedAppLocale,
  mergeBusinessLocaleSettings,
  normalizeAppLocale,
  resolveStaffLocale,
  resolveTenantLocale,
  SUPPORTED_LOCALES,
} from './business-locale.util.js';

describe('business-locale.util', () => {
  it('re-exports supported locales', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'hy', 'ru']);
  });
  describe('normalizeAppLocale', () => {
    it.each([
      ['en', 'en'],
      [' HY ', 'hy'],
      ['Ru', 'ru'],
    ])('normalizes %s to %s', (input, expected) => {
      expect(normalizeAppLocale(input)).toBe(expected);
    });

    it.each([['de'], [''], [null], [undefined]])('rejects %s', (input) => {
      expect(normalizeAppLocale(input)).toBeNull();
    });
  });

  describe('getBusinessEnabledLocales', () => {
    it('defaults to all supported locales', () => {
      expect(getBusinessEnabledLocales({})).toEqual(['en', 'hy', 'ru']);
    });

    it('dedupes and filters unsupported codes', () => {
      expect(
        getBusinessEnabledLocales({
          enabledLocales: ['hy', 'hy', 'de', 'en'],
        }),
      ).toEqual(['hy', 'en']);
    });
  });

  describe('getBusinessDefaultLocale', () => {
    it('prefers defaultLocale over legacy locale', () => {
      expect(
        getBusinessDefaultLocale({
          defaultLocale: 'hy',
          locale: 'en',
          enabledLocales: ['en', 'hy'],
        }),
      ).toBe('hy');
    });

    it('returns preferred locale when it is enabled', () => {
      expect(
        getBusinessDefaultLocale({
          defaultLocale: 'en',
          enabledLocales: ['en', 'hy'],
        }),
      ).toBe('en');
    });

    it('falls back to first enabled when preferred is disabled', () => {
      expect(
        getBusinessDefaultLocale({
          defaultLocale: 'ru',
          enabledLocales: ['en', 'hy'],
        }),
      ).toBe('en');
    });

    it('defaults to en when settings omit locale fields', () => {
      expect(getBusinessDefaultLocale({ enabledLocales: ['en', 'hy'] })).toBe(
        'en',
      );
    });
  });

  describe('isSupportedAppLocale', () => {
    it('returns true for supported codes', () => {
      expect(isSupportedAppLocale('en')).toBe(true);
      expect(isSupportedAppLocale('xx')).toBe(false);
    });
  });

  describe('assertBusinessLocaleSettings', () => {
    it('uses all supported locales when enabledLocales omitted in assert', () => {
      expect(assertBusinessLocaleSettings({ defaultLocale: 'hy' })).toEqual({
        enabledLocales: ['en', 'hy', 'ru'],
        defaultLocale: 'hy',
      });
    });

    it('rejects non-array enabledLocales', () => {
      expect(() =>
        assertBusinessLocaleSettings({ enabledLocales: 'en' }),
      ).toThrow(BadRequestException);
    });

    it('rejects invalid entries in enabledLocales', () => {
      expect(() =>
        assertBusinessLocaleSettings({ enabledLocales: ['en', 'de'] }),
      ).toThrow(BadRequestException);
      expect(() =>
        assertBusinessLocaleSettings({
          enabledLocales: ['en', 1 as unknown as string],
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects invalid defaultLocale', () => {
      expect(() =>
        assertBusinessLocaleSettings({
          enabledLocales: ['en'],
          defaultLocale: 'de',
        }),
      ).toThrow(BadRequestException);
    });

    it('defaults defaultLocale to first enabled when omitted', () => {
      expect(
        assertBusinessLocaleSettings({ enabledLocales: ['hy', 'en'] }),
      ).toEqual({
        enabledLocales: ['hy', 'en'],
        defaultLocale: 'hy',
      });
    });

    it('requires at least one enabled locale', () => {
      expect(() =>
        assertBusinessLocaleSettings({ enabledLocales: [] }),
      ).toThrow(BadRequestException);
    });

    it('requires defaultLocale in enabled list', () => {
      expect(() =>
        assertBusinessLocaleSettings({
          enabledLocales: ['en'],
          defaultLocale: 'hy',
        }),
      ).toThrow(BadRequestException);
    });

    it('returns normalized settings', () => {
      expect(
        assertBusinessLocaleSettings({
          enabledLocales: ['ru', 'en', 'en'],
          defaultLocale: 'ru',
        }),
      ).toEqual({
        enabledLocales: ['ru', 'en'],
        defaultLocale: 'ru',
      });
    });

    it('skips duplicate enabled locale entries', () => {
      expect(
        assertBusinessLocaleSettings({
          enabledLocales: ['en', 'en', 'hy'],
          defaultLocale: 'hy',
        }),
      ).toEqual({
        enabledLocales: ['en', 'hy'],
        defaultLocale: 'hy',
      });
    });
  });

  describe('resolveTenantLocale', () => {
    it('uses preferred locale when enabled', () => {
      expect(
        resolveTenantLocale('hy', {
          enabledLocales: ['en', 'hy'],
          defaultLocale: 'en',
        }),
      ).toBe('hy');
    });

    it('falls back to default when preferred is disabled', () => {
      expect(
        resolveTenantLocale('ru', {
          enabledLocales: ['en', 'hy'],
          defaultLocale: 'hy',
        }),
      ).toBe('hy');
    });

    it('falls back when preferred is null or invalid', () => {
      expect(
        resolveTenantLocale(null, {
          enabledLocales: ['hy'],
          defaultLocale: 'hy',
        }),
      ).toBe('hy');
      expect(resolveTenantLocale('de', { defaultLocale: 'en' })).toBe('en');
    });
  });

  describe('resolveStaffLocale', () => {
    it('uses user preference when supported', () => {
      expect(resolveStaffLocale('ru', { defaultLocale: 'en' })).toBe('ru');
    });

    it('falls back to tenant default', () => {
      expect(resolveStaffLocale('de', { defaultLocale: 'hy' })).toBe('hy');
    });
  });

  describe('filterTranslationLocaleKeys', () => {
    it('strips disabled locales when not strict', () => {
      expect(
        filterTranslationLocaleKeys({ en: ['A'], hy: ['B'], ru: ['C'] }, [
          'en',
          'hy',
        ]),
      ).toEqual({ en: ['A'], hy: ['B'] });
    });

    it('throws for disabled locales in strict mode', () => {
      expect(() =>
        filterTranslationLocaleKeys({ en: ['A'], ru: ['B'] }, ['en'], {
          strict: true,
        }),
      ).toThrow(BadRequestException);
    });

    it('strips disabled locales when stripDisabledOnly is set', () => {
      expect(
        filterTranslationLocaleKeys({ en: ['A'], ru: ['B'] }, ['en'], {
          strict: true,
          stripDisabledOnly: true,
        }),
      ).toEqual({ en: ['A'] });
    });
  });

  describe('mergeBusinessLocaleSettings', () => {
    it('syncs legacy locale field with defaultLocale', () => {
      expect(
        mergeBusinessLocaleSettings(
          { locale: 'en' },
          { enabledLocales: ['en', 'hy'], defaultLocale: 'hy' },
        ),
      ).toEqual({
        locale: 'hy',
        enabledLocales: ['en', 'hy'],
        defaultLocale: 'hy',
      });
    });

    it('can patch enabledLocales only', () => {
      expect(
        mergeBusinessLocaleSettings(
          { locale: 'en' },
          { enabledLocales: ['hy'] },
        ),
      ).toEqual({ locale: 'en', enabledLocales: ['hy'] });
    });
  });

  describe('getBusinessEnabledLocales edge cases', () => {
    it('falls back when every configured entry is invalid', () => {
      expect(
        getBusinessEnabledLocales({ enabledLocales: ['de', 1, null] }),
      ).toEqual(['en', 'hy', 'ru']);
    });

    it('skips duplicate enabled locale entries', () => {
      expect(
        getBusinessEnabledLocales({ enabledLocales: ['en', 'en', 'hy'] }),
      ).toEqual(['en', 'hy']);
    });
  });

  describe('filterTranslationLocaleKeys non-strict', () => {
    it('skips unsupported locales silently', () => {
      expect(
        filterTranslationLocaleKeys({ de: ['x'], en: ['y'] }, ['en'], {
          strict: false,
        }),
      ).toEqual({ en: ['y'] });
    });

    it('throws for unsupported locales in strict mode', () => {
      expect(() =>
        filterTranslationLocaleKeys({ de: ['x'] }, ['en'], { strict: true }),
      ).toThrow(BadRequestException);
    });
  });

  describe('mergeBusinessLocaleSettings edge cases', () => {
    it('starts from empty settings when current is undefined', () => {
      expect(
        mergeBusinessLocaleSettings(undefined, {
          defaultLocale: 'hy',
        }),
      ).toEqual({
        defaultLocale: 'hy',
        locale: 'hy',
      });
    });

    it('patches only defaultLocale without enabledLocales', () => {
      expect(
        mergeBusinessLocaleSettings({ locale: 'en' }, { defaultLocale: 'ru' }),
      ).toEqual({
        locale: 'ru',
        defaultLocale: 'ru',
      });
    });
  });
});
