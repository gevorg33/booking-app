import {
  normalizeAppLocale,
  type AppLocale,
} from '../../common/utils/business-locale.util.js';
import { isConfigureBusinessLanguagesPrompt } from './ai-business-languages.util.js';

export const PACKAGE_LOCALIZED_NAMES_INTENTS = [
  'configure_package_localized_names',
] as const;

export const PACKAGE_LOCALIZED_NAMES_MUTATE_INTENTS = [
  'configure_package_localized_names',
] as const;

export type PackageLocalizedNamesIntent =
  (typeof PACKAGE_LOCALIZED_NAMES_INTENTS)[number];

export type PackageLocalizedNameOperation = 'set' | 'clear';

export interface ParsedPackageLocalizedNames {
  operation: PackageLocalizedNameOperation;
  packageName?: string;
  packageId?: string;
  locale?: AppLocale;
  displayName?: string;
}

const LOCALE_WORD_ALIASES: Record<string, AppLocale> = {
  en: 'en',
  english: 'en',
  hy: 'hy',
  armenian: 'hy',
  ru: 'ru',
  russian: 'ru',
  անգլերեն: 'en',
  հայերեն: 'hy',
  ռուսերեն: 'ru',
  английский: 'en',
  английского: 'en',
  армянский: 'hy',
  армянского: 'hy',
  армянское: 'hy',
  русский: 'ru',
  русского: 'ru',
  русское: 'ru',
};

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasPackageLocalizedNameSurface(prompt: string): boolean {
  return (
    hasPackageKeyword(prompt) ||
    /\b(localized|locali[sz]ed|display\s+name|translation|label)\b/i.test(
      prompt,
    ) ||
    /(փաթեթ|թարգմանություն|անուն|անվանում)/i.test(prompt) ||
    /(пакет|перевод|назван)/i.test(prompt)
  );
}

function hasPackageKeyword(prompt: string): boolean {
  return /\bpackage\b/i.test(prompt) || /(փաթեթ|пакет)/i.test(prompt);
}

function isCatalogBulkTranslationContext(prompt: string): boolean {
  return (
    /\b(services?|categories?|catalog|disabled\s+locales?)\b/i.test(prompt) ||
    /(услуг|категор|пакетов|каталог|կատալոգ|ծառայություն|կատեգոր)/i.test(
      prompt,
    )
  );
}

function isSinglePackageLocalizedNamePrompt(prompt: string): boolean {
  if (isCatalogBulkTranslationContext(prompt)) return false;
  return hasPackageKeyword(prompt) && hasPackageLocalizedNameSurface(prompt);
}

function isSetPackageLocalizedNamePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(add|set|update|change|put)\b/i.test(prompt) ||
    /(ավելացր|սահման|թարմացր)/i.test(lower) ||
    /(?:^|\s)դր(?:\s|$)/i.test(lower) ||
    /(добав|добавь|установ|задай|измени|постав)/i.test(lower)
  );
}

function isClearPackageLocalizedNamePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\ball\b[\s\S]{0,20}\b(localized|locali[sz]ed|translation|names?)\b/i.test(prompt)) {
    return true;
  }
  if (/(բոլոր|ամբողջ)/i.test(prompt) && /(թարգմանություն|անուն|լոկալ)/i.test(prompt)) {
    return true;
  }
  if (/\b(все|всех)\b/i.test(lower) && /(перевод|назван|локализ)/i.test(lower)) {
    return true;
  }
  return (
    /\b(clear|remove|delete|drop|unset)\b/i.test(prompt) ||
    /(հեռացր|ջնջ|մաքր)/i.test(lower) ||
    /(удали|удалить|убери|очист)/i.test(lower)
  );
}

function isCatalogBulkTranslationPrompt(prompt: string): boolean {
  return (
    /\b(create|adding|add|new|linked)\b/i.test(prompt) &&
    /\b(category|categories|service|services|catalog)\b/i.test(prompt) &&
    /\b(translation|translations|localized|locali[sz]ed)\b/i.test(prompt)
  );
}

export function isSinglePackageLocalizedNameConfigurePrompt(
  prompt: string,
): boolean {
  return isSinglePackageLocalizedNamePrompt(prompt);
}

export function isConfigurePackageLocalizedNamesPrompt(prompt: string): boolean {
  if (isConfigureBusinessLanguagesPrompt(prompt)) return false;
  if (isCatalogBulkTranslationPrompt(prompt)) return false;
  if (!isSinglePackageLocalizedNamePrompt(prompt)) return false;

  return (
    isSetPackageLocalizedNamePrompt(prompt) ||
    isClearPackageLocalizedNamePrompt(prompt)
  );
}

function matchLocaleToken(token: string): AppLocale | null {
  const cleaned = token
    .trim()
    .toLowerCase()
    .replace(/[^a-z\u0530-\u058f\u0400-\u04ff]/gi, ' ');
  if (!cleaned) return null;

  for (const word of cleaned.split(/\s+/)) {
    const direct = normalizeAppLocale(word);
    if (direct) return direct;
    const alias = LOCALE_WORD_ALIASES[word];
    if (alias) return alias;
  }

  for (const [word, locale] of Object.entries(LOCALE_WORD_ALIASES)) {
    if (cleaned.includes(word.toLowerCase())) return locale;
  }

  return null;
}

function localeAliasMatchesPrompt(word: string, prompt: string): boolean {
  if (word.length <= 2) return false;
  if (/^[a-z]+$/i.test(word)) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(prompt);
  }
  return prompt.includes(word);
}

