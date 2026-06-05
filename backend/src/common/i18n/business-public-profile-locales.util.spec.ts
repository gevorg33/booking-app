import { BadRequestException } from '@nestjs/common';
import {
  PUBLIC_PROFILE_FIELD_MAX,
  applyPublicProfileLocalesToSettings,
  extractPublicProfileLocalesFromSettings,
  normalizePublicProfileLocales,
  resolvePublicProfileField,
} from './business-public-profile-locales.util.js';

describe('business-public-profile-locales.util', () => {
  describe('normalizePublicProfileLocales', () => {
    it('returns undefined when input is undefined', () => {
      expect(normalizePublicProfileLocales(undefined)).toBeUndefined();
    });

    it('returns empty object when input is null', () => {
      expect(normalizePublicProfileLocales(null)).toEqual({});
    });

    it('normalizes per-locale public profile fields', () => {
      expect(
        normalizePublicProfileLocales({
          hy: { name: '  Սալոն  ', tagline: 'Բարև' },
          en: { description: 'Welcome' },
        }),
      ).toEqual({
        hy: { name: 'Սալոն', tagline: 'Բարև' },
        en: { description: 'Welcome' },
      });
    });

    it('skips unsupported locales in non-strict mode', () => {
      expect(
        normalizePublicProfileLocales(
          { de: { name: 'X' }, en: { name: 'Y' } },
          { strict: false },
        ),
      ).toEqual({
        en: { name: 'Y' },
      });
    });

    it('rejects unsupported locales in strict mode', () => {
      expect(() =>
        normalizePublicProfileLocales({ de: { name: 'X' } }),
      ).toThrow(
        new BadRequestException('Unsupported locale in translations: de'),
      );
    });

    it('rejects non-object locale entries', () => {
      expect(() =>
        normalizePublicProfileLocales({ en: ['bad'] as any }),
      ).toThrow(
        new BadRequestException('publicProfileLocales.en must be an object'),
      );
    });

    it('rejects non-string field values', () => {
      expect(() =>
        normalizePublicProfileLocales({ en: { name: 1 as any } }),
      ).toThrow(
        new BadRequestException(
          'publicProfileLocales.en.name must be a string',
        ),
      );
    });

    it('rejects fields that exceed max length', () => {
      const tooLong = 'x'.repeat(PUBLIC_PROFILE_FIELD_MAX.name + 1);
      expect(() =>
        normalizePublicProfileLocales({ en: { name: tooLong } }),
      ).toThrow(
        new BadRequestException(
          `publicProfileLocales.en.name must be at most ${PUBLIC_PROFILE_FIELD_MAX.name} characters`,
        ),
      );
    });

    it('omits locales with only blank fields', () => {
      expect(
        normalizePublicProfileLocales({
          en: { name: '  ', description: '' },
          hy: { tagline: 'OK' },
        }),
      ).toEqual({ hy: { tagline: 'OK' } });
    });

    it('skips null locale entries', () => {
      expect(
        normalizePublicProfileLocales({
          en: null,
          hy: { name: 'Hy' },
        }),
      ).toEqual({ hy: { name: 'Hy' } });
    });
  });

  describe('applyPublicProfileLocalesToSettings', () => {
    it('returns settings unchanged when locales are undefined', () => {
      const settings = { locale: 'en' };
      expect(applyPublicProfileLocalesToSettings(settings, undefined)).toBe(
        settings,
      );
    });

    it('clears settings when empty object is sent', () => {
      const next = applyPublicProfileLocalesToSettings(
        { publicProfileLocales: { en: { name: 'A' } } },
        {},
      );
      expect(next.publicProfileLocales).toBeUndefined();
    });

    it('stores normalized locales on settings', () => {
      const next = applyPublicProfileLocalesToSettings(
        { locale: 'en' },
        { ru: { address: 'Москва' } },
      );
      expect(next.publicProfileLocales).toEqual({ ru: { address: 'Москва' } });
    });
  });

  describe('extractPublicProfileLocalesFromSettings', () => {
    it('returns undefined for missing or invalid settings', () => {
      expect(extractPublicProfileLocalesFromSettings(null)).toBeUndefined();
      expect(extractPublicProfileLocalesFromSettings({})).toBeUndefined();
      expect(
        extractPublicProfileLocalesFromSettings({
          publicProfileLocales: 'bad',
        }),
      ).toBeUndefined();
    });

    it('extracts locales from settings', () => {
      expect(
        extractPublicProfileLocalesFromSettings({
          publicProfileLocales: { ru: { address: 'Москва' } },
        }),
      ).toEqual({ ru: { address: 'Москва' } });
    });

    it('returns undefined when normalized map is empty in non-strict mode', () => {
      expect(
        extractPublicProfileLocalesFromSettings({
          publicProfileLocales: { de: { name: 'Ignored' } },
        }),
      ).toBeUndefined();
    });
  });

  describe('resolvePublicProfileField', () => {
    it('prefers localized value over fallback', () => {
      const locales = { hy: { name: 'Հայերեն' } };
      expect(resolvePublicProfileField('English', locales, 'hy', 'name')).toBe(
        'Հայերեն',
      );
      expect(resolvePublicProfileField('English', locales, 'en', 'name')).toBe(
        'English',
      );
    });

    it('returns undefined when fallback and localized values are empty', () => {
      expect(
        resolvePublicProfileField('', undefined, 'en', 'name'),
      ).toBeUndefined();
      expect(
        resolvePublicProfileField(null, { en: { name: '  ' } }, 'en', 'name'),
      ).toBeUndefined();
    });
  });
});
