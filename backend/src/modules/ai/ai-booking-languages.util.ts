import {
  isConfigureBusinessLanguagesPrompt,
  isExplainBusinessLanguagesPrompt,
} from './ai-business-languages.util.js';

export const BOOKING_LANGUAGES_INTENTS = [
  'explain_booking_languages',
] as const;

export type BookingLanguagesIntent = (typeof BOOKING_LANGUAGES_INTENTS)[number];

export function isBookingLanguagesIntent(
  action: string,
): action is BookingLanguagesIntent {
  return (BOOKING_LANGUAGES_INTENTS as readonly string[]).includes(action);
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasLanguageSurface(prompt: string): boolean {
  return (
    /\b(language|languages|locale|locales|localization)\b/i.test(prompt) ||
    /(լեզու|լեզուներ|լեզվ)/i.test(prompt) ||
    /(язык|языки|языка|локаль)/i.test(prompt) ||
    /\b(english|armenian|russian)\b/i.test(prompt) ||
    /(անգլերեն|հայերեն|ռուսերեն)/i.test(prompt) ||
    /(английск|армянск|русск)/i.test(prompt) ||
    /\b(en|hy|ru)\b/i.test(prompt)
  );
}

function hasBookingPageVisitorContext(prompt: string): boolean {
  return (
    /\b(booking page|booking site|this page|on this page|language (?:menu|picker|switcher|selector|option)|online booking|public booking)\b/i.test(
      prompt,
    ) ||
    /\bhere\b/i.test(prompt) ||
    /(?:էջ|կայք|գրանցման|լեզու)/i.test(prompt) ||
    /(?:страниц|сайт|записи|язык|меню)/i.test(prompt)
  );
}

function hasLanguageQuestionCue(prompt: string): boolean {
  return (
    /\b(why|what|which|where|how|explain|only see|don't see|do not see|cannot see|can't see|missing|gone|unavailable|not available)\b/i.test(
      prompt,
    ) ||
    /(?:ինչու|ինչ|որտեղ|բացատր|միայն|չեմ|չկա)/i.test(prompt) ||
    /(?:почему|зачем|какие|какой|где|объясни|только|нет|не\s+вижу)/i.test(
      prompt,
    )
  );
}

function mentionsLimitedLanguageVisibility(prompt: string): boolean {
  return (
    /\bonly\s+see\b/i.test(prompt) ||
    (/\b(?:do not|don't|cannot|can't)\s+see\b/i.test(prompt) &&
      hasLanguageSurface(prompt)) ||
    /\bno\s+(?:russian|armenian|english)\b/i.test(prompt) ||
    /\b(?:missing|gone|unavailable|not available)\b/i.test(prompt) ||
    /(?:միայն|չկա|չեմ\s+տեսնում)/i.test(prompt) ||
    /(?:только|нет|не\s+вижу)/i.test(prompt)
  );
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
      /\b(what|which|show|explain|title|called|named)\b/i.test(prompt)) ||
    /(անուն|անվանում|վերնագիր|назван|называ|заголовок|отображаем)/i.test(
      prompt,
    ) ||
    (/(какое|какой|какая|объясни)/i.test(prompt) &&
      /(назван|заголовок|отображаем|пакет)/i.test(prompt))
  );
}

export function isExplainBookingLanguagesPrompt(prompt: string): boolean {
  if (isPackageDisplayNameQuestion(prompt)) return false;
  if (isConfigureBusinessLanguagesPrompt(prompt)) return false;
  if (isExplainBusinessLanguagesPrompt(prompt)) return false;
  if (
    /\b(currency|currencies|AMD|EUR|RUB|USD|dram|euro|ruble|դրամ|արժույթ|валют|€|֏|₽)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (!hasLanguageSurface(prompt)) return false;

  const bookingContext = hasBookingPageVisitorContext(prompt);
  const limitedVisibility = mentionsLimitedLanguageVisibility(prompt);
  const questionCue = hasLanguageQuestionCue(prompt);

  if (limitedVisibility && (bookingContext || questionCue)) {
    return true;
  }

  if (bookingContext && questionCue) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչու|ինչ|որտեղ|բացատր)/i.test(prompt) &&
      /(լեզու|էջ|կայք|անգլերեն|հայերեն|ռուսերեն)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(почему|зачем|какие|какой|где|объясни)/i.test(prompt) &&
      /(язык|страниц|сайт|записи|английск|армянск|русск)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function rescueBookingLanguagesIntent(
  prompt: string,
  action: string,
): { action: BookingLanguagesIntent; rescueReason: string } | null {
  if (isBookingLanguagesIntent(action)) return null;
  if (!isExplainBookingLanguagesPrompt(prompt)) return null;
  return {
    action: 'explain_booking_languages',
    rescueReason: 'explain_booking_languages',
  };
}
