import { BadRequestException } from '@nestjs/common';
import type { AppLocale } from './messages.js';
import { SUPPORTED_LOCALES } from './messages.js';
import {
  filterTranslationLocaleKeys,
  getBusinessEnabledLocales,
} from '../utils/business-locale.util.js';

export const PUBLIC_PROFILE_FIELD_MAX = {
  name: 200,
  description: 4000,
  tagline: 200,
  address: 500,
} as const;

export type PublicProfileLocaleFields = {
  name?: string;
  description?: string;
  tagline?: string;
  address?: string;
};

export type PublicProfileLocalesMap = Partial<
  Record<AppLocale, PublicProfileLocaleFields>
>;

export type PublicProfileLocalesInput = Partial<
  Record<string, PublicProfileLocaleFields | undefined>
> | null;

const SETTINGS_KEY = 'publicProfileLocales';

export function extractPublicProfileLocalesFromSettings(
  settings?: Record<string, unknown> | null,
): PublicProfileLocalesMap | undefined {
  if (!settings || typeof settings !== 'object') return undefined;
  const raw = settings[SETTINGS_KEY];
  if (!raw || typeof raw !== 'object') return undefined;
  const normalized = normalizePublicProfileLocales(raw, {
    strict: false,
  });
  if (!normalized || Object.keys(normalized).length === 0) return undefined;
  return normalized;
}

export function normalizePublicProfileLocales(
  input?: PublicProfileLocalesInput,
  options?: {
    strict?: boolean;
    enabledLocales?: readonly AppLocale[];
    stripDisabledLocales?: boolean;
  },
): PublicProfileLocalesMap | undefined {
  if (input === undefined) return undefined;
  if (input === null) return {};

  const strict = options?.strict ?? true;
  const enabledLocales = options?.enabledLocales ?? [...SUPPORTED_LOCALES];
  const filtered = filterTranslationLocaleKeys(
    input as Record<string, unknown>,
    enabledLocales,
    {
      strict,
      stripDisabledOnly: options?.stripDisabledLocales ?? false,
    },
  ) as PublicProfileLocalesInput;
  const result: PublicProfileLocalesMap = {};

  for (const [key, value] of Object.entries(filtered ?? {})) {
    if (!SUPPORTED_LOCALES.includes(key as AppLocale)) {
      if (strict) {
        throw new BadRequestException(
          `Unsupported locale in publicProfileLocales: ${key}`,
        );
      }
      continue;
    }
    if (value === undefined || value === null) continue;
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException(
        `publicProfileLocales.${key} must be an object`,
      );
    }

    const fields: PublicProfileLocaleFields = {};
    for (const field of [
      'name',
      'description',
      'tagline',
      'address',
    ] as const) {
      const rawField = value[field];
      if (rawField === undefined || rawField === null) continue;
      if (typeof rawField !== 'string') {
        throw new BadRequestException(
          `publicProfileLocales.${key}.${field} must be a string`,
        );
      }
      const trimmed = rawField.trim();
      if (!trimmed) continue;
      const max = PUBLIC_PROFILE_FIELD_MAX[field];
      if (trimmed.length > max) {
        throw new BadRequestException(
          `publicProfileLocales.${key}.${field} must be at most ${max} characters`,
        );
      }
      fields[field] = trimmed;
    }

    if (Object.keys(fields).length > 0) {
      result[key as AppLocale] = fields;
    }
  }

  return result;
}

export function applyPublicProfileLocalesToSettings(
  settings: Record<string, unknown>,
  publicProfileLocales?: PublicProfileLocalesInput,
  options?: { enabledLocales?: readonly AppLocale[] },
): Record<string, unknown> {
  if (publicProfileLocales === undefined) return settings;
  const enabledLocales =
    options?.enabledLocales ?? getBusinessEnabledLocales(settings);
  const normalized = normalizePublicProfileLocales(publicProfileLocales, {
    enabledLocales,
    strict: true,
    stripDisabledLocales: true,
  });
  const next = { ...settings };
  if (!normalized || Object.keys(normalized).length === 0) {
    delete next[SETTINGS_KEY];
  } else {
    next[SETTINGS_KEY] = normalized;
  }
  return next;
}

export function resolvePublicProfileField(
  fallback: string | undefined | null,
  locales: PublicProfileLocalesMap | undefined,
  locale: AppLocale,
  field: keyof PublicProfileLocaleFields,
): string | undefined {
  const localized = locales?.[locale]?.[field]?.trim();
  if (localized) return localized;
  const trimmed = fallback?.trim();
  return trimmed || undefined;
}
