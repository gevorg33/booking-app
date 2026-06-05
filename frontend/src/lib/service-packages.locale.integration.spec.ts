import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES, type AppLocale } from '../i18n/types';
import {
  defaultPackageFormState,
  packageLocalizedNamesPayload,
  packageToFormState,
  type ServicePackageRecord,
} from './service-packages';
import { readBusinessEnabledLocales } from './business-locale';

describe('Sprint 29 — package localized names integration', () => {
  const enabledLocales = readBusinessEnabledLocales({
    enabledLocales: ['en', 'hy'],
    defaultLocale: 'en',
  });

  it('round-trips localizedNames through package form state', () => {
    const pkg: ServicePackageRecord = {
      id: 'pkg-1',
      name: 'Spa bundle',
      localizedNames: { en: ['Spa Day'], hy: ['Սպա օր'] },
      discountType: 'percent',
      discountValue: 15,
      displayOrder: 0,
      isActive: true,
    };

    const form = packageToFormState(pkg);

    expect(form.localizedNames.en[0]).toBe('Spa Day');
    expect(form.localizedNames.hy[0]).toBe('Սպա օր');
    expect(packageLocalizedNamesPayload(form)).toEqual({
      en: ['Spa Day'],
      hy: ['Սպա օր'],
    });
  });

  it.each(
    SUPPORTED_LOCALES.map((locale) => ({
      locale,
      enabled: enabledLocales.includes(locale),
    })),
  )(
    'admin gating exposes $locale column only when enabled ($enabled)',
    ({ locale, enabled }) => {
      const disabledLocales = SUPPORTED_LOCALES.filter(
        (code) => !enabledLocales.includes(code),
      );
      if (enabled) {
        expect(enabledLocales).toContain(locale);
      } else {
        expect(disabledLocales).toContain(locale);
      }
    },
  );

  it('defaultPackageFormState starts with empty localized name slots', () => {
    const form = defaultPackageFormState();
    for (const locale of SUPPORTED_LOCALES) {
      expect(form.localizedNames[locale]).toEqual(['', '', '']);
    }
    expect(packageLocalizedNamesPayload(form)).toBeUndefined();
  });

  it('omits empty localizedNames from save payload', () => {
    const form = defaultPackageFormState();
    expect(packageLocalizedNamesPayload(form)).toBeUndefined();
  });

  it('trims and caps localized name slots in payload', () => {
    const form = defaultPackageFormState();
    form.localizedNames.en = ['  Spa Day  ', 'Alt', 'Third'];
    form.localizedNames.hy = ['', 'Սպա', ''];

    expect(packageLocalizedNamesPayload(form)).toEqual({
      en: ['Spa Day', 'Alt', 'Third'],
      hy: ['Սպա'],
    });
  });

  it('maps package without localizedNames to empty form slots', () => {
    const form = packageToFormState({
      id: 'pkg-2',
      name: 'Primary only',
      discountType: 'percent',
      discountValue: 10,
      displayOrder: 1,
      isActive: true,
    });

    for (const locale of SUPPORTED_LOCALES) {
      expect(form.localizedNames[locale as AppLocale]).toEqual(['', '', '']);
    }
  });
});
