import { isConfigureBusinessLanguagesPrompt } from './ai-business-languages.util.js';
import { isConfigurePackageLocalizedNamesPrompt } from './ai-package-localized-names.util.js';
export const MY_LOCALE_INTENTS = ['get_my_locale', 'update_my_locale'] as const;

export type MyLocaleIntent = (typeof MY_LOCALE_INTENTS)[number];

export const MY_LOCALE_CLASSIFIER_RULES = `- get_my_locale: READ — check the signed-in customer's preferred language/locale setting. Triggers: "What language is my account set to?", "Check my language setting". NOT explain_booking_languages (why the language menu shows certain locales, no account setting), NOT explain_why_sign_in (sign-in FAQ — "what language is my account set to?" is locale, not guest vs signed-in).
- update_my_locale: MUTATE — change the signed-in customer's preferred language/locale (English, Armenian, Russian). Triggers: "Switch my language to Armenian", "Set my account language to Russian", "Change my language to English". Set preferredLocale to en|hy|ru. NOT explain_booking_languages (read-only explainer), NOT explain_why_sign_in.`;

const LOCALE_NAME_MAP: Record<string, 'en' | 'hy' | 'ru'> = {
  en: 'en',
  eng: 'en',
  english: 'en',
  hy: 'hy',
  arm: 'hy',
  armenian: 'hy',
  հայերեն: 'hy',
  ru: 'ru',
  rus: 'ru',
  russian: 'ru',
  русский: 'ru',
};

/** Maps a locale code or free-text language name (e.g. "Armenian") to en|hy|ru, or null if unrecognized. */
export function normalizeRequestedLocale(
  value: unknown,
): 'en' | 'hy' | 'ru' | null {
  if (typeof value !== 'string') return null;
  const needle = value.trim().toLowerCase();
  if (!needle) return null;
  if (LOCALE_NAME_MAP[needle]) return LOCALE_NAME_MAP[needle];
  for (const [name, code] of Object.entries(LOCALE_NAME_MAP)) {
    if (name.length >= 3 && needle.includes(name)) return code;
  }
  return null;
}

const LANGUAGE_SURFACE =
  /\b(language|locale|հայերեն|русск|english|armenian|russian)\b/i;

/** e2e-bug.76 — account language read (not sign-in FAQ / my_profile). */
export function isGetMyLocalePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text || isUpdateMyLocalePrompt(text)) return false;
  if (!LANGUAGE_SURFACE.test(text)) return false;
  return (
    /\b(what|which|check|show|tell|see|is\s+my)\b/i.test(text) &&
    /\b(account|setting|set\s+to|preferred|profile)\b/i.test(text)
  );
}

/** Switch / set account language (not "what … is … set to?" reads). */
export function isUpdateMyLocalePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (!LANGUAGE_SURFACE.test(text)) return false;
  // e2e-bug.437 — this is the *personal* locale command, and it had no sibling
  // declines at all: a language word plus a change verb was enough. So the two
  // admin locale operations, which necessarily contain both, were answered by
  // changing the asking user's own account language instead:
  //
  //   "Switch default locale to Russian"        → the business default
  //   "Update English display name for … package" → a package's localised name
  //
  // Same omission as e2e-bug.431/436. Both siblings fire only on their own
  // prompts, so declining them cannot cost this detector anything.
  if (isConfigureBusinessLanguagesPrompt(text)) return false;
  if (isConfigurePackageLocalizedNamesPrompt(text)) return false;
  // "what/which language is my account set to?" is get, not update.
  if (/\b(what|which)\b/i.test(text) && /\b(set\s+to|setting)\b/i.test(text)) {
    return false;
  }
  return (
    /\b(switch|change|update|prefer)\b/i.test(text) ||
    /\bset\s+my\b/i.test(text) ||
    /\bset\s+(?:the\s+)?(?:account\s+)?language\b/i.test(text)
  );
}

export function rescueMyLocaleIntent(
  prompt: string,
  action: string,
): { action: MyLocaleIntent; rescueReason: string } | null {
  if (isUpdateMyLocalePrompt(prompt) && action !== 'update_my_locale') {
    return { action: 'update_my_locale', rescueReason: 'update_my_locale' };
  }
  if (isGetMyLocalePrompt(prompt) && action !== 'get_my_locale') {
    return { action: 'get_my_locale', rescueReason: 'get_my_locale' };
  }
  return null;
}
