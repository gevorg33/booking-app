import { SUPPORTED_LOCALES, type AppLocale } from '../i18n/types';

export const LOCALIZED_NAME_SLOTS = 3;

export type LocalizedNamesMap = Partial<Record<AppLocale, string[]>>;

export type LocalizedNamesFormState = Record<AppLocale, [string, string, string]>;

export function emptyLocalizedNamesForm(): LocalizedNamesFormState {
  return {
    en: ['', '', ''],
    hy: ['', '', ''],
    ru: ['', '', ''],
  };
}

export function localizedNamesFromApi(value?: LocalizedNamesMap | null): LocalizedNamesFormState {
  const form = emptyLocalizedNamesForm();
  if (!value) return form;
  for (const locale of SUPPORTED_LOCALES) {
    const names = value[locale];
    if (!names?.length) continue;
    form[locale] = [
      names[0] ?? '',
      names[1] ?? '',
      names[2] ?? '',
    ] as [string, string, string];
  }
  return form;
}

export function localizedNamesToPayload(form: LocalizedNamesFormState): LocalizedNamesMap | undefined {
  const result: LocalizedNamesMap = {};
  for (const locale of SUPPORTED_LOCALES) {
    const names = form[locale]
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, LOCALIZED_NAME_SLOTS);
    if (names.length > 0) result[locale] = names;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
