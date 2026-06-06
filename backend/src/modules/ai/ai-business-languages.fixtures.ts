/** Dashboard classifier rules for tenant language enablement (ai-cmd-lang-1..4). */
export const BUSINESS_LANGUAGES_CLASSIFIER_RULES = `- configure_business_languages: MUTATE — enable or disable customer-facing languages (en, hy, ru) and set the business default locale. Triggers: enable/turn on/add + Armenian|Russian|English; disable/turn off/remove + language; set/switch/make + default language/locale. Updates settings.enabledLocales and settings.defaultLocale. NOT configure_business_currency (ISO money code), NOT explain_business_languages (read-only status), and NOT bulk_strip_disabled_locale_translations (cleanup translations).
- explain_business_languages: READ — explain enabled locales, default locale, and how many active services, categories, and packages still have localizedNames translations in locales that are no longer enabled. Triggers: what/which/explain/show + language settings; enabled/default locale questions; how many catalog items have translations in disabled locales. NOT configure_business_languages (mutate), NOT explain_booking_languages (customer booking page visitor locale), and NOT catalog translation creation prompts.
- bulk_strip_disabled_locale_translations: MUTATE — remove localizedNames from active services, categories, and packages plus publicProfileLocales keys for locales that are no longer enabled. Requires user confirmation before updating rows. Triggers: strip/remove/clean/clear + disabled locale translations; bulk cleanup of legacy localized names. NOT configure_business_languages (change enabled locales), and NOT explain_business_languages (read-only counts).
- Examples (configure):
  - "Enable Armenian and Russian" → configure_business_languages, operation=enable, locales=[hy, ru]
  - "Turn off Russian for our salon" → configure_business_languages, operation=disable, locales=[ru]
  - "Set default language to English" → configure_business_languages, operation=set_default, defaultLocale=en
  - "Add Russian as an enabled language" → configure_business_languages, operation=enable, locales=[ru]
  - "Make Armenian the default language" → configure_business_languages, operation=set_default, defaultLocale=hy
  - "Enable all languages for our booking site" → configure_business_languages, operation=enable, locales=[en, hy, ru]
  - "Միացրու հայերեն և ռուսերեն" → configure_business_languages, operation=enable, locales=[hy, ru]
  - "Отключи русский для салона" → configure_business_languages, operation=disable, locales=[ru]
  - "Установи английский язык по умолчанию" → configure_business_languages, operation=set_default, defaultLocale=en
- Examples (explain):
  - "What languages are enabled for our salon?" → explain_business_languages
  - "Explain our language settings" → explain_business_languages
  - "Which is the default language?" → explain_business_languages
  - "How many services have translations in disabled locales?" → explain_business_languages
  - "Show enabled locales and default language" → explain_business_languages
  - "Ինչ լեզուներ են միացված մեր սալոնում" → explain_business_languages
  - "Объясни настройки языков салона" → explain_business_languages
- Examples (bulk strip):
  - "Strip translations for disabled locales from our catalog" → bulk_strip_disabled_locale_translations
  - "Remove localized names in locales we turned off" → bulk_strip_disabled_locale_translations
  - "Clean up legacy translations in disabled languages" → bulk_strip_disabled_locale_translations
  - "Bulk remove Russian translations from services and packages" → bulk_strip_disabled_locale_translations
  - "Clear disabled locale keys from public profile translations" → bulk_strip_disabled_locale_translations
  - "Հեռացրու անջատված լեզուների թարգմանությունները կատալոգից" → bulk_strip_disabled_locale_translations
  - "Удали переводы на отключённых языках из услуг и пакетов" → bulk_strip_disabled_locale_translations`;

export const BULK_STRIP_DISABLED_LOCALE_TRANSLATIONS_PROMPTS = [
  {
    id: 'strip-disabled-catalog',
    prompt: 'Strip translations for disabled locales from our catalog',
  },
  {
    id: 'remove-localized-turned-off',
    prompt: 'Remove localized names in locales we turned off',
  },
  {
    id: 'cleanup-legacy-disabled',
    prompt: 'Clean up legacy translations in disabled languages',
  },
  {
    id: 'bulk-remove-ru-catalog',
    prompt: 'Bulk remove Russian translations from services and packages',
  },
  {
    id: 'clear-public-profile-disabled',
    prompt: 'Clear disabled locale keys from public profile translations',
  },
  {
    id: 'purge-stale-localized-names',
    prompt: 'Purge stale localizedNames for disabled locales from the catalog',
  },
  {
    id: 'delete-disabled-locale-translations',
    prompt:
      'Delete service, category, and package translations in disabled locales',
  },
  {
    id: 'strip-unused-locale-overrides',
    prompt: 'Strip unused locale translation overrides we no longer support',
  },
  {
    id: 'cleanup-catalog-disabled-locales',
    prompt: 'Clean up catalog translations for locales that are disabled',
  },
  {
    id: 'remove-legacy-profile-locales',
    prompt:
      'Remove public profile locale content for languages that are turned off',
  },
  {
    id: 'hy-strip-disabled-catalog',
    prompt: 'Հեռացրու անջատված լեզուների թարգմանությունները կատալոգից',
  },
  {
    id: 'hy-clean-legacy-translations',
    prompt: 'Մաքրի՛ր հին թարգմանությունները անջատված լեզուներով',
  },
  {
    id: 'hy-delete-disabled-localized',
    prompt: 'Ջնջի՛ր localizedNames-ը անջատված լեզուների համար',
  },
  {
    id: 'ru-strip-disabled-catalog',
    prompt: 'Удали переводы на отключённых языках из услуг и пакетов',
  },
  {
    id: 'ru-clean-legacy-translations',
    prompt: 'Очисти устаревшие переводы для отключённых языков',
  },
  {
    id: 'ru-clear-profile-disabled',
    prompt: 'Убери локали профиля для отключённых языков',
  },
] as const;