function extractLocaleFromPrompt(prompt: string): AppLocale | null {
  for (const code of ['en', 'hy', 'ru'] as const) {
    const re = new RegExp(`\\b${code}\\b`, 'i');
    if (re.test(prompt)) return code;
  }

  for (const [word, locale] of Object.entries(LOCALE_WORD_ALIASES)) {
    if (localeAliasMatchesPrompt(word, prompt)) return locale;
  }

  if (containsArmenianScript(prompt) && /(հայերեն|armenian)/i.test(prompt)) {
    return 'hy';
  }
  if (containsCyrillicScript(prompt) && /(русск|русское)/i.test(prompt)) {
    return 'ru';
  }
  if (/\benglish\b/i.test(prompt)) return 'en';

  return null;
}

function extractPackageNameFromPrompt(prompt: string): string | null {
  const patterns = [
    /\bfor\s+(?:the\s+)?["']([^"']+)["']\s+package\b/i,
    /\bfor\s+(?:the\s+)?([A-Za-z][\w\s&'-]{1,80}?)\s+package\b/i,
    /\bon\s+(?:the\s+)?([A-Za-z][\w\s&'-]{1,80}?)\s+package\b/i,
    /\bpackage\s+["']([^"']+)["']/i,
    /\bpackage\s+([A-Za-z][\w\s&'-]{1,80}?)(?:\s+to|\s+as|:|\s*$|\.)/i,
    /["']([^"']+)["']\s+package\b/i,
    /(?:для\s+)?пакет(?:а|е|у)?\s+([A-Za-z][\w&'-]+)/i,
    /(?:փաթեթից|пакета)\s+([A-Za-z][\w&'-]+)/i,
    /([A-Za-z][\w\s&'-]+)\s+փաթեթ(?:ի|ից)?/i,
    /(?:from|for)\s+([A-Za-z][\w\s&'-]{1,80}?)\s+package\b/i,
    /(?:փաթեթ|пакет(?:а|е|у)?)\s+([A-Za-z][\w&'-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length >= 2) return candidate;
  }

  return null;
}

function extractDisplayNameFromPrompt(prompt: string): string | null {
  const patterns = [
    /\bpackage:\s*([\u0530-\u058F\u0400-\u04FF][^\n.]+?)$/i,
    /\b(?:to|as)\s+["']([^"']+)["']/i,
    /\b(?:name|label)\s+["']([^"']+)["']/i,
    /«([^»]+)»/,
    /:\s*([\u0530-\u058F\u0400-\u04FF][^\n.]+?)(?:\s+for\s+|\s+on\s+|\s+package\b|$)/,
    /\b(?:to|as)\s+([\u0530-\u058F\u0400-\u04FF][^\n.]+?)(?:\s+for\s+|\s+on\s+|\s+package\b|$)/i,
    /\b(?:to|as)\s+([A-Za-z][\w\s&'-]{2,80})(?:\s+for\s+|\s+on\s+|\s+package\b|$)/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length >= 2) return candidate;
  }

  return null;
}

function resolveOperation(
  prompt: string,
  params: Record<string, unknown>,
): PackageLocalizedNameOperation | null {
  const fromParams = params.operation;
  if (fromParams === 'set' || fromParams === 'clear') return fromParams;
  if (isClearPackageLocalizedNamePrompt(prompt)) return 'clear';
  if (isSetPackageLocalizedNamePrompt(prompt)) return 'set';
  return null;
}

function isClearAllLocalesPrompt(prompt: string): boolean {
  return (
    /\b(all|every)\b[\s\S]{0,30}\b(localized|locali[sz]ed|translation|names?)\b/i.test(
      prompt,
    ) ||
    (/(բոլոր|ամբողջ)/i.test(prompt) &&
      /(թարգմանություն|անուն|լոկալ)/i.test(prompt)) ||
    (/(все|всех)/i.test(prompt) && /(перевод|назван|локализ)/i.test(prompt))
  );
}

export function parsePackageLocalizedNamesFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedPackageLocalizedNames | null {
  const operation = resolveOperation(prompt, params);
  if (!operation) return null;

  const packageId =
    typeof params.packageId === 'string' ? params.packageId.trim() : undefined;
  const packageNameFromParams =
    typeof params.packageName === 'string'
      ? params.packageName.trim()
      : undefined;
  const packageName =
    packageNameFromParams || extractPackageNameFromPrompt(prompt) || undefined;

  const localeFromParams = normalizeAppLocale(
    typeof params.locale === 'string' ? params.locale : null,
  );
  const locale =
    localeFromParams ?? extractLocaleFromPrompt(prompt) ?? undefined;

  const displayNameFromParams =
    typeof params.displayName === 'string'
      ? params.displayName.trim()
      : typeof params.localizedName === 'string'
        ? params.localizedName.trim()
        : undefined;
  const displayName =
    displayNameFromParams || extractDisplayNameFromPrompt(prompt) || undefined;

  if (!packageId && !packageName) return null;

  if (operation === 'clear' && isClearAllLocalesPrompt(prompt)) {
    return { operation, packageId, packageName };
  }

  if (operation === 'clear' && !locale) return null;

  if (operation === 'set') {
    if (!locale || !displayName) return null;
    return { operation, packageId, packageName, locale, displayName };
  }

  return { operation, packageId, packageName, locale };
}

export function rescuePackageLocalizedNamesIntent(
  prompt: string,
  action: string,
): { action: PackageLocalizedNamesIntent; rescueReason: string } | null {
  if ((PACKAGE_LOCALIZED_NAMES_INTENTS as readonly string[]).includes(action)) {
    return null;
  }
  if (!parsePackageLocalizedNamesFromPrompt(prompt)) return null;
  return {
    action: 'configure_package_localized_names',
    rescueReason: 'configure_package_localized_names',
  };
}
