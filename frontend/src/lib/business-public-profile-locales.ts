import { SUPPORTED_LOCALES, type AppLocale } from '@/i18n';

export type PublicProfileLocaleFields = {
  name: string;
  description: string;
  tagline: string;
  address: string;
};

export type PublicProfileLocalesMap = Partial<Record<AppLocale, PublicProfileLocaleFields>>;

export type PublicProfileLocalesFormState = Record<AppLocale, PublicProfileLocaleFields>;

export function emptyPublicProfileLocalesForm(): PublicProfileLocalesFormState {
  return {
    en: { name: '', description: '', tagline: '', address: '' },
    hy: { name: '', description: '', tagline: '', address: '' },
    ru: { name: '', description: '', tagline: '', address: '' },
  };
}

export function publicProfileLocalesFromApi(
  value?: PublicProfileLocalesMap | null,
): PublicProfileLocalesFormState {
  const form = emptyPublicProfileLocalesForm();
  if (!value) return form;
  for (const locale of SUPPORTED_LOCALES) {
    const entry = value[locale];
    if (!entry) continue;
    form[locale] = {
      name: entry.name ?? '',
      description: entry.description ?? '',
      tagline: entry.tagline ?? '',
      address: entry.address ?? '',
    };
  }
  return form;
}

/** Fill locale columns from legacy single-language profile when overrides were never saved. */
export function seedPublicProfileLocalesFromLegacy(
  locales: PublicProfileLocalesFormState,
  legacy: {
    defaultLocale: AppLocale;
    name?: string;
    description?: string;
    tagline?: string;
    address?: string;
  },
): PublicProfileLocalesFormState {
  const next: PublicProfileLocalesFormState = {
    en: { ...locales.en },
    hy: { ...locales.hy },
    ru: { ...locales.ru },
  };

  const localeHasContent = (locale: AppLocale) =>
    Object.values(next[locale]).some((value) => value.trim());

  if (SUPPORTED_LOCALES.some(localeHasContent)) {
    return next;
  }

  const seed = {
    name: legacy.name?.trim() ?? '',
    description: legacy.description?.trim() ?? '',
    tagline: legacy.tagline?.trim() ?? '',
    address: legacy.address?.trim() ?? '',
  };
  next[legacy.defaultLocale] = seed;
  return next;
}

export function resolveDefaultPublicLocale(locale: string | undefined): AppLocale {
  return SUPPORTED_LOCALES.includes(locale as AppLocale) ? (locale as AppLocale) : 'en';
}

export function publicProfileLocalesToPayload(
  form: PublicProfileLocalesFormState,
): PublicProfileLocalesMap | undefined {
  const result: PublicProfileLocalesMap = {};
  for (const locale of SUPPORTED_LOCALES) {
    const fields: PublicProfileLocaleFields = {
      name: form[locale].name.trim(),
      description: form[locale].description.trim(),
      tagline: form[locale].tagline.trim(),
      address: form[locale].address.trim(),
    };
    const hasAny = Object.values(fields).some(Boolean);
    if (hasAny) {
      result[locale] = {
        ...(fields.name ? { name: fields.name } : {}),
        ...(fields.description ? { description: fields.description } : {}),
        ...(fields.tagline ? { tagline: fields.tagline } : {}),
        ...(fields.address ? { address: fields.address } : {}),
      };
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