export const EXPLAIN_BUSINESS_LANGUAGES_PROMPTS = [
  {
    id: 'what-languages-enabled',
    prompt: 'What languages are enabled for our salon?',
  },
  {
    id: 'explain-language-settings',
    prompt: 'Explain our language settings',
  },
  {
    id: 'which-default-language',
    prompt: 'Which is the default language?',
  },
  {
    id: 'disabled-locale-service-translations',
    prompt: 'How many services have translations in disabled locales?',
  },
  {
    id: 'enabled-locales-default',
    prompt: 'Show enabled locales and default language',
  },
  {
    id: 'language-settings-overview',
    prompt: 'Language settings overview for the business',
  },
  {
    id: 'stale-catalog-translations',
    prompt:
      'Do any categories or packages still have translations in disabled locales?',
  },
  {
    id: 'count-disabled-locale-catalog',
    prompt:
      'Count services, categories, and packages with translations in disabled languages',
  },
  {
    id: 'default-locale-status',
    prompt: 'What is our default locale and which languages are active?',
  },
  {
    id: 'legacy-localized-names',
    prompt: 'Any legacy localized names in locales we turned off?',
  },
  {
    id: 'hy-what-enabled',
    prompt: 'Ինչ լեզուներ են միացված մեր սալոնում',
  },
  {
    id: 'hy-explain-settings',
    prompt: 'Բացատրի՛ր մեր լեզվական կարգավորումները',
  },
  {
    id: 'hy-disabled-translations',
    prompt: 'Քանի ծառայություն ունի թարգմանություն անջատված լեզուներով',
  },
  {
    id: 'ru-explain-settings',
    prompt: 'Объясни настройки языков салона',
  },
  {
    id: 'ru-which-default',
    prompt: 'Какой язык по умолчанию у салона?',
  },
  {
    id: 'ru-disabled-translations',
    prompt: 'Сколько услуг с переводами на отключённых языках?',
  },
] as const;

export const CONFIGURE_BUSINESS_LANGUAGES_PROMPTS = [
  {
    id: 'enable-hy-ru',
    prompt: 'Enable Armenian and Russian',
    operation: 'enable' as const,
    locales: ['hy', 'ru'] as const,
  },
  {
    id: 'disable-ru-salon',
    prompt: 'Turn off Russian for our salon',
    operation: 'disable' as const,
    locales: ['ru'] as const,
  },
  {
    id: 'set-default-en',
    prompt: 'Set default language to English',
    operation: 'set_default' as const,
    locales: ['en'] as const,
  },
  {
    id: 'add-russian-enabled',
    prompt: 'Add Russian as an enabled language',
    operation: 'enable' as const,
    locales: ['ru'] as const,
  },
  {
    id: 'disable-armenian-customers',
    prompt: 'Disable Armenian for customers',
    operation: 'disable' as const,
    locales: ['hy'] as const,
  },
  {
    id: 'make-hy-default',
    prompt: 'Make Armenian the default language',
    operation: 'set_default' as const,
    locales: ['hy'] as const,
  },
  {
    id: 'enable-all-languages',
    prompt: 'Enable all languages for our booking site',
    operation: 'enable' as const,
    locales: ['en', 'hy', 'ru'] as const,
  },
  {
    id: 'turn-off-english',
    prompt: 'Turn off English language support',
    operation: 'disable' as const,
    locales: ['en'] as const,
  },
  {
    id: 'switch-default-ru',
    prompt: 'Switch default locale to Russian',
    operation: 'set_default' as const,
    locales: ['ru'] as const,
  },
  {
    id: 'enable-armenian-booking',
    prompt: 'Enable Armenian on our booking site',
    operation: 'enable' as const,
    locales: ['hy'] as const,
  },
  {
    id: 'hy-enable-hy-ru',
    prompt: 'Միացրու հայերեն և ռուսերեն լեզուները',
    operation: 'enable' as const,
    locales: ['hy', 'ru'] as const,
  },
  {
    id: 'hy-disable-ru',
    prompt: 'Անջատի՛ր ռուսերենը մեր սալոնում',
    operation: 'disable' as const,
    locales: ['ru'] as const,
  },
  {
    id: 'hy-default-en',
    prompt: 'Սահմանի՛ր լռելյայի լեզուն անգլերեն',
    operation: 'set_default' as const,
    locales: ['en'] as const,
  },
  {
    id: 'ru-enable-hy-ru',
    prompt: 'Включи армянский и русский языки',
    operation: 'enable' as const,
    locales: ['hy', 'ru'] as const,
  },
  {
    id: 'ru-disable-ru',
    prompt: 'Отключи русский для нашего салона',
    operation: 'disable' as const,
    locales: ['ru'] as const,
  },
  {
    id: 'ru-default-en',
    prompt: 'Установи английский язык по умолчанию',
    operation: 'set_default' as const,
    locales: ['en'] as const,
  },
] as const;
