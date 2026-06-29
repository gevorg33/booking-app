import type { AppLocale } from '../../common/i18n/messages.js';
import type {
  LocalizedNamesInput,
  LocalizedNamesMap,
} from '../../common/i18n/service-localized-names.util.js';
import { normalizeLocalizedNames } from '../../common/i18n/service-localized-names.util.js';
import { parseLocalizedNamesFromPrompt } from './ai-catalog.util.js';

/** Locales auto-filled on create_service when enabled for the business. */
export const AUTO_SERVICE_TRANSLATION_LOCALES: readonly AppLocale[] = ['hy', 'ru'];

export function mergeServiceLocalizedNames(
  ...maps: Array<LocalizedNamesMap | undefined>
): LocalizedNamesMap | undefined {
  const merged: LocalizedNamesMap = {};
  for (const map of maps) {
    if (!map) continue;
    for (const [locale, names] of Object.entries(map)) {
      const cleaned = names?.map((name) => name.trim()).filter(Boolean);
      if (cleaned?.length) {
        merged[locale as AppLocale] = cleaned;
      }
    }
  }
  return Object.keys(merged).length ? merged : undefined;
}

export function readExplicitServiceLocalizedNames(
  params: Record<string, unknown> | undefined,
  prompt: string | undefined,
  enabledLocales: readonly AppLocale[],
): LocalizedNamesMap | undefined {
  const fromParams = normalizeLocalizedNames(
    params?.localizedNames as LocalizedNamesInput,
    {
      strict: false,
      enabledLocales,
      stripDisabledLocales: true,
    },
  );
  const fromPrompt = prompt ? parseLocalizedNamesFromPrompt(prompt) : undefined;
  return mergeServiceLocalizedNames(fromParams, fromPrompt);
}

export function missingServiceTranslationLocales(
  enabledLocales: readonly AppLocale[],
  existing?: LocalizedNamesMap,
): AppLocale[] {
  return AUTO_SERVICE_TRANSLATION_LOCALES.filter(
    (locale) =>
      enabledLocales.includes(locale) && !existing?.[locale]?.[0]?.trim(),
  );
}
