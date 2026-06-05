import { BadRequestException } from '@nestjs/common';
import type { AppLocale } from './messages.js';
import { SUPPORTED_LOCALES } from './messages.js';
import { filterTranslationLocaleKeys } from '../utils/business-locale.util.js';

export const LOCALIZED_NAME_SLOTS = 3;
export const LOCALIZED_NAME_MAX_LENGTH = 120;

export type LocalizedNamesMap = Partial<Record<AppLocale, string[]>>;

export type LocalizedNamesInput = Partial<
  Record<string, string[] | undefined>
> | null;

const METADATA_KEY = 'localizedNames';

export function extractLocalizedNamesFromMetadata(
  metadata?: Record<string, unknown> | null,
): LocalizedNamesMap | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const raw = metadata[METADATA_KEY];
  if (!raw || typeof raw !== 'object') return undefined;
  const normalized = normalizeLocalizedNames(raw, {
    strict: false,
  });
  if (!normalized || Object.keys(normalized).length === 0) return undefined;
  return normalized;
}

export function normalizeLocalizedNames(
  input?: LocalizedNamesInput,
  options?: {
    strict?: boolean;
    enabledLocales?: readonly AppLocale[];
    stripDisabledLocales?: boolean;
  },
): LocalizedNamesMap | undefined {
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
  ) as LocalizedNamesInput;
  const result: LocalizedNamesMap = {};

  for (const [key, value] of Object.entries(filtered ?? {})) {
    if (!SUPPORTED_LOCALES.includes(key as AppLocale)) {
      if (strict) {
        throw new BadRequestException(
          `Unsupported locale in localizedNames: ${key}`,
        );
      }
      continue;
    }
    if (value === undefined || value === null) continue;
    if (!Array.isArray(value)) {
      throw new BadRequestException(`localizedNames.${key} must be an array`);
    }
    if (value.length > LOCALIZED_NAME_SLOTS) {
      throw new BadRequestException(
        `localizedNames.${key} supports at most ${LOCALIZED_NAME_SLOTS} names`,
      );
    }

    const names: string[] = [];
    for (const item of value) {
      if (item === undefined || item === null) continue;
      if (typeof item !== 'string') {
        throw new BadRequestException(
          `localizedNames.${key} entries must be strings`,
        );
      }
      const trimmed = item.trim();
      if (!trimmed) continue;
      if (trimmed.length > LOCALIZED_NAME_MAX_LENGTH) {
        throw new BadRequestException(
          `localizedNames.${key} entries must be at most ${LOCALIZED_NAME_MAX_LENGTH} characters`,
        );
      }
      names.push(trimmed);
    }

    if (names.length > 0) {
      result[key as AppLocale] = names;
    }
  }

  return result;
}

export function applyLocalizedNamesToMetadata(
  metadata: Record<string, unknown>,
  localizedNames?: LocalizedNamesInput,
  options?: { enabledLocales?: readonly AppLocale[] },
): Record<string, unknown> {
  if (localizedNames === undefined) return metadata;
  const enabledLocales = options?.enabledLocales ?? [...SUPPORTED_LOCALES];
  const normalized = normalizeLocalizedNames(localizedNames, {
    enabledLocales,
    strict: true,
    stripDisabledLocales: true,
  });
  const next = { ...metadata };
  if (!normalized || Object.keys(normalized).length === 0) {
    delete next[METADATA_KEY];
  } else {
    next[METADATA_KEY] = normalized;
  }
  return next;
}

export function resolveLocalizedDisplayName(
  fallbackName: string,
  localizedNames: LocalizedNamesMap | undefined,
  locale: AppLocale,
): string {
  const candidates = localizedNames?.[locale];
  if (candidates) {
    for (const name of candidates) {
      if (name?.trim()) return name.trim();
    }
  }
  return fallbackName;
}

export function collectLocalizedNameAliases(
  fallbackName: string,
  localizedNames?: LocalizedNamesMap,
): string[] {
  const aliases = new Set<string>();
  const primary = fallbackName.trim();
  if (primary) aliases.add(primary);

  if (localizedNames) {
    for (const names of Object.values(localizedNames)) {
      for (const name of names ?? []) {
        const trimmed = name?.trim();
        if (trimmed) aliases.add(trimmed);
      }
    }
  }

  return [...aliases];
}
