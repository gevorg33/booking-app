/** Dashboard classifier rules for package public display names (ai-cmd-lang-7). */
export const DASHBOARD_PACKAGE_DISPLAY_NAME_CLASSIFIER_RULES = `- explain_package_display_name: READ — explain which localized display name the public booking page shows for one service package given a visitor locale (resolved through enabledLocales with primary catalog name fallback). Triggers: what/which/show/explain + package + display name/title/shown + visitor locale or booking page context. NOT configure_package_localized_names (mutate translations), NOT explain_business_languages (tenant language settings counts), and NOT explain_booking_languages (language menu visibility).
- Examples:
  - "What name do Russian visitors see for the Spa Day package on public booking?" → explain_package_display_name, packageName=Spa Day, locale=ru
  - "Which localized display name shows for Wellness package in Armenian?" → explain_package_display_name, packageName=Wellness, locale=hy
  - "Does Bridal package use the primary English name on the booking page?" → explain_package_display_name, packageName=Bridal, locale=en
  - "Show what Spa Day package is titled in Armenian for visitors" → explain_package_display_name, packageName=Spa Day, locale=hy
  - "Explain package display name for Bridal in Russian on online booking" → explain_package_display_name, packageName=Bridal, locale=ru`;

/** Public booking classifier rules for package display names (ai-cmd-lang-7). */
export const PUBLIC_PACKAGE_DISPLAY_NAME_CLASSIFIER_RULES = `- explain_package_display_name: READ — explain which localized title this booking page shows for a service package in the visitor's language (primary catalog name when no translation exists). Uses resolveLocalizedDisplayName with the visitor locale. NOT configure_package_localized_names (admin mutate), NOT explain_booking_languages (language picker), and NOT explain_package_currency (totals currency).
- Examples:
  - "What is the Armenian name for the Spa Day package on this page?" → explain_package_display_name, packageName=Spa Day, locale=hy
  - "Why does the wellness package show a different title in Russian?" → explain_package_display_name, packageName=Wellness, locale=ru
  - "I'm viewing in English — what name does the Spa Day package use?" → explain_package_display_name, packageName=Spa Day, locale=en
  - "Почему пакет Spa Day называется по-армянски на этой странице?" → explain_package_display_name, packageName=Spa Day
  - "Ինչ անուն է ցուցադրվում Spa Day փաթեթի համար հայերենով" → explain_package_display_name, packageName=Spa Day, locale=hy`;

export const EXPLAIN_PACKAGE_DISPLAY_NAME_PROMPTS = [
  {
    id: 'dash-ru-spa-day',
    prompt:
      'What name do Russian visitors see for the Spa Day package on public booking?',
    packageName: 'Spa Day',
    locale: 'ru' as const,
    surface: 'dashboard' as const,
  },
  {
    id: 'dash-hy-wellness',
    prompt:
      'Which localized display name shows for Wellness package in Armenian?',
    packageName: 'Wellness',
    locale: 'hy' as const,
    surface: 'dashboard' as const,
  },
  {
    id: 'dash-en-bridal-fallback',
    prompt:
      'Does Bridal package use the primary English name on the booking page?',
    packageName: 'Bridal',
    locale: 'en' as const,
    surface: 'dashboard' as const,
  },
  {
    id: 'dash-show-hy-spa-day',
    prompt: 'Show what Spa Day package is titled in Armenian for visitors',
    packageName: 'Spa Day',
    locale: 'hy' as const,
    surface: 'dashboard' as const,
  },
  {
    id: 'dash-explain-ru-bridal',
    prompt:
      'Explain package display name for Bridal in Russian on online booking',
    packageName: 'Bridal',
    locale: 'ru' as const,
    surface: 'dashboard' as const,
  },
  {
    id: 'public-hy-spa-day',
    prompt: 'What is the Armenian name for the Spa Day package on this page?',
    packageName: 'Spa Day',
    locale: 'hy' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-ru-wellness',
    prompt: 'Why does the Wellness package show a different title in Russian?',
    packageName: 'Wellness',
    locale: 'ru' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-en-spa-day',
    prompt: "I'm viewing in English — what name does the Spa Day package use?",
    packageName: 'Spa Day',
    locale: 'en' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-ru-spa-armenian',
    prompt: 'Почему пакет Spa Day называется по-армянски на этой странице?',
    packageName: 'Spa Day',
    surface: 'public' as const,
  },
  {
    id: 'public-hy-spa-day-title',
    prompt: 'Ինչ անուն է ցուցադրվում Spa Day փաթեթի համար հայերենով',
    packageName: 'Spa Day',
    locale: 'hy' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-what-title-bridal',
    prompt: 'What title does the Bridal package show here?',
    packageName: 'Bridal',
    surface: 'public' as const,
  },
  {
    id: 'dash-fallback-wellness-en',
    prompt:
      'On public booking, what display name do English visitors get for Wellness package?',
    packageName: 'Wellness',
    locale: 'en' as const,
    surface: 'dashboard' as const,
  },
] as const;
