import {
  SUPPORTED_LOCALES,
  type AppLocale,
  normalizeAppLocale,
} from '../../common/utils/business-locale.util.js';

export const BUSINESS_LANGUAGES_INTENTS = [
  'configure_business_languages',
  'explain_business_languages',
  'bulk_strip_disabled_locale_translations',
] as const;

export const BUSINESS_LANGUAGES_MUTATE_INTENTS = [
  'configure_business_languages',
  'bulk_strip_disabled_locale_translations',
] as const;

export type BusinessLanguagesIntent = (typeof BUSINESS_LANGUAGES_INTENTS)[number];

export type BusinessLanguageOperation = 'enable' | 'disable' | 'set_default';

export interface ParsedBusinessLanguages {
  operation: BusinessLanguageOperation;
  locales: AppLocale[];
}

export function isBusinessLanguagesIntent(
  action: string,
): action is BusinessLanguagesIntent {
  return (BUSINESS_LANGUAGES_INTENTS as readonly string[]).includes(action);
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
  русский: 'ru',
  русского: 'ru',
};

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
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

  const hasPackageKeyword =
    /\bpackage\b/i.test(prompt) || /(փաթեթ|пакет)/i.test(prompt);
  return (
    hasPackageKeyword &&
    (/\b(localized|locali[sz]ed|display\s+name|translation|label|names?)\b/i.test(
      prompt,
    ) ||
      /\bname\b/i.test(prompt) ||
      /(անուն|անվանում|թարգման|пакет|назван)/i.test(prompt))
  );
}

function hasLanguageSurface(prompt: string): boolean {
  return (
    /\b(language|languages|locale|locales|localization|translation|translations)\b/i.test(
      prompt,
    ) ||
    /(լեզու|լեզուներ|լեզուն|լեզվ|լեզվական|թարգմանություն)/i.test(prompt) ||
    /(язык|языки|языка|языках|локаль|перевод|переводами)/i.test(prompt) ||
    /\b(english|armenian|russian)\b/i.test(prompt) ||
    /(անգլերեն|հայերեն|ռուսերեն)/i.test(prompt) ||
    /(английск|армянск|русск)/i.test(prompt)
  );
}

function isEnableLanguagePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(enable|turn on|activate|add|allow)\b/i.test(prompt) ||
    /(միացն|միացր|ակտիվացն)/i.test(lower) ||
    /(?:^|\s)включи(?:\s|$)|(?:^|\s)включить(?:\s|$)|(?:^|\s)добав(?:ить|ь)?(?:\s|$)/i.test(
      lower,
    )
  );
}

function isCatalogTranslationCleanupPrompt(prompt: string): boolean {
  if (isSinglePackageLocalizedNamePrompt(prompt)) return false;

  const lower = prompt.toLowerCase();
  const hasCleanupVerb =
    /\b(strip|remove|delete|clean|clear|purge|drop|bulk)\b/i.test(prompt) ||
    /(հեռացր|հեռացն|մաքր|ջնջ)/i.test(lower) ||
    /(удали|удалить|очист|убери)/i.test(lower);

  if (!hasCleanupVerb) return false;

  return (
    /\b(translation|translations|localized|locali[sz]ed|localizednames?)\b/i.test(
      prompt,
    ) ||
    /\b(public\s*profile|profile\s+locales?)\b/i.test(prompt) ||
    /(թարգմանություն|լոկալ|localizednames)/i.test(prompt) ||
    /(перевод|локализ|локал|профил)/i.test(lower) ||
    (/\b(disabled|legacy|unused|turned\s+off)\b/i.test(prompt) &&
      /\b(locale|locales|language|languages)\b/i.test(prompt)) ||
    (/(անջատված)/i.test(prompt) &&
      /(լեզու|լեզուներ|լոկալ|թարգմանություն|կատալոգ)/i.test(prompt)) ||
    (/(отключ|выключ)/i.test(lower) &&
      /(язык|языки|локал|перевод|профил|услуг|пакет)/i.test(lower)) ||
    (/\b(service|services|category|categories|package|packages|catalog)\b/i.test(
      prompt,
    ) &&
      /\b(locale|locales|language|languages|disabled)\b/i.test(prompt)) ||
    (/(կատալոգ|ծառայություն|կատեգորիա|փաթեթ)/i.test(prompt) &&
      /(լեզու|լոկալ|անջատված|թարգմանություն)/i.test(prompt))
  );
}

