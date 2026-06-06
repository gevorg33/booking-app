/** Customer/public classifier rules for booking-page language visibility (ai-cmd-lang-5). */
export const BOOKING_LANGUAGES_CLASSIFIER_RULES = `- explain_booking_languages: READ — explain why the booking page language menu only shows certain locales (e.g. English and Armenian but not Russian). Uses the salon settings.enabledLocales and settings.defaultLocale; visitor locale is resolved when it matches an enabled language. NOT explain_business_languages (dashboard admin language settings and catalog translation counts), NOT configure_business_languages (mutate enabled locales), and NOT explain_checkout_currency (price currency display).
- Examples:
  - "Why can I only see English and Armenian on the booking page?" → explain_booking_languages
  - "Why isn't Russian available on this booking site?" → explain_booking_languages
  - "What languages can I use on this page?" → explain_booking_languages
  - "Where did the Russian language option go?" → explain_booking_languages
  - "Почему на странице записи только английский и армянский?" → explain_booking_languages
  - "Ինչու՞ այս էջում միայն անգլերենն ու հայերենն են" → explain_booking_languages`;

export const EXPLAIN_BOOKING_LANGUAGES_PROMPTS = [
  {
    id: 'why-only-en-hy',
    prompt: 'Why can I only see English and Armenian on the booking page?',
  },
  {
    id: 'why-no-russian',
    prompt: "Why isn't Russian available on this booking site?",
  },
  {
    id: 'where-russian-option',
    prompt: 'Where did the Russian language option go?',
  },
  {
    id: 'what-languages-page',
    prompt: 'What languages can I use on this page?',
  },
  {
    id: 'language-picker-missing-ru',
    prompt: "Why doesn't the language picker show Russian?",
  },
  {
    id: 'only-two-languages-here',
    prompt: 'Why do I only see two languages here?',
  },
  {
    id: 'ru-only-en-hy-booking',
    prompt: 'Почему на странице записи только английский и армянский?',
  },
  {
    id: 'ru-no-russian-site',
    prompt: 'Почему нет русского языка на сайте записи?',
  },
  {
    id: 'ru-which-languages-page',
    prompt: 'Какие языки доступны на этой странице?',
  },
  {
    id: 'hy-only-en-hy-page',
    prompt: 'Ինչու՞ այս էջում միայն անգլերենն ու հայերենն են',
  },
  {
    id: 'hy-which-languages-booking',
    prompt: 'Ինչ լեզուներ կարող եմ օգտագործել գրանցման էջում',
  },
] as const;
