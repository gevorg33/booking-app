import { describe, expect, it } from '@jest/globals';
import {
  mergeServiceLocalizedNames,
  missingServiceTranslationLocales,
  readExplicitServiceLocalizedNames,
} from './ai-catalog-service-localized-names.util.js';

describe('ai-catalog-service-localized-names.util', () => {
  it('merges explicit and generated locale maps', () => {
    expect(
      mergeServiceLocalizedNames(
        { hy: ['Մազեր'] },
        { ru: ['Стрижка с мытьем головы'] },
      ),
    ).toEqual({
      hy: ['Մազեր'],
      ru: ['Стрижка с мытьем головы'],
    });
  });

  it('requests hy and ru when enabled and missing', () => {
    expect(
      missingServiceTranslationLocales(['en', 'hy', 'ru'], { hy: ['Կտրում'] }),
    ).toEqual(['ru']);
    expect(missingServiceTranslationLocales(['en'], undefined)).toEqual([]);
  });

  it('reads explicit localizedNames from params', () => {
    const names = readExplicitServiceLocalizedNames(
      {
        localizedNames: {
          hy: ['Տղամարդու սանրվածք'],
          ru: ['Мужская стрижка'],
        },
      },
      undefined,
      ['en', 'hy', 'ru'],
    );
    expect(names?.hy?.[0]).toBe('Տղամարդու սանրվածք');
    expect(names?.ru?.[0]).toBe('Мужская стрижка');
  });
});
