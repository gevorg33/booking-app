import { describe, expect, it } from 'vitest';
import {
  emptyLocalizedNamesForm,
  localizedNamesFromApi,
  localizedNamesToPayload,
} from './localized-names';

describe('localized-names helpers', () => {
  it('returns empty form slots for all locales', () => {
    expect(emptyLocalizedNamesForm()).toEqual({
      en: ['', '', ''],
      hy: ['', '', ''],
      ru: ['', '', ''],
    });
  });

  it('returns empty form when API value is nullish', () => {
    expect(localizedNamesFromApi(null)).toEqual(emptyLocalizedNamesForm());
    expect(localizedNamesFromApi(undefined)).toEqual(emptyLocalizedNamesForm());
  });

  it('maps API values into three slots per locale', () => {
    expect(
      localizedNamesFromApi({
        en: ['English'],
        hy: ['Հայ', 'Երկրորդ'],
      }),
    ).toEqual({
      en: ['English', '', ''],
      hy: ['Հայ', 'Երկրորդ', ''],
      ru: ['', '', ''],
    });
  });

  it('fills missing slots when fewer than three names are stored', () => {
    expect(localizedNamesFromApi({ en: ['Only'] })).toEqual({
      en: ['Only', '', ''],
      hy: ['', '', ''],
      ru: ['', '', ''],
    });
  });

  it('pads sparse locale arrays to three slots', () => {
    expect(
      localizedNamesFromApi({
        en: [undefined, 'Second', undefined] as unknown as string[],
      }),
    ).toEqual({
      en: ['', 'Second', ''],
      hy: ['', '', ''],
      ru: ['', '', ''],
    });
  });

  it('returns undefined payload when all slots are blank', () => {
    expect(localizedNamesToPayload(emptyLocalizedNamesForm())).toBeUndefined();
  });

  it('trims and caps names per locale in payload', () => {
    expect(
      localizedNamesToPayload({
        en: ['  Color  ', '', 'Tone'],
        hy: ['', '  ', ''],
        ru: ['Стрижка', 'Extra', 'Third', 'Fourth'],
      }),
    ).toEqual({
      en: ['Color', 'Tone'],
      ru: ['Стрижка', 'Extra', 'Third'],
    });
  });
});
