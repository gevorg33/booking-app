import { type Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import type { ServicePackagesService } from '../service-packages/service-packages.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  extractLocalizedNamesFromMetadata,
  resolveLocalizedDisplayName,
  type LocalizedNamesMap,
} from '../../common/i18n/service-localized-names.util.js';
import { localeDisplayName } from '../../common/i18n/messages.js';
import {
  getBusinessEnabledLocales,
  normalizeAppLocale,
  resolveTenantLocale,
  type AppLocale,
} from '../../common/utils/business-locale.util.js';
import {
  parsePackageLocalizedNamesFromPrompt,
  type ParsedPackageLocalizedNames,
} from './ai-package-localized-names.util.js';
import { parsePackageDisplayNameExplainFromPrompt } from './ai-package-display-name.util.js';

export interface PackageLocalizedNamesLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  packagesService: Pick<
    ServicePackagesService,
    'listPackages' | 'updatePackage'
  >;
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

function resolvePackageByName<T extends { id: string; name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

function buildLocalizedNamesPatch(
  existing: LocalizedNamesMap | undefined,
  parsed: ParsedPackageLocalizedNames,
): LocalizedNamesMap {
  if (parsed.operation === 'clear' && !parsed.locale) {
    return {};
  }

  const next: LocalizedNamesMap = { ...(existing ?? {}) };
  if (parsed.operation === 'clear' && parsed.locale) {
    delete next[parsed.locale];
    return next;
  }

  if (parsed.operation === 'set' && parsed.locale && parsed.displayName) {
    next[parsed.locale] = [parsed.displayName];
  }

  return next;
}

export async function handleConfigurePackageLocalizedNamesLogic(
  deps: PackageLocalizedNamesLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parsePackageLocalizedNamesFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'configure_package_localized_names',
      'Specify the package, locale, and display name to set — or the package and locale to clear (e.g. "Add Armenian name «Սպա օր» for Spa Day package" or "Clear Armenian localized name for Spa Day package").',
      { clarify: true, missing: ['packageName', 'locale', 'displayName'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('configure_package_localized_names', 'Business not found.');
  }

  const enabledLocales = getBusinessEnabledLocales(
    business.settings as Record<string, unknown> | undefined,
  );

  if (parsed.locale && !enabledLocales.includes(parsed.locale)) {
    return failure(
      'configure_package_localized_names',
      `${localeDisplayName(parsed.locale)} (${parsed.locale}) is not enabled for this salon — enable it in language settings before adding package translations.`,
      { enabledLocales, locale: parsed.locale },
    );
  }

  const packages = await deps.packagesService.listPackages(
    businessId,
    'all',
    true,
  );
  const pkg = parsed.packageId
    ? packages.find((item) => item.id === parsed.packageId)
    : parsed.packageName
      ? resolvePackageByName(packages, parsed.packageName)
      : undefined;

  if (!pkg) {
    return failure(
      'configure_package_localized_names',
      'Package not found. Use the exact package name from your catalog.',
      { clarify: true, missing: ['packageName'] },
    );
  }

  const existing = extractLocalizedNamesFromMetadata(pkg.metadata ?? {});
  const patch = buildLocalizedNamesPatch(existing, parsed);

  const updated = await deps.packagesService.updatePackage(businessId, pkg.id, {
    localizedNames: patch,
  });

  const updatedNames = extractLocalizedNamesFromMetadata(
    updated.metadata ?? {},
  );

  if (parsed.operation === 'set' && parsed.locale && parsed.displayName) {
    return success(
      'configure_package_localized_names',
      `Set ${localeDisplayName(parsed.locale)} (${parsed.locale}) display name for package "${updated.name}" to "${parsed.displayName}".`,
      {
        packageId: updated.id,
        packageName: updated.name,
        locale: parsed.locale,
        displayName: parsed.displayName,
        localizedNames: updatedNames,
        enabledLocales,
      },
    );
  }

  const clearedLabel = parsed.locale
    ? `${localeDisplayName(parsed.locale)} (${parsed.locale})`
    : 'all locales';

  return success(
    'configure_package_localized_names',
    `Cleared ${clearedLabel} localized display name(s) for package "${updated.name}".`,
    {
      packageId: updated.id,
      packageName: updated.name,
      locale: parsed.locale ?? null,
      localizedNames: updatedNames,
      enabledLocales,
    },
  );
}

function formatLocaleResolutionNote(
  askedLocale: AppLocale | undefined,
  displayLocale: AppLocale,
  enabledLocales: readonly AppLocale[],
  visitorPreference?: string | null,
): string {
  if (askedLocale && !enabledLocales.includes(askedLocale)) {
    return `${localeDisplayName(askedLocale)} (${askedLocale}) is not enabled — visitors who prefer it see the page in ${localeDisplayName(displayLocale)} (${displayLocale}) instead. `;
  }
  const normalizedPreference = visitorPreference?.trim();
  if (
    normalizedPreference &&
    normalizeAppLocale(normalizedPreference) &&
    normalizeAppLocale(normalizedPreference) !== displayLocale
  ) {
    return `Visitor preference "${normalizedPreference}" resolves to ${localeDisplayName(displayLocale)} (${displayLocale}). `;
  }
  return '';
}

export async function handleExplainPackageDisplayNameLogic(
  deps: PackageLocalizedNamesLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
  sessionVisitorLocale?: string | null,
): Promise<CommandResult> {
  const parsed = parsePackageDisplayNameExplainFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_package_display_name',
      'Specify which package to check (e.g. "What Armenian name shows for Spa Day package on public booking?" or "What title does the Wellness package show here?").',
      { clarify: true, missing: ['packageName'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_package_display_name', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const enabledLocales = getBusinessEnabledLocales(settings);
  const visitorPreference =
    sessionVisitorLocale ??
    (typeof params.visitorLocale === 'string' ? params.visitorLocale : null);
  const askedLocale =
    parsed.queryLocale ??
    normalizeAppLocale(
      typeof params.locale === 'string' ? params.locale : null,
    ) ??
    undefined;
  const displayLocale = resolveTenantLocale(
    askedLocale ?? visitorPreference,
    settings,
  );

  const packages = await deps.packagesService.listPackages(
    businessId,
    'all',
    true,
  );
  const pkg = parsed.packageId
    ? packages.find((item) => item.id === parsed.packageId)
    : parsed.packageName
      ? resolvePackageByName(packages, parsed.packageName)
      : undefined;

  if (!pkg) {
    return failure(
      'explain_package_display_name',
      'Package not found. Use the exact package name from your catalog.',
      { clarify: true, missing: ['packageName'] },
    );
  }

  const localizedNames = extractLocalizedNamesFromMetadata(pkg.metadata ?? {});
  const primaryName = pkg.name;
  const displayedName = resolveLocalizedDisplayName(
    primaryName,
    localizedNames,
    displayLocale,
  );
  const localeTranslation = localizedNames?.[displayLocale]?.find((name) =>
    name?.trim(),
  );
  const usedFallback = !localeTranslation?.trim();

  const localeNote = formatLocaleResolutionNote(
    askedLocale,
    displayLocale,
    enabledLocales,
    visitorPreference,
  );

  const displayNote = usedFallback
    ? `No ${localeDisplayName(displayLocale)} (${displayLocale}) localized display name is configured — the public booking page shows the primary catalog name "${primaryName}".`
    : `The public booking page shows "${displayedName}" in ${localeDisplayName(displayLocale)} (${displayLocale}); primary catalog name is "${primaryName}".`;

  const summary = `${localeNote}For package "${primaryName}", ${displayNote}`;

  return success('explain_package_display_name', summary, {
    packageId: pkg.id,
    packageName: primaryName,
    primaryName,
    displayedName,
    displayLocale,
    askedLocale: askedLocale ?? null,
    visitorLocale: visitorPreference ?? null,
    usedFallback,
    localizedNames,
    enabledLocales,
  });
}
