/** Dashboard classifier rules for package localized display names (ai-cmd-lang-6). */
export const PACKAGE_LOCALIZED_NAMES_CLASSIFIER_RULES = `- configure_package_localized_names: MUTATE — set or clear localized display names for one service package in enabled locales only. Triggers: add/set/update + Armenian|Russian|English + name/display/translation + package; clear/remove/delete + localized name + package. Updates package.metadata.localizedNames via enabledLocales filter. NOT create_package / update_package (general CRUD), NOT configure_business_languages (tenant locale settings), NOT explain_package_display_name (read which name visitors see), and NOT bulk category+service translation creation.
- Examples:
  - "Add Armenian name for Spa Day package" → configure_package_localized_names (needs displayName clarify if missing)
  - "Set Russian display name for Wellness package to Спа день" → configure_package_localized_names, operation=set, locale=ru
  - "Clear Armenian localized name for Spa Day package" → configure_package_localized_names, operation=clear, locale=hy
  - "Remove all localized names from Bridal package" → configure_package_localized_names, operation=clear
  - "Ավելացրի՛ր հայերեն անուն «Սպա օր» Spa Day փաթեթի համար" → configure_package_localized_names, locale=hy
  - "Установи русское название для пакета Wellness: Спа день" → configure_package_localized_names, locale=ru`;

/** `displayName` is absent for `clear` operations and for the prompts that
 * only ask which locales exist. */
export type ConfigurePackageLocalizedNamesPromptFixture = {
  id: string;
  prompt: string;
  operation: 'clear' | 'set';
  packageName: string;
  locale?: 'en' | 'hy' | 'ru';
  displayName?: string;
};

export const CONFIGURE_PACKAGE_LOCALIZED_NAMES_PROMPTS: readonly ConfigurePackageLocalizedNamesPromptFixture[] = [
  {
    id: 'add-hy-spa-day',
    prompt: 'Add Armenian name «Սպա օր» for Spa Day package',
    operation: 'set' as const,
    packageName: 'Spa Day',
    locale: 'hy' as const,
    displayName: 'Սպա օր',
  },
  {
    id: 'set-ru-wellness',
    prompt: 'Set Russian display name for Wellness package to Спа день',
    operation: 'set' as const,
    packageName: 'Wellness',
    locale: 'ru' as const,
    displayName: 'Спа день',
  },
  {
    id: 'clear-hy-spa-day',
    prompt: 'Clear Armenian localized name for Spa Day package',
    operation: 'clear' as const,
    packageName: 'Spa Day',
    locale: 'hy' as const,
  },
  {
    id: 'remove-ru-bridal',
    prompt: 'Remove Russian translation from Bridal package',
    operation: 'clear' as const,
    packageName: 'Bridal',
    locale: 'ru' as const,
  },
  {
    id: 'update-en-spa-day',
    prompt:
      'Update English display name for "Spa Day" package to Spa Day Bundle',
    operation: 'set' as const,
    packageName: 'Spa Day',
    locale: 'en' as const,
    displayName: 'Spa Day Bundle',
  },
  {
    id: 'clear-all-bridal',
    prompt: 'Remove all localized names from Bridal package',
    operation: 'clear' as const,
    packageName: 'Bridal',
  },
  {
    id: 'add-russian-spa',
    prompt: 'Add Russian name for Spa Day package as "Спа день"',
    operation: 'set' as const,
    packageName: 'Spa Day',
    locale: 'ru' as const,
    displayName: 'Спа день',
  },
  {
    id: 'set-hy-display-wellness',
    prompt: 'Put Armenian localized label on Wellness package: Առողջության օր',
    operation: 'set' as const,
    packageName: 'Wellness',
    locale: 'hy' as const,
    displayName: 'Առողջության օր',
  },
  {
    id: 'delete-en-spa-day',
    prompt: 'Delete English localized name for Spa Day package',
    operation: 'clear' as const,
    packageName: 'Spa Day',
    locale: 'en' as const,
  },
  {
    id: 'hy-add-spa-day',
    prompt: 'Ավելացրի՛ր հայերեն անուն «Սպա օր» Spa Day փաթեթի համար',
    operation: 'set' as const,
    packageName: 'Spa Day',
    locale: 'hy' as const,
    displayName: 'Սպա օր',
  },
  {
    id: 'hy-clear-spa-day',
    prompt: 'Հեռացրի՛ր հայերեն թարգմանությունը Spa Day փաթեթից',
    operation: 'clear' as const,
    packageName: 'Spa Day',
    locale: 'hy' as const,
  },
  {
    id: 'ru-set-wellness',
    prompt: 'Установи русское название для пакета Wellness: Спа день',
    operation: 'set' as const,
    packageName: 'Wellness',
    locale: 'ru' as const,
    displayName: 'Спа день',
  },
  {
    id: 'ru-clear-bridal',
    prompt: 'Удали русский перевод названия пакета Bridal',
    operation: 'clear' as const,
    packageName: 'Bridal',
    locale: 'ru' as const,
  },
];
