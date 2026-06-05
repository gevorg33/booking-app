import { BadRequestException } from '@nestjs/common';
import {
  LOCALIZED_NAME_MAX_LENGTH,
  applyLocalizedNamesToMetadata,
  collectLocalizedNameAliases,
  extractLocalizedNamesFromMetadata,
  normalizeLocalizedNames,
  resolveLocalizedDisplayName,
} from './service-localized-names.util.js';

describe('service-localized-names.util', () => {
  describe('normalizeLocalizedNames', () => {
    it('returns undefined when input is undefined', () => {
      expect(normalizeLocalizedNames(undefined)).toBeUndefined();
    });

    it('returns empty object when input is null', () => {
      expect(normalizeLocalizedNames(null)).toEqual({});
    });

    it('normalizes up to three names per locale', () => {
      expect(
        normalizeLocalizedNames({
          en: [' Haircut ', '  ', 'Trim'],
          hy: ['Կտրում'],
          ru: ['Стрижка'],
        }),
      ).toEqual({
        en: ['Haircut', 'Trim'],
        hy: ['Կտրում'],
        ru: ['Стрижка'],
      });
    });

    it('rejects unknown locales when strict', () => {
      expect(() => normalizeLocalizedNames({ de: ['Test'] })).toThrow(
        new BadRequestException('Unsupported locale in localizedNames: de'),
      );
    });

    it('skips unknown locales when not strict', () => {
      expect(
        normalizeLocalizedNames(
          { de: ['Test'], en: ['Color'] },
          { strict: false },
        ),
      ).toEqual({ en: ['Color'] });
    });

    it('rejects non-array locale values', () => {
      expect(() =>
        normalizeLocalizedNames({ en: 'Haircut' as unknown as string[] }),
      ).toThrow(/must be an array/);
    });

    it('rejects more than three slots in input array', () => {
      expect(() =>
        normalizeLocalizedNames({ en: ['a', 'b', 'c', 'd'] }),
      ).toThrow(/at most 3 names/);
    });

    it('rejects non-string entries', () => {
      expect(() =>
        normalizeLocalizedNames({ en: [1 as unknown as string] }),
      ).toThrow(/must be strings/);
    });

    it('rejects names longer than max length', () => {
      const long = 'x'.repeat(LOCALIZED_NAME_MAX_LENGTH + 1);
      expect(() => normalizeLocalizedNames({ en: [long] })).toThrow(
        /at most 120 characters/,
      );
    });

    it('ignores null locale values and empty locale arrays', () => {
      expect(
        normalizeLocalizedNames({
          en: null as unknown as string[],
          hy: undefined,
        }),
      ).toEqual({});
    });

    it('skips null and undefined name entries in a locale array', () => {
      expect(
        normalizeLocalizedNames({
          en: [null, undefined, 'Trim'] as unknown as string[],
        }),
      ).toEqual({ en: ['Trim'] });
    });
  });

  describe('extractLocalizedNamesFromMetadata', () => {
    it('returns undefined for missing or invalid metadata', () => {
      expect(extractLocalizedNamesFromMetadata(null)).toBeUndefined();
      expect(extractLocalizedNamesFromMetadata(undefined)).toBeUndefined();
      expect(
        extractLocalizedNamesFromMetadata({ localizedNames: 'bad' }),
      ).toBeUndefined();
    });

    it('reads stored names with non-strict normalization', () => {
      expect(
        extractLocalizedNamesFromMetadata({
          localizedNames: { en: ['Color'], de: ['Ignored'] },
        }),
      ).toEqual({ en: ['Color'] });
    });

    it('returns undefined when stored map normalizes to empty', () => {
      expect(
        extractLocalizedNamesFromMetadata({
          localizedNames: { de: ['Ignored'] },
        }),
      ).toBeUndefined();
    });
  });

  describe('applyLocalizedNamesToMetadata', () => {
    it('returns metadata unchanged when localizedNames is undefined', () => {
      const metadata = { foo: 'bar' };
      expect(applyLocalizedNamesToMetadata(metadata, undefined)).toBe(metadata);
    });

    it('stores and reads from metadata', () => {
      const metadata = applyLocalizedNamesToMetadata({}, { en: ['Color'] });
      expect(extractLocalizedNamesFromMetadata(metadata)).toEqual({
        en: ['Color'],
      });
    });

    it('clears metadata key when all names removed', () => {
      const metadata = applyLocalizedNamesToMetadata(
        { localizedNames: { en: ['A'] }, keep: true },
        { en: ['', ''] },
      );
      expect(metadata.localizedNames).toBeUndefined();
      expect(metadata.keep).toBe(true);
    });
  });

  describe('resolveLocalizedDisplayName', () => {
    it('uses first non-empty localized name for locale', () => {
      expect(
        resolveLocalizedDisplayName(
          'Primary',
          { hy: ['Հայերեն'], en: ['English'] },
          'hy',
        ),
      ).toBe('Հայերեն');
    });

    it('falls back to primary when locale has no names', () => {
      expect(
        resolveLocalizedDisplayName('Primary', { en: ['English'] }, 'ru'),
      ).toBe('Primary');
    });

    it('skips whitespace-only localized entries', () => {
      expect(
        resolveLocalizedDisplayName('Primary', { en: ['  ', 'Trim'] }, 'en'),
      ).toBe('Trim');
    });

    it('falls back when all localized entries are blank', () => {
      expect(resolveLocalizedDisplayName('Primary', { en: ['  '] }, 'en')).toBe(
        'Primary',
      );
    });
  });

  describe('collectLocalizedNameAliases', () => {
    it('collects aliases across locales', () => {
      expect(
        collectLocalizedNameAliases('Primary', {
          en: ['English'],
          hy: ['Հայերեն'],
        }),
      ).toEqual(expect.arrayContaining(['Primary', 'English', 'Հայերեն']));
    });

    it('omits blank primary and localized values', () => {
      expect(collectLocalizedNameAliases('  ', { en: ['  '] })).toEqual([]);
    });

    it('returns only primary when no localized map', () => {
      expect(collectLocalizedNameAliases('Cut')).toEqual(['Cut']);
    });

    it('handles missing locale arrays in the map', () => {
      expect(
        collectLocalizedNameAliases('Cut', {
          en: undefined as unknown as string[],
        }),
      ).toEqual(['Cut']);
    });
  });
});
