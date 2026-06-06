import { type Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ServiceCategory } from '../service/entities/service-category.entity.js';
import { ServicePackage } from '../service-packages/entities/service-package.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { mergeBusinessSettings } from '../../common/utils/merge-business-settings.util.js';
import {
  assertBusinessLocaleSettings,
  getBusinessDefaultLocale,
  getBusinessEnabledLocales,
  mergeBusinessLocaleSettings,
  resolveTenantLocale,
  SUPPORTED_LOCALES,
  type AppLocale,
} from '../../common/utils/business-locale.util.js';
import { localeDisplayName } from '../../common/i18n/messages.js';
import {
  applyLocalizedNamesToMetadata,
  extractLocalizedNamesFromMetadata,
  type LocalizedNamesMap,
} from '../../common/i18n/service-localized-names.util.js';
import {
  extractPublicProfileLocalesFromSettings,
  normalizePublicProfileLocales,
} from '../../common/i18n/business-public-profile-locales.util.js';
import {
  parseBusinessLanguagesFromPrompt,
  type BusinessLanguageOperation,
} from './ai-business-languages.util.js';

export interface BusinessLanguagesLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne' | 'save'>;
  serviceRepo?: Pick<Repository<Service>, 'find' | 'save'>;
  categoryRepo?: Pick<Repository<ServiceCategory>, 'find' | 'save'>;
  packageRepo?: Pick<Repository<ServicePackage>, 'find' | 'save'>;
}

interface DisabledLocaleTranslationStats {
  total: number;
  byLocale: Partial<Record<AppLocale, number>>;
}

function countDisabledLocaleTranslations(
  items: Array<{ metadata?: Record<string, unknown> | null }>,
  enabledLocales: readonly AppLocale[],
): DisabledLocaleTranslationStats {
  const enabled = new Set(enabledLocales);
  const byLocale: Partial<Record<AppLocale, number>> = {};
  let total = 0;

  for (const item of items) {
    const localized = extractLocalizedNamesFromMetadata(item.metadata ?? undefined);
    if (!localized) continue;

    let matched = false;
    for (const locale of SUPPORTED_LOCALES) {
      if (enabled.has(locale)) continue;
      const names = localized[locale];
      if (!names?.length) continue;
      byLocale[locale] = (byLocale[locale] ?? 0) + 1;
      matched = true;
    }

    if (matched) total += 1;
  }

  return { total, byLocale };
}

function formatDisabledLocaleBreakdown(
  stats: DisabledLocaleTranslationStats,
): string {
  const parts = Object.entries(stats.byLocale).map(
    ([locale, count]) =>
      `${count} in ${localeDisplayName(locale as AppLocale)} (${locale})`,
  );
  return parts.length > 0 ? parts.join(', ') : 'none';
}

