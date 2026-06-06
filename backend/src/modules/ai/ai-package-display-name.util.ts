import {
  normalizeAppLocale,
  type AppLocale,
} from '../../common/utils/business-locale.util.js';
import { isConfigurePackageLocalizedNamesPrompt } from './ai-package-localized-names.util.js';
import { isExplainBookingLanguagesPrompt } from './ai-booking-languages.util.js';
import { isExplainBusinessLanguagesPrompt } from './ai-business-languages.util.js';

export const PACKAGE_DISPLAY_NAME_INTENTS = [
  'explain_package_display_name',
] as const;

export type PackageDisplayNameIntent =
  (typeof PACKAGE_DISPLAY_NAME_INTENTS)[number];

export interface ParsedPackageDisplayNameExplain {
  packageName?: string;
  packageId?: string;
  queryLocale?: AppLocale;
}

function hasPackageKeyword(prompt: string): boolean {
  return /\bpackage\b/i.test(prompt) || /(փաթեթ|пакет)/i.test(prompt);
}

function hasPackageDisplayNameSurface(prompt: string): boolean {
  return (
    /\b(display\s+name|localized\s+name|localized\s+title|title|titled|shown|showing|called|named|label)\b/i.test(
      prompt,
    ) ||
    /\bname\b/i.test(prompt) ||
    /(անուն|անվանում|վերնագիր|թարգման|назван|называ|заголовок|отображаем)/i.test(
      prompt,
    )
  );
}

function hasReadPackageDisplayCue(prompt: string): boolean {
  return (
    /\b(what|which|why|how|does|do|show|shows|explain|tell|see|displayed|shown|titled|title|fall\s*back|primary|visitor|visitors|booking\s+page|public\s+booking|this\s+page|online\s+booking|here|get)\b/i.test(
      prompt,
    ) ||
    /(ինչ|որտեղ|բացատր|ցուցադր|ցույց|անուն|վերնագիր)/i.test(prompt) ||
    /(почему|какое|какой|какая|какие|объясни|покажи|показывает|называ|посетител)/i.test(
      prompt,
    )
  );
}

function hasBookingPageVisitorContext(prompt: string): boolean {
  return (
    /\b(booking page|booking site|public booking|online booking|this page|on this page|here|visitors?)\b/i.test(
      prompt,
    ) ||
    /(?:էջ|կայք|գրանցման|այս)/i.test(prompt) ||
    /(?:страниц|сайт|записи|здесь)/i.test(prompt)
  );
}

const LOCALE_WORD_ALIASES: Record<string, AppLocale> = {
  english: 'en',
  armenian: 'hy',
  russian: 'ru',
  անգլերեն: 'en',
  հայերեն: 'hy',
  ռուսերեն: 'ru',
  английский: 'en',
  армянский: 'hy',
  русский: 'ru',
  русском: 'ru',
  'по-армянски': 'hy',
  'по-русски': 'ru',
};

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
    if (new RegExp(`\\b${code}\\b`, 'i').test(prompt)) return code;
  }

  for (const [word, locale] of Object.entries(LOCALE_WORD_ALIASES)) {
    if (localeAliasMatchesPrompt(word, prompt)) return locale;
  }

  if (/\benglish\b/i.test(prompt)) return 'en';
  if (/\barmenian\b/i.test(prompt)) return 'hy';
  if (/\brussian\b/i.test(prompt)) return 'ru';

  // Russian inflected forms: «армянском языке», «русскоязычные посетители», etc.
  if (/(английск|english)/i.test(prompt)) return 'en';
  if (/(армянск|armenian)/i.test(prompt)) return 'hy';
  if (/(русск|russian)/i.test(prompt)) return 'ru';

  return null;
}

function normalizePackageNameCandidate(candidate: string): string | null {
  let name = candidate.trim();
  for (let i = 0; i < 3; i += 1) {
    const next = name
      .replace(
        /^(?:does|do|what|which|show|explain|the|a|an|for|on)\s+/i,
        '',
      )
      .trim();
    if (next === name) break;
    name = next;
  }
  return name.length >= 2 ? name : null;
}

function extractPackageNameFromPrompt(prompt: string): string | null {
  const patterns = [
    /\bpackage\s+display\s+name\s+for\s+([A-Za-z][\w\s&'-]+?)(?:\s+in|\s+on|$)/i,
    /\bfor\s+(?:the\s+)?["']([^"']+)["']\s+package\b/i,
    /\bfor\s+(?:the\s+)?([A-Za-z][\w\s&'-]{1,80}?)\s+package\b/i,
    /\bthe\s+([A-Za-z][\w\s&'-]{1,80}?)\s+package\b/i,
    /\b([A-Za-z][\w\s&'-]{1,80}?)\s+package\b/i,
    /\bpackage\s+["']([^"']+)["']/i,
    /["']([^"']+)["']\s+package\b/i,
    /(?:для\s+)?пакет(?:а|е|у)?\s+([A-Za-z][\w\s&'-]+?)(?:\s+на|\s+в|\s+для|:|$)/i,
    /пакет\s+([A-Za-z][\w\s&'-]+?)(?:\s+на|\s+в|\s+для|:|$)/i,
    /имя\s+пакета\s+([A-Za-z][\w&'-]+)/i,
    /(?:փաթեթից|пакета)\s+([A-Za-z][\w&'-]+)/i,
    /([A-Za-z][\w\s&'-]+?)\s+փաթեթ(?:ի|ից)?/i,
    /(?:show|title)\s+(?:what\s+)?([A-Za-z][\w\s&'-]+?)\s+package/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = normalizePackageNameCandidate(match?.[1] ?? '');
    if (candidate) return candidate;
  }

  return null;
}

function hasPackageCurrencyCue(prompt: string): boolean {
  return (
    /\b(currency|dram|drams|total|price|amount|priced?|€|֏|₽|\$|AMD|EUR|RUB|USD)\b/i.test(
      prompt,
    ) ||
    /[€֏₽$]/.test(prompt) ||
    /(արժույթ|գումար|գին|валют|драм|рубл|евро)/i.test(prompt)
  );
}

export function isExplainPackageDisplayNamePrompt(prompt: string): boolean {
  if (hasPackageCurrencyCue(prompt)) return false;
  if (isConfigurePackageLocalizedNamesPrompt(prompt)) return false;
  if (isExplainBusinessLanguagesPrompt(prompt)) return false;
  if (isExplainBookingLanguagesPrompt(prompt)) return false;

  if (!hasPackageKeyword(prompt)) return false;
  if (!hasPackageDisplayNameSurface(prompt)) return false;
  if (!hasReadPackageDisplayCue(prompt)) return false;

  return true;
}

export function parsePackageDisplayNameExplainFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedPackageDisplayNameExplain | null {
  if (!isExplainPackageDisplayNamePrompt(prompt)) return null;

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
  const queryLocale =
    localeFromParams ?? extractLocaleFromPrompt(prompt) ?? undefined;

  if (!packageId && !packageName) return null;

  return { packageId, packageName, queryLocale };
}

export function rescuePackageDisplayNameIntent(
  prompt: string,
  action: string,
): { action: PackageDisplayNameIntent; rescueReason: string } | null {
  if ((PACKAGE_DISPLAY_NAME_INTENTS as readonly string[]).includes(action)) {
    return null;
  }
  if (!parsePackageDisplayNameExplainFromPrompt(prompt)) return null;
  return {
    action: 'explain_package_display_name',
    rescueReason: 'explain_package_display_name',
  };
}