function isDisableLanguagePrompt(prompt: string): boolean {
  if (isCatalogTranslationCleanupPrompt(prompt)) return false;

  const lower = prompt.toLowerCase();
  return (
    /\b(disable|turn off|deactivate|remove|stop|drop)\b/i.test(prompt) ||
    (/(անջատ|ապաակտիվացն)/i.test(lower) && !/անջատված/i.test(lower)) ||
    /(отключи|отключить|выключи|выключить)/i.test(lower)
  );
}

function isCatalogTranslationCreationPrompt(prompt: string): boolean {
  if (
    /\bpackage\b/i.test(prompt) &&
    !/\b(categor|categories|service|services|catalog)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(create|adding|add|new|linked)\b/i.test(prompt) &&
    /\b(category|categories|service|services|catalog|package|linked)\b/i.test(
      prompt,
    ) &&
    /\b(translation|translations|localized|locali[sz]ed|names?)\b/i.test(
      prompt,
    )
  );
}

function isSetDefaultLanguagePrompt(prompt: string): boolean {
  if (isSinglePackageLocalizedNamePrompt(prompt)) return false;

  const lower = prompt.toLowerCase();
  if (
    /\b(which|what(?:'s|\s+is)|explain|show|tell me)\b/i.test(prompt) &&
    /\b(default|primary)\b/i.test(prompt) &&
    /\b(language|languages|locale|locales)\b/i.test(prompt)
  ) {
    return false;
  }

  return (
    (/\b(set|switch|change|make|use)\b/i.test(prompt) &&
      /\b(default|primary)\b/i.test(prompt) &&
      hasLanguageSurface(prompt)) ||
    (/\b(set|switch|change|make|use)\b/i.test(prompt) &&
      /\b(default\s+language|default\s+locale)\b/i.test(prompt)) ||
    (/(սահման|լռելյա\s+լեզու|հիմնական\s+լեզու)/i.test(lower) &&
      hasLanguageSurface(prompt)) ||
    (/(установи|сделай|переключ|смени)/i.test(lower) &&
      /(язык|языки|локаль)/i.test(lower))
  );
}

export function isConfigureBusinessLanguagesPrompt(prompt: string): boolean {
  if (isSinglePackageLocalizedNamePrompt(prompt)) return false;
  if (!hasLanguageSurface(prompt)) return false;
  if (isCatalogTranslationCreationPrompt(prompt)) return false;
  if (/\b(currency|currencies|AMD|EUR|RUB|USD|dram|euro|ruble|դրամ|արժույթ|валют)\b/i.test(prompt)) {
    return false;
  }

  return (
    isEnableLanguagePrompt(prompt) ||
    isDisableLanguagePrompt(prompt) ||
    isSetDefaultLanguagePrompt(prompt)
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

function extractLocalesFromPrompt(prompt: string): AppLocale[] {
  if (/\b(all|every)\b[\s\S]{0,30}\b(language|languages|locale|locales)\b/i.test(prompt)) {
    return [...SUPPORTED_LOCALES];
  }
  if (
    /(բոլոր|ամբողջ)/i.test(prompt) &&
    /(լեզու|լեզուներ)/i.test(prompt)
  ) {
    return [...SUPPORTED_LOCALES];
  }
  if (/\b(все|всех)\b[\s\S]{0,30}\b(язык|языки|локал)/i.test(prompt)) {
    return [...SUPPORTED_LOCALES];
  }

  const segments = prompt.split(/\band\b|,|;|\/|\+|\s+և\s+|\s+и\s+/i);
  const seen = new Set<AppLocale>();
  const locales: AppLocale[] = [];

  for (const segment of segments) {
    const locale = matchLocaleToken(segment);
    if (!locale || seen.has(locale)) continue;
    seen.add(locale);
    locales.push(locale);
  }

  if (locales.length === 0) {
    for (const code of SUPPORTED_LOCALES) {
      const re = new RegExp(`\\b${code}\\b`, 'i');
      if (re.test(prompt) && !seen.has(code)) {
        seen.add(code);
        locales.push(code);
      }
    }
  }

  return locales;
}

function resolveOperation(prompt: string): BusinessLanguageOperation | null {
  if (isSetDefaultLanguagePrompt(prompt)) return 'set_default';
  if (isDisableLanguagePrompt(prompt)) return 'disable';
  if (isEnableLanguagePrompt(prompt)) return 'enable';
  return null;
}

export function parseBusinessLanguagesFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedBusinessLanguages | null {
  const operationFromParams = params.operation;
  const localesFromParams = params.locales ?? params.enabledLocales;
  const defaultFromParams = params.defaultLocale;

  if (
    operationFromParams === 'enable' ||
    operationFromParams === 'disable' ||
    operationFromParams === 'set_default'
  ) {
    const locales = Array.isArray(localesFromParams)
      ? localesFromParams
          .map((item) => normalizeAppLocale(String(item)))
          .filter((item): item is AppLocale => item !== null)
      : operationFromParams === 'set_default'
        ? [
            normalizeAppLocale(String(defaultFromParams ?? '')),
          ].filter((item): item is AppLocale => item !== null)
        : [];

    if (locales.length > 0) {
      return { operation: operationFromParams, locales };
    }
  }

  if (!isConfigureBusinessLanguagesPrompt(prompt)) return null;

  const operation = resolveOperation(prompt);
  if (!operation) return null;

  const locales = extractLocalesFromPrompt(prompt);
  if (locales.length === 0) return null;

  return { operation, locales };
}

function isBookingPageVisitorLanguageQuestion(prompt: string): boolean {
  const bookingContext =
    /\b(booking page|booking site|this page|on this page|language (?:menu|picker|switcher|selector|option)|online booking|public booking)\b/i.test(
      prompt,
    ) ||
    /\bhere\b/i.test(prompt) ||
    /(?:էջ|կայք|գրանցման)/i.test(prompt) ||
    /(?:страниц|сайт|записи)/i.test(prompt);
  const questionCue =
    /\b(why|what|which|where|how|explain|only see|don't see|do not see|cannot see|can't see|missing|gone|unavailable|not available|doesn't|does not)\b/i.test(
      prompt,
    ) ||
    /(?:ինչու|ինչ|որտեղ|բացատր|միայն)/i.test(prompt) ||
    /(?:почему|зачем|какие|какой|где|объясни|только)/i.test(prompt);

  return bookingContext && questionCue && hasLanguageSurface(prompt);
}

function isPackageDisplayNameQuestion(prompt: string): boolean {
  const hasPackage =
    /\bpackage\b/i.test(prompt) || /(փաթեթ|пакет)/i.test(prompt);
  if (!hasPackage) return false;
  return (
    /\b(display\s+name|localized|title|shown|called|named|label|titled)\b/i.test(
      prompt,
    ) ||
    (/\bname\b/i.test(prompt) &&
      /\b(what|which|show|explain|title|called|named|does|visitors?)\b/i.test(
        prompt,
      )) ||
    /(անուն|անվանում|վերնագիր|назван|называ|заголовок|отображаем)/i.test(
      prompt,
    ) ||
    (/(какое|какой|какая|объясни)/i.test(prompt) &&
      /(назван|заголовок|отображаем|пакет)/i.test(prompt))
  );
}

export function isExplainBusinessLanguagesPrompt(prompt: string): boolean {
  if (isPackageDisplayNameQuestion(prompt)) return false;
  if (isConfigureBusinessLanguagesPrompt(prompt)) return false;
  if (isCatalogTranslationCleanupPrompt(prompt)) return false;
  if (isCatalogTranslationCreationPrompt(prompt)) return false;
  if (!hasLanguageSurface(prompt)) return false;
  if (isBookingPageVisitorLanguageQuestion(prompt)) return false;
  if (/\b(currency|currencies|AMD|EUR|RUB|USD|dram|euro|ruble|դրամ|արժույթ|валют)\b/i.test(prompt)) {
    return false;
  }
  if (
    /\b(booking\s+page|public\s+booking|customer\s+app|visitor)\b/i.test(prompt) &&
    !/\b(business|salon|tenant|settings?)\b/i.test(prompt)
  ) {
    return false;
  }

  const lower = prompt.toLowerCase();

  if (
    /\b(explain|describe|show|tell me|what(?:'s|\s+is)|which)\b/i.test(prompt) &&
    /\b(language|languages|locale|locales|localization)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(which|what(?:'s|\s+is))\b/i.test(prompt) &&
    /\b(default|primary|enabled|active)\b/i.test(prompt) &&
    /\b(language|languages|locale|locales)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(enabled|default|active)\b/i.test(prompt) &&
    /\b(language|languages|locale|locales)\b/i.test(prompt) &&
    !isEnableLanguagePrompt(prompt) &&
    !isDisableLanguagePrompt(prompt) &&
    !isSetDefaultLanguagePrompt(prompt)
  ) {
    return true;
  }

  if (
    /\b(how many|count)\b/i.test(prompt) &&
    /\b(service|services|category|categories|package|packages|catalog)\b/i.test(
      prompt,
    ) &&
    /\b(translation|translations|localized|locali[sz]ed|disabled|locale|locales)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(disabled|legacy|stale|unused)\b/i.test(prompt) &&
    /\b(locale|locales|language|languages|translation|translations)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(language|languages|locale|locales)\b/i.test(prompt) &&
    /\b(overview|settings?|status|configuration)\b/i.test(prompt)
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչ|որ|բացատր|ցույց|պատմիր|կարգավորում)/i.test(prompt) &&
      /(լեզու|լեզուներ|լեզվ|լոկալ)/i.test(prompt)
    ) {
      return true;
    }
    if (
      /քանի/i.test(prompt) &&
      /(ծառայություն|կատեգորիա|փաթեթ|թարգմանություն)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(какие|какой|какая|объясни|покажи|расскажи|настройк)/i.test(lower) &&
      /(язык|языки|локаль)/i.test(lower) &&
      !/(назван|заголовок|отображаем|пакет)/i.test(lower)
    ) {
      return true;
    }
    if (
      /сколько/i.test(lower) &&
      /(услуг|категор|пакет|перевод)/i.test(lower)
    ) {
      return true;
    }
  }

  return false;
}

export function rescueBusinessLanguagesIntent(
  prompt: string,
  action: string,
): { action: BusinessLanguagesIntent; rescueReason: string } | null {
  if (isBusinessLanguagesIntent(action)) return null;
  if (!parseBusinessLanguagesFromPrompt(prompt)) return null;
  return {
    action: 'configure_business_languages',
    rescueReason: 'configure_business_languages',
  };
}

export function isBulkStripDisabledLocaleTranslationsPrompt(
  prompt: string,
): boolean {
  return isCatalogTranslationCleanupPrompt(prompt);
}

export function rescueBulkStripDisabledLocaleTranslationsIntent(
  prompt: string,
  action: string,
): { action: BusinessLanguagesIntent; rescueReason: string } | null {
  if (isBusinessLanguagesIntent(action)) return null;
  if (!isBulkStripDisabledLocaleTranslationsPrompt(prompt)) return null;
  return {
    action: 'bulk_strip_disabled_locale_translations',
    rescueReason: 'bulk_strip_disabled_locale_translations',
  };
}

export function rescueExplainBusinessLanguagesIntent(
  prompt: string,
  action: string,
): { action: BusinessLanguagesIntent; rescueReason: string } | null {
  if (isBusinessLanguagesIntent(action)) return null;
  if (!isExplainBusinessLanguagesPrompt(prompt)) return null;
  return {
    action: 'explain_business_languages',
    rescueReason: 'explain_business_languages',
  };
}