function formatDisabledCatalogSummary(
  label: string,
  stats: DisabledLocaleTranslationStats,
): string {
  if (stats.total === 0) {
    return `No active ${label} have translations in disabled locales.`;
  }

  const breakdown = formatDisabledLocaleBreakdown(stats);
  if (stats.total === 1) {
    return `1 active ${label.slice(0, -1)} still has translations in disabled locales (${breakdown}).`;
  }

  return `${stats.total} active ${label} still have translations in disabled locales (${breakdown}).`;
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function localesEqual(a: readonly AppLocale[], b: readonly AppLocale[]): boolean {
  return a.length === b.length && a.every((locale, index) => locale === b[index]);
}

function formatLocaleList(locales: readonly AppLocale[]): string {
  return locales.map((locale) => `${localeDisplayName(locale)} (${locale})`).join(', ');
}

function describeOperation(operation: BusinessLanguageOperation): string {
  if (operation === 'enable') return 'Enabled';
  if (operation === 'disable') return 'Disabled';
  return 'Set default language to';
}

export async function handleConfigureBusinessLanguagesLogic(
  deps: BusinessLanguagesLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseBusinessLanguagesFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'configure_business_languages',
      'Specify which languages to enable, disable, or set as default (e.g. "Enable Armenian and Russian", "Turn off Russian for our salon", or "Set default language to English").',
      { clarify: true, missing: ['operation', 'locales'] },
    );
  }

  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('configure_business_languages', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const previousEnabled = getBusinessEnabledLocales(settings);
  const previousDefault = getBusinessDefaultLocale(settings);

  let nextEnabled = [...previousEnabled];
  let nextDefault = previousDefault;

  try {
    if (parsed.operation === 'enable') {
      for (const locale of parsed.locales) {
        if (!nextEnabled.includes(locale)) nextEnabled.push(locale);
      }
    } else if (parsed.operation === 'disable') {
      nextEnabled = nextEnabled.filter((locale) => !parsed.locales.includes(locale));
      if (nextEnabled.length === 0) {
        return failure(
          'configure_business_languages',
          'At least one language must stay enabled for the booking site.',
        );
      }
      if (!nextEnabled.includes(nextDefault)) {
        nextDefault = nextEnabled[0];
      }
    } else {
      const target = parsed.locales[0];
      if (!target) {
        return failure(
          'configure_business_languages',
          'Specify which language should be the default.',
          { clarify: true, missing: ['defaultLocale'] },
        );
      }
      if (!nextEnabled.includes(target)) nextEnabled.push(target);
      nextDefault = target;
    }

    const normalized = assertBusinessLocaleSettings({
      enabledLocales: nextEnabled,
      defaultLocale: nextDefault,
    });

    if (
      localesEqual(previousEnabled, normalized.enabledLocales) &&
      previousDefault === normalized.defaultLocale
    ) {
      return success(
        'configure_business_languages',
        `Language settings are already up to date: enabled ${formatLocaleList(normalized.enabledLocales)}; default ${localeDisplayName(normalized.defaultLocale)} (${normalized.defaultLocale}).`,
        {
          enabledLocales: normalized.enabledLocales,
          defaultLocale: normalized.defaultLocale,
          previousEnabledLocales: previousEnabled,
          previousDefaultLocale: previousDefault,
          unchanged: true,
        },
      );
    }

    business.settings = mergeBusinessSettings(
      settings,
      mergeBusinessLocaleSettings(settings, normalized),
    ) as Business['settings'];
    await deps.businessRepo.save(business);

    const changedLocales = formatLocaleList(parsed.locales);
    const summaryParts = [
      `${describeOperation(parsed.operation)} ${changedLocales}.`,
      `Enabled languages: ${formatLocaleList(normalized.enabledLocales)}.`,
      `Default language: ${localeDisplayName(normalized.defaultLocale)} (${normalized.defaultLocale}).`,
    ];

    return success('configure_business_languages', summaryParts.join(' '), {
      operation: parsed.operation,
      locales: parsed.locales,
      enabledLocales: normalized.enabledLocales,
      defaultLocale: normalized.defaultLocale,
      previousEnabledLocales: previousEnabled,
      previousDefaultLocale: previousDefault,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Could not update language settings.';
    return failure('configure_business_languages', message);
  }
}

export async function handleExplainBookingLanguagesLogic(
  deps: BusinessLanguagesLogicDeps,
  businessId: string,
  visitorLocale?: string | null,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_booking_languages', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const enabledLocales = getBusinessEnabledLocales(settings);
  const defaultLocale = getBusinessDefaultLocale(settings);
  const disabledLocales = SUPPORTED_LOCALES.filter(
    (locale) => !enabledLocales.includes(locale),
  );
  const resolvedVisitorLocale = resolveTenantLocale(visitorLocale, settings);

  const languagePickerNote =
    disabledLocales.length > 0
      ? `The language menu on this booking page only lists ${formatLocaleList(enabledLocales)} because the salon disabled the others.`
      : 'All supported languages appear in the booking page language menu.';

  const visitorNote = visitorLocale
    ? `Your preference (${visitorLocale}) resolves to ${localeDisplayName(resolvedVisitorLocale)} (${resolvedVisitorLocale}) when that language is enabled; otherwise the salon default is used.`
    : 'Your browser or saved language preference is used when it matches an enabled language; otherwise the salon default is shown.';

  const summary = [
    `This booking page offers ${formatLocaleList(enabledLocales)}.`,
    `Default language: ${localeDisplayName(defaultLocale)} (${defaultLocale}).`,
    disabledLocales.length > 0
      ? `Not available here: ${formatLocaleList(disabledLocales)}.`
      : '',
    languagePickerNote,
    visitorNote,
  ]
    .filter(Boolean)
    .join(' ');

  return success('explain_booking_languages', summary, {
    enabledLocales,
    defaultLocale,
    disabledLocales,
    visitorLocale: visitorLocale ?? null,
    resolvedVisitorLocale,
  });
}

export async function handleExplainBusinessLanguagesLogic(
  deps: BusinessLanguagesLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  if (!deps.serviceRepo || !deps.categoryRepo || !deps.packageRepo) {
    return failure(
      'explain_business_languages',
      'Catalog repositories are not configured.',
    );
  }

  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_business_languages', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const enabledLocales = getBusinessEnabledLocales(settings);
  const defaultLocale = getBusinessDefaultLocale(settings);
  const disabledLocales = SUPPORTED_LOCALES.filter(
    (locale) => !enabledLocales.includes(locale),
  );

  const [services, categories, packages] = await Promise.all([
    deps.serviceRepo.find({
      where: { businessId, isActive: true },
      select: { id: true, metadata: true },
    }),
    deps.categoryRepo.find({
      where: { businessId, isActive: true },
      select: { id: true, metadata: true },
    }),
    deps.packageRepo.find({
      where: { businessId, isActive: true },
      select: { id: true, metadata: true },
    }),
  ]);

  const serviceStats = countDisabledLocaleTranslations(services, enabledLocales);
  const categoryStats = countDisabledLocaleTranslations(
    categories,
    enabledLocales,
  );
  const packageStats = countDisabledLocaleTranslations(packages, enabledLocales);
  const totalDisabledLocaleItems =
    serviceStats.total + categoryStats.total + packageStats.total;

  const summary = [
    `Enabled languages: ${formatLocaleList(enabledLocales)}.`,
    `Default language: ${localeDisplayName(defaultLocale)} (${defaultLocale}).`,
    disabledLocales.length > 0
      ? `Disabled locales: ${formatLocaleList(disabledLocales)}.`
      : 'All supported locales are currently enabled.',
    formatDisabledCatalogSummary('services', serviceStats),
    formatDisabledCatalogSummary('categories', categoryStats),
    formatDisabledCatalogSummary('packages', packageStats),
    totalDisabledLocaleItems > 0
      ? 'These localizedNames entries are hidden on the booking site until you re-enable those locales or run a cleanup.'
      : 'Catalog localizedNames only use currently enabled locales.',
  ].join(' ');

  return success('explain_business_languages', summary, {
    enabledLocales,
    defaultLocale,
    disabledLocales,
    servicesWithDisabledLocaleTranslations: serviceStats.total,
    categoriesWithDisabledLocaleTranslations: categoryStats.total,
    packagesWithDisabledLocaleTranslations: packageStats.total,
    totalCatalogItemsWithDisabledLocaleTranslations: totalDisabledLocaleItems,
    servicesByDisabledLocale: serviceStats.byLocale,
    categoriesByDisabledLocale: categoryStats.byLocale,
    packagesByDisabledLocale: packageStats.byLocale,
    totalActiveServices: services.length,
    totalActiveCategories: categories.length,
    totalActivePackages: packages.length,
  });
}

function stripDisabledLocalizedNamesFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
  enabledLocales: readonly AppLocale[],
): { metadata: Record<string, unknown>; changed: boolean } {
  const localized = extractLocalizedNamesFromMetadata(metadata ?? undefined);
  if (!localized) {
    return { metadata: metadata ?? {}, changed: false };
  }

  const enabled = new Set(enabledLocales);
  const filtered: LocalizedNamesMap = {};
  let changed = false;

  for (const locale of SUPPORTED_LOCALES) {
    const names = localized[locale];
    if (!names?.length) continue;
    if (enabled.has(locale)) {
      filtered[locale] = names;
    } else {
      changed = true;
    }
  }

  if (!changed) {
    return { metadata: metadata ?? {}, changed: false };
  }

  return {
    metadata: applyLocalizedNamesToMetadata(
      { ...(metadata ?? {}) },
      Object.keys(filtered).length > 0 ? filtered : {},
      { enabledLocales },
    ),
    changed: true,
  };
}

function getDisabledPublicProfileLocales(
  settings: Record<string, unknown> | undefined,
  enabledLocales: readonly AppLocale[],
): AppLocale[] {
  const current = extractPublicProfileLocalesFromSettings(settings);
  if (!current) return [];

  const enabled = new Set(enabledLocales);
  return SUPPORTED_LOCALES.filter(
    (locale) => !enabled.has(locale) && Boolean(current[locale]),
  );
}

function stripDisabledPublicProfileLocalesFromSettings(
  settings: Record<string, unknown> | undefined,
  enabledLocales: readonly AppLocale[],
): { settings: Record<string, unknown>; changed: boolean } {
  const current = extractPublicProfileLocalesFromSettings(settings);
  if (!current) {
    return { settings: settings ?? {}, changed: false };
  }

  const stripped = normalizePublicProfileLocales(current, {
    enabledLocales,
    strict: false,
    stripDisabledLocales: true,
  });
  const next = { ...(settings ?? {}) };

  if (!stripped || Object.keys(stripped).length === 0) {
    if (!next.publicProfileLocales) {
      return { settings: next, changed: false };
    }
    delete next.publicProfileLocales;
    return { settings: next, changed: true };
  }

  if (
    JSON.stringify(next.publicProfileLocales) === JSON.stringify(stripped)
  ) {
    return { settings: next, changed: false };
  }

  next.publicProfileLocales = stripped;
  return { settings: next, changed: true };
}

function buildBulkStripConfirmationResult(
  prompt: string,
  preview: {
    serviceCount: number;
    categoryCount: number;
    packageCount: number;
    publicProfileDisabledLocales: AppLocale[];
    disabledLocales: AppLocale[];
    servicesByDisabledLocale: Partial<Record<AppLocale, number>>;
    categoriesByDisabledLocale: Partial<Record<AppLocale, number>>;
    packagesByDisabledLocale: Partial<Record<AppLocale, number>>;
  },
): CommandResult {
  const catalogTotal =
    preview.serviceCount + preview.categoryCount + preview.packageCount;
  const profileNote =
    preview.publicProfileDisabledLocales.length > 0
      ? `Public profile overrides in ${formatLocaleList(preview.publicProfileDisabledLocales)} will also be removed.`
      : 'No public profile overrides use disabled locales.';

  return success(
    'bulk_strip_disabled_locale_translations',
    [
      `Ready to strip disabled-locale translations from ${catalogTotal} catalog item(s) (${preview.serviceCount} services, ${preview.categoryCount} categories, ${preview.packageCount} packages).`,
      `Disabled locales: ${formatLocaleList(preview.disabledLocales)}.`,
      preview.serviceCount
        ? `Services: ${formatDisabledLocaleBreakdown({
            total: preview.serviceCount,
            byLocale: preview.servicesByDisabledLocale,
          })}.`
        : '',
      preview.categoryCount
        ? `Categories: ${formatDisabledLocaleBreakdown({
            total: preview.categoryCount,
            byLocale: preview.categoriesByDisabledLocale,
          })}.`
        : '',
      preview.packageCount
        ? `Packages: ${formatDisabledLocaleBreakdown({
            total: preview.packageCount,
            byLocale: preview.packagesByDisabledLocale,
          })}.`
        : '',
      profileNote,
      'Confirm below to execute.',
    ]
      .filter(Boolean)
      .join(' '),
    {
      requiresExecutionConfirmation: true,
      confirmationPrompt: prompt,
      interpretedAction: 'bulk_strip_disabled_locale_translations',
      previewParams: preview,
      ...preview,
      catalogItemCount: catalogTotal,
    },
  );
}

export async function handleBulkStripDisabledLocaleTranslationsLogic(
  deps: BusinessLanguagesLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
  confirmed = false,
): Promise<CommandResult> {
  if (
    !deps.serviceRepo ||
    !deps.categoryRepo ||
    !deps.packageRepo ||
    !deps.serviceRepo.save ||
    !deps.categoryRepo.save ||
    !deps.packageRepo.save
  ) {
    return failure(
      'bulk_strip_disabled_locale_translations',
      'Catalog repositories are not configured.',
    );
  }

  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('bulk_strip_disabled_locale_translations', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const enabledLocales = getBusinessEnabledLocales(settings);
  const disabledLocales = SUPPORTED_LOCALES.filter(
    (locale) => !enabledLocales.includes(locale),
  );

  if (disabledLocales.length === 0) {
    return success(
      'bulk_strip_disabled_locale_translations',
      'All supported locales are enabled — there are no disabled locale translations to strip.',
      {
        enabledLocales,
        unchanged: true,
        catalogItemCount: 0,
      },
    );
  }

  const [services, categories, packages] = await Promise.all([
    deps.serviceRepo.find({
      where: { businessId, isActive: true },
      select: { id: true, metadata: true },
    }),
    deps.categoryRepo.find({
      where: { businessId, isActive: true },
      select: { id: true, metadata: true },
    }),
    deps.packageRepo.find({
      where: { businessId, isActive: true },
      select: { id: true, metadata: true },
    }),
  ]);

  const serviceStats = countDisabledLocaleTranslations(services, enabledLocales);
  const categoryStats = countDisabledLocaleTranslations(
    categories,
    enabledLocales,
  );
  const packageStats = countDisabledLocaleTranslations(packages, enabledLocales);
  const publicProfileDisabledLocales = getDisabledPublicProfileLocales(
    settings,
    enabledLocales,
  );
  const catalogTotal =
    serviceStats.total + categoryStats.total + packageStats.total;
  const hasWork =
    catalogTotal > 0 || publicProfileDisabledLocales.length > 0;

  if (!hasWork) {
    return success(
      'bulk_strip_disabled_locale_translations',
      'No active catalog items or public profile overrides have translations in disabled locales.',
      {
        enabledLocales,
        disabledLocales,
        unchanged: true,
        catalogItemCount: 0,
        publicProfileDisabledLocales: [],
      },
    );
  }

  const preview = {
    serviceCount: serviceStats.total,
    categoryCount: categoryStats.total,
    packageCount: packageStats.total,
    publicProfileDisabledLocales,
    disabledLocales,
    servicesByDisabledLocale: serviceStats.byLocale,
    categoriesByDisabledLocale: categoryStats.byLocale,
    packagesByDisabledLocale: packageStats.byLocale,
  };

  if (!confirmed) {
    return buildBulkStripConfirmationResult(
      String(prompt ?? params._prompt ?? ''),
      preview,
    );
  }

  const updatedServiceIds: string[] = [];
  const updatedCategoryIds: string[] = [];
  const updatedPackageIds: string[] = [];

  for (const service of services) {
    const stripped = stripDisabledLocalizedNamesFromMetadata(
      service.metadata,
      enabledLocales,
    );
    if (!stripped.changed) continue;
    await deps.serviceRepo.save({
      id: service.id,
      metadata: stripped.metadata,
    } as Service);
    updatedServiceIds.push(service.id);
  }

  for (const category of categories) {
    const stripped = stripDisabledLocalizedNamesFromMetadata(
      category.metadata,
      enabledLocales,
    );
    if (!stripped.changed) continue;
    await deps.categoryRepo.save({
      id: category.id,
      metadata: stripped.metadata,
    } as ServiceCategory);
    updatedCategoryIds.push(category.id);
  }

  for (const pkg of packages) {
    const stripped = stripDisabledLocalizedNamesFromMetadata(
      pkg.metadata,
      enabledLocales,
    );
    if (!stripped.changed) continue;
    await deps.packageRepo.save({
      id: pkg.id,
      metadata: stripped.metadata,
    } as ServicePackage);
    updatedPackageIds.push(pkg.id);
  }

  let publicProfileStripped = false;
  const strippedSettings = stripDisabledPublicProfileLocalesFromSettings(
    settings,
    enabledLocales,
  );
  if (strippedSettings.changed) {
    business.settings = mergeBusinessSettings(
      settings,
      strippedSettings.settings,
    ) as Business['settings'];
    await deps.businessRepo.save(business);
    publicProfileStripped = true;
  }

  const summary = [
    `Removed disabled-locale translations from ${updatedServiceIds.length} service(s), ${updatedCategoryIds.length} category(ies), and ${updatedPackageIds.length} package(s).`,
    publicProfileStripped
      ? `Cleared public profile overrides for ${formatLocaleList(publicProfileDisabledLocales)}.`
      : 'Public profile overrides were already limited to enabled locales.',
  ].join(' ');

  return success('bulk_strip_disabled_locale_translations', summary, {
    ...preview,
    catalogItemCount: catalogTotal,
    updatedServiceIds,
    updatedCategoryIds,
    updatedPackageIds,
    publicProfileStripped,
    enabledLocales,
  });
}
