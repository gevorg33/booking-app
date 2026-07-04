export const MY_LOCALE_INTENTS = ['get_my_locale', 'update_my_locale'] as const;

export type MyLocaleIntent = (typeof MY_LOCALE_INTENTS)[number];

export const MY_LOCALE_CLASSIFIER_RULES = `- get_my_locale: READ — check the signed-in customer's preferred language/locale setting. Triggers: "What language is my account set to?", "Check my language setting". NOT explain_booking_languages (why the language menu shows certain locales, no account setting).
- update_my_locale: MUTATE — change the signed-in customer's preferred language/locale (English, Armenian, Russian). Triggers: "Switch my language to Armenian", "Set my account language to Russian", "Change my language to English". Set preferredLocale to en|hy|ru. NOT explain_booking_languages (read-only explainer).`;

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
