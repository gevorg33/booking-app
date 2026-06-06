import { In, type Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ServicePackage } from '../service-packages/entities/service-package.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { mergeBusinessSettings } from '../../common/utils/merge-business-settings.util.js';
import {
  getBusinessDefaultCurrency,
  isStripeChargeCurrencySupported,
  listStripeChargeCurrencyCodes,
  normalizeBusinessCurrency,
  resolvePriceCurrency,
} from '../../common/utils/business-currency.util.js';
import { resolvePublicPaymentSettings } from '../../common/utils/customer-self-service.util.js';
import { getBusinessStripeIntegration } from '../billing/stripe-integration.types.js';
import { readBusinessGiftCardSettings } from '../gift-cards/gift-card.types.js';
import { parseCurrencyFromPrompt } from './ai-business-currency.util.js';
import { extractDateRangeFromPrompt } from './ai-orchestration.helpers.js';
import type { DashboardService } from '../business/dashboard.service.js';
import type { AnalyticsService } from '../analytics/analytics.service.js';
import { formatBusinessMoney } from '../../common/utils/business-currency.util.js';

export interface BusinessCurrencyLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne' | 'save'>;
  serviceRepo: Pick<Repository<Service>, 'find' | 'update'>;
  packageRepo: Pick<Repository<ServicePackage>, 'find'>;
  dashboardService?: Pick<DashboardService, 'getOverview'>;
  analyticsService?: Pick<
    AnalyticsService,
    'staffPerformance' | 'servicePopularity'
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

export async function handleConfigureBusinessCurrencyLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('configure_business_currency', 'Business not found.');
  }

  const currencyCode = parseCurrencyFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!currencyCode) {
    return failure(
      'configure_business_currency',
      'Specify which currency to use (e.g. "Set default currency to AMD" or "Switch the salon to euros").',
      { clarify: true, missing: ['currencyCode'] },
    );
  }

  const previousCurrency = getBusinessDefaultCurrency(
    business.settings as Record<string, unknown> | undefined,
  );

  if (previousCurrency === currencyCode) {
    return success(
      'configure_business_currency',
      `Business currency is already ${currencyCode}.`,
      {
        currencyCode,
        previousCurrency,
        unchanged: true,
        stripeCurrencySupported: isStripeChargeCurrencySupported(currencyCode),
      },
    );
  }

  business.settings = mergeBusinessSettings(
    business.settings as Record<string, unknown> | undefined,
    {
      currency: currencyCode,
      defaultCurrency: currencyCode,
    },
  );
  await deps.businessRepo.save(business);

  const stripeNote = isStripeChargeCurrencySupported(currencyCode)
    ? ''
    : ' Online card payments via Stripe may be limited for this currency.';

  return success(
    'configure_business_currency',
    `Default business currency set to ${currencyCode} (was ${previousCurrency}). New catalog items and reports will use ${currencyCode}.${stripeNote}`,
    {
      currencyCode,
      previousCurrency,
      stripeCurrencySupported: isStripeChargeCurrencySupported(currencyCode),
    },
  );
}

function summarizeServicesByCurrency(
  services: Pick<Service, 'currency'>[],
): Record<string, number> {
  const servicesByCurrency: Record<string, number> = {};
  for (const service of services) {
    const code = normalizeBusinessCurrency(service.currency);
    if (!code) continue;
    servicesByCurrency[code] = (servicesByCurrency[code] ?? 0) + 1;
  }
  return servicesByCurrency;
}

function findMismatchedServices(
  services: Pick<Service, 'id' | 'name' | 'currency'>[],
  defaultCurrency: string,
  fromCurrency?: string | null,
): Pick<Service, 'id' | 'name' | 'currency'>[] {
  return services.filter((service) => {
    const code = normalizeBusinessCurrency(service.currency);
    if (!code || code === defaultCurrency) return false;
    if (fromCurrency && code !== fromCurrency) return false;
    return true;
  });
}

function countServicesOnDifferentCurrency(
  services: Pick<Service, 'id' | 'name' | 'currency'>[],
  defaultCurrency: string,
): {
  mismatchCount: number;
  servicesByCurrency: Record<string, number>;
} {
  const mismatched = findMismatchedServices(services, defaultCurrency);
  return {
    mismatchCount: mismatched.length,
    servicesByCurrency: summarizeServicesByCurrency(mismatched),
  };
}

function formatMismatchSummary(
  mismatchCount: number,
  servicesByCurrency: Record<string, number>,
): string {
  if (mismatchCount === 0) {
    return 'All active services use the default currency.';
  }

  const breakdown = Object.entries(servicesByCurrency)
    .map(([code, count]) => `${count} in ${code}`)
    .join(', ');

  if (mismatchCount === 1) {
    return `1 active service still uses a different currency (${breakdown}).`;
  }

  return `${mismatchCount} active services still use a different currency (${breakdown}).`;
}

export async function handleExplainBusinessCurrencyLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_business_currency', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const defaultCurrency = getBusinessDefaultCurrency(settings);
  const stripeCurrencySupported =
    isStripeChargeCurrencySupported(defaultCurrency);

  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    select: { id: true, name: true, currency: true },
  });

  const { mismatchCount, servicesByCurrency } = countServicesOnDifferentCurrency(
    services,
    defaultCurrency,
  );

  const stripePart = stripeCurrencySupported
    ? `Stripe supports online card payments in ${defaultCurrency}.`
    : `Stripe does not support online card charges in ${defaultCurrency} — customers may need cash or pay-at-venue for card checkout.`;

  const summary = [
    `Default business currency is ${defaultCurrency}.`,
    stripePart,
    formatMismatchSummary(mismatchCount, servicesByCurrency),
  ].join(' ');

  return success('explain_business_currency', summary, {
    currencyCode: defaultCurrency,
    defaultCurrency,
    stripeCurrencySupported,
    servicesOnDifferentCurrencyCount: mismatchCount,
    servicesByCurrency,
    totalActiveServices: services.length,
  });
}

function describeCheckoutCurrencyDisplay(code: string): string {
  const labels: Record<string, string> = {
    EUR: 'euros (€)',
    AMD: 'Armenian dram (֏)',
    RUB: 'rubles (₽)',
    USD: 'US dollars ($)',
    GBP: 'British pounds (£)',
    GEL: 'Georgian lari (₾)',
  };
  return labels[code] ?? code;
}

function formatCheckoutLegacyNote(
  mismatchCount: number,
  servicesByCurrency: Record<string, number>,
): string {
  if (mismatchCount === 0) {
    return 'All listed services use the same currency on this page.';
  }

  const breakdown = Object.entries(servicesByCurrency)
    .map(([code, count]) => `${count} in ${code}`)
    .join(', ');

  if (mismatchCount === 1) {
    return `1 service still lists a different currency code (${breakdown}) — its price may show another symbol until the salon aligns the catalog.`;
  }

  return `${mismatchCount} services still list different currency codes (${breakdown}) — you may see mixed symbols until the salon aligns the catalog.`;
}

export async function handleExplainCheckoutCurrencyLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_checkout_currency', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const defaultCurrency = getBusinessDefaultCurrency(settings);
  const stripeCurrencySupported =
    isStripeChargeCurrencySupported(defaultCurrency);

  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    select: { id: true, name: true, currency: true },
  });

  const { mismatchCount, servicesByCurrency } = countServicesOnDifferentCurrency(
    services,
    defaultCurrency,
  );

  const displayLabel = describeCheckoutCurrencyDisplay(defaultCurrency);
  const stripePart = stripeCurrencySupported
    ? 'Online card checkout uses the same currency when available.'
    : 'Online card payment may not be available for this currency — cash or pay-at-venue may be offered instead.';

  const summary = [
    `Prices on this booking page are shown in ${displayLabel} (${defaultCurrency}), the salon's default.`,
    formatCheckoutLegacyNote(mismatchCount, servicesByCurrency),
    stripePart,
  ].join(' ');

  return success('explain_checkout_currency', summary, {
    currencyCode: defaultCurrency,
    displayCurrency: defaultCurrency,
    stripeCurrencySupported,
    servicesOnDifferentCurrencyCount: mismatchCount,
    servicesByCurrency,
    totalActiveServices: services.length,
  });
}

function formatTenantLegacyNote(
  mismatchCount: number,
  servicesByCurrency: Record<string, number>,
): string {
  if (mismatchCount === 0) {
    return 'All active services in this salon catalog use the same currency in the app.';
  }

  const breakdown = Object.entries(servicesByCurrency)
    .map(([code, count]) => `${count} in ${code}`)
    .join(', ');

  if (mismatchCount === 1) {
    return `1 service still lists a different currency code (${breakdown}) — you may see another symbol on that item until the salon aligns the catalog.`;
  }

  return `${mismatchCount} services still list different currency codes (${breakdown}) — you may see mixed symbols in the app until the salon aligns the catalog.`;
}

export async function handleExplainTenantCurrencyLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_tenant_currency', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const defaultCurrency = getBusinessDefaultCurrency(settings);
  const stripeCurrencySupported =
    isStripeChargeCurrencySupported(defaultCurrency);

  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    select: { id: true, name: true, currency: true },
  });

  const { mismatchCount, servicesByCurrency } = countServicesOnDifferentCurrency(
    services,
    defaultCurrency,
  );

  const displayLabel = describeCheckoutCurrencyDisplay(defaultCurrency);
  const stripePart = stripeCurrencySupported
    ? 'In-app online checkout uses the same currency when available.'
    : 'In-app card payment may not be available for this currency — cash or pay-at-venue may be offered instead.';

  const summary = [
    `After your profile loads in this salon's consumer app, prices are shown in ${displayLabel} (${defaultCurrency}), the tenant's business default.`,
    formatTenantLegacyNote(mismatchCount, servicesByCurrency),
    stripePart,
  ].join(' ');

  return success('explain_tenant_currency', summary, {
    currencyCode: defaultCurrency,
    displayCurrency: defaultCurrency,
    stripeCurrencySupported,
    servicesOnDifferentCurrencyCount: mismatchCount,
    servicesByCurrency,
    totalActiveServices: services.length,
    tenantId: businessId,
  });
}

function resolvePackageDisplayCurrency(
  pkg: ServicePackage,
  businessSettings?: Record<string, unknown>,
): string {
  return resolvePriceCurrency(
    pkg.items?.[0]?.service?.currency,
    businessSettings,
  );
}

function formatPackageOfferCurrencyNote(
  totalPackages: number,
  legacyCount: number,
  packagesByCurrency: Record<string, number>,
  defaultCurrency: string,
): string {
  if (totalPackages === 0) {
    return 'No active service packages are listed on this booking site.';
  }
  if (legacyCount === 0) {
    const suffix = totalPackages === 1 ? '' : 's';
    return `All ${totalPackages} active package${suffix} resolve to ${defaultCurrency} from bundled services.`;
  }

  const breakdown = Object.entries(packagesByCurrency)
    .map(([code, count]) => `${count} in ${code}`)
    .join(', ');
  const aligned = totalPackages - legacyCount;
  return `${aligned} of ${totalPackages} packages use ${defaultCurrency}; ${legacyCount} still resolve from legacy bundled service codes (${breakdown}).`;
}

function formatGiftCardCurrencyNote(
  giftSettings: ReturnType<typeof readBusinessGiftCardSettings>,
  defaultCurrency: string,
  packageGiftLegacyCount: number,
  serviceGiftLegacyCount: number,
): string {
  if (!giftSettings.purchaseEnabled) {
    return 'Gift-card purchase is not enabled for this salon.';
  }

  const parts: string[] = [];
  if (giftSettings.presetAmounts.length > 0) {
    parts.push(
      `Monetary gift-card presets are always quoted in ${defaultCurrency}.`,
    );
  }
  if (giftSettings.purchasablePackages.length > 0) {
    if (packageGiftLegacyCount === 0) {
      parts.push(
        'Package gift-card totals follow each package’s resolved currency.',
      );
    } else {
      parts.push(
        `${packageGiftLegacyCount} package gift-card product(s) inherit legacy service currency codes instead of the business default.`,
      );
    }
  }
  if (giftSettings.purchasableServices.length > 0 && serviceGiftLegacyCount > 0) {
    parts.push(
      `${serviceGiftLegacyCount} service gift-card product(s) inherit legacy service currency codes.`,
    );
  }
  parts.push(
    `Gift-card checkout quotes use ${defaultCurrency} at payment time.`,
  );
  return parts.join(' ');
}

export async function handleExplainPackageCurrencyLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_package_currency', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const defaultCurrency = getBusinessDefaultCurrency(settings);
  const stripeCurrencySupported =
    isStripeChargeCurrencySupported(defaultCurrency);
  const giftSettings = readBusinessGiftCardSettings(settings);

  const packages = await deps.packageRepo.find({
    where: { businessId, isActive: true },
    relations: { items: { service: true } },
  });

  const activePackages = packages.filter((pkg) => pkg.items?.length);
  const packageCurrencyById = new Map(
    activePackages.map((pkg) => [
      pkg.id,
      resolvePackageDisplayCurrency(pkg, settings),
    ]),
  );

  const legacyPackages = activePackages.filter(
    (pkg) => packageCurrencyById.get(pkg.id) !== defaultCurrency,
  );
  const packagesByCurrency = summarizeServicesByCurrency(
    legacyPackages.map((pkg) => ({
      currency: packageCurrencyById.get(pkg.id) ?? defaultCurrency,
    })),
  );

  let packageGiftLegacyCount = 0;
  for (const entry of giftSettings.purchasablePackages) {
    const resolved =
      packageCurrencyById.get(entry.packageId) ??
      defaultCurrency;
    if (resolved !== defaultCurrency) packageGiftLegacyCount += 1;
  }

  let serviceGiftLegacyCount = 0;
  const giftServiceIds = giftSettings.purchasableServices.map(
    (entry) => entry.serviceId,
  );
  if (giftServiceIds.length) {
    const giftServices = await deps.serviceRepo.find({
      where: { businessId, id: In(giftServiceIds) },
      select: { id: true, currency: true },
    });
    serviceGiftLegacyCount = giftServices.filter(
      (service) =>
        resolvePriceCurrency(service.currency, settings) !== defaultCurrency,
    ).length;
  }

  const displayLabel = describeCheckoutCurrencyDisplay(defaultCurrency);
  const stripePart = stripeCurrencySupported
    ? 'Package and gift-card online checkout uses each offer’s resolved currency when Stripe supports it.'
    : 'Online card payment may not be available for some resolved currencies — cash or pay-at-venue may be offered instead.';

  const summary = [
    `Package and gift-card totals on this booking site use ${displayLabel} (${defaultCurrency}), the salon's business default, when bundled services have no legacy ISO code.`,
    formatPackageOfferCurrencyNote(
      activePackages.length,
      legacyPackages.length,
      packagesByCurrency,
      defaultCurrency,
    ),
    formatGiftCardCurrencyNote(
      giftSettings,
      defaultCurrency,
      packageGiftLegacyCount,
      serviceGiftLegacyCount,
    ),
    stripePart,
  ].join(' ');

  return success('explain_package_currency', summary, {
    currencyCode: defaultCurrency,
    displayCurrency: defaultCurrency,
    stripeCurrencySupported,
    totalActivePackages: activePackages.length,
    packagesOnDifferentCurrencyCount: legacyPackages.length,
    packagesByCurrency,
    packageGiftProductsOnLegacyCurrencyCount: packageGiftLegacyCount,
    serviceGiftProductsOnLegacyCurrencyCount: serviceGiftLegacyCount,
    giftCardPurchaseEnabled: giftSettings.purchaseEnabled,
    monetaryPresetCount: giftSettings.presetAmounts.length,
  });
}

function formatProviderPaymentLegacyNote(
  mismatchCount: number,
  servicesByCurrency: Record<string, number>,
  defaultCurrency: string,
): string {
  if (mismatchCount === 0) {
    return `All active catalog services resolve to ${defaultCurrency}, so appointment lines use the same code unless a booking predates a catalog change.`;
  }

  const breakdown = Object.entries(servicesByCurrency)
    .map(([code, count]) => `${count} in ${code}`)
    .join(', ');

  if (mismatchCount === 1) {
    return `1 active service still lists a legacy ISO code (${breakdown}) — its appointment payment line may show another symbol until the salon aligns the catalog.`;
  }

  return `${mismatchCount} active services still list legacy ISO codes (${breakdown}) — you may see mixed symbols across appointments until the salon aligns the catalog.`;
}

export async function handleExplainProviderPaymentCurrencyLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_provider_payment_currency', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const defaultCurrency = getBusinessDefaultCurrency(settings);
  const stripeCurrencySupported =
    isStripeChargeCurrencySupported(defaultCurrency);

  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    select: { id: true, name: true, currency: true },
  });

  const { mismatchCount, servicesByCurrency } = countServicesOnDifferentCurrency(
    services,
    defaultCurrency,
  );

  const displayLabel = describeCheckoutCurrencyDisplay(defaultCurrency);
  const stripePart = stripeCurrencySupported
    ? 'In-person and online collection use the same resolved currency when Stripe supports it.'
    : 'Online card collection may not be available for some legacy codes — cash or pay-at-venue may apply instead.';

  const summary = [
    `Appointment payment breakdowns and POS totals in the provider app are shown in ${displayLabel} (${defaultCurrency}) when the booked service has no legacy ISO code.`,
    'Each appointment resolves currency from that service catalog code (fallback to the business default).',
    formatProviderPaymentLegacyNote(
      mismatchCount,
      servicesByCurrency,
      defaultCurrency,
    ),
    'Retail POS add-ons have no separate currency — product lines are summed in the same code as the appointment service.',
    stripePart,
  ].join(' ');

  return success('explain_provider_payment_currency', summary, {
    currencyCode: defaultCurrency,
    displayCurrency: defaultCurrency,
    stripeCurrencySupported,
    servicesOnDifferentCurrencyCount: mismatchCount,
    servicesByCurrency,
    totalActiveServices: services.length,
    retailUsesAppointmentCurrency: true,
  });
}

function formatNotificationLegacyNote(
  mismatchCount: number,
  servicesByCurrency: Record<string, number>,
): string {
  if (mismatchCount === 0) {
    return 'All active services use the same currency code in confirmation and reminder messages.';
  }

  const breakdown = Object.entries(servicesByCurrency)
    .map(([code, count]) => `${count} in ${code}`)
    .join(', ');

  if (mismatchCount === 1) {
    return `1 active service still lists a legacy ISO code (${breakdown}) — its confirmation or reminder may show another symbol until the salon aligns the catalog.`;
  }

  return `${mismatchCount} active services still list legacy ISO codes (${breakdown}) — you may see mixed symbols across messages until the salon aligns the catalog.`;
}

export async function handleExplainNotificationCurrencyLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_notification_currency', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const defaultCurrency = getBusinessDefaultCurrency(settings);

  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    select: { id: true, name: true, currency: true },
  });

  const { mismatchCount, servicesByCurrency } = countServicesOnDifferentCurrency(
    services,
    defaultCurrency,
  );

  const displayLabel = describeCheckoutCurrencyDisplay(defaultCurrency);

  const summary = [
    `Confirmation emails, appointment reminders, and WhatsApp/SMS messages format amounts in ${displayLabel} (${defaultCurrency}) when the booked service has no legacy ISO code.`,
    'Each message resolves the currency symbol from that appointment\'s catalog service code (fallback to the salon business default).',
    formatNotificationLegacyNote(mismatchCount, servicesByCurrency),
    'The number shown reflects what was charged or quoted when the message was sent — paid bookings use the recorded amount paid; otherwise the service price or checkout quote.',
    'Monetary gift-card preset emails always use the business default currency code.',
  ].join(' ');

  return success('explain_notification_currency', summary, {
    currencyCode: defaultCurrency,
    displayCurrency: defaultCurrency,
    servicesOnDifferentCurrencyCount: mismatchCount,
    servicesByCurrency,
    totalActiveServices: services.length,
    usesPaidAmountWhenAvailable: true,
    giftCardPresetUsesBusinessDefault: true,
  });
}

function formatSettingsStripeWarningNote(
  connectReady: boolean,
  defaultCurrency: string,
  stripeCurrencySupported: boolean,
  supportedList: string,
): string {
  if (!connectReady) {
    return 'Stripe Connect is not linked yet — the Settings currency warning only appears after you connect a Stripe account and the business default is outside Stripe\'s supported charge list.';
  }

  if (stripeCurrencySupported) {
    return `Settings does not show a Stripe warning for ${defaultCurrency} — it is in Stripe's supported online card charge list (${supportedList}).`;
  }

  return `Settings shows the Stripe Connect warning because ${defaultCurrency} is not in Stripe's supported charge list. Online card checkout is unavailable for this currency.`;
}

function formatStripeCheckoutLegacyNote(
  mismatchCount: number,
  servicesByCurrency: Record<string, number>,
): string {
  if (mismatchCount === 0) {
    return 'All active services resolve to the same currency for Stripe checkout.';
  }

  const breakdown = Object.entries(servicesByCurrency)
    .map(([code, count]) => `${count} in ${code}`)
    .join(', ');

  if (mismatchCount === 1) {
    return `1 service still lists a legacy ISO code (${breakdown}) — its Stripe session may charge in another currency until the salon aligns the catalog.`;
  }

  return `${mismatchCount} services still list legacy ISO codes (${breakdown}) — checkout currency may vary by booked service until the salon aligns the catalog.`;
}

function formatStripeCheckoutAlternativeNote(
  stripeCurrencySupported: boolean,
  onlinePaymentsEnabled: boolean,
  acceptCashPayments: boolean,
): string {
  if (!onlinePaymentsEnabled) {
    return acceptCashPayments
      ? 'Stripe Connect is not linked — use cash or pay-at-venue for this booking.'
      : 'Online card checkout is not configured for this salon.';
  }

  if (stripeCurrencySupported) {
    return acceptCashPayments
      ? 'Cash or pay-at-venue remains available alongside online card checkout when this salon enables both.'
      : 'This checkout uses online card payment in the resolved currency.';
  }

  if (acceptCashPayments) {
    return 'stripeCurrencySupported is false for this currency — choose cash or pay-at-venue instead of online card checkout.';
  }

  return 'stripeCurrencySupported is false and cash pay-at-venue is not enabled — online card checkout may not be available for this currency.';
}

export async function handleExplainStripeCheckoutCurrencyLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_stripe_checkout_currency', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const defaultCurrency = getBusinessDefaultCurrency(settings);
  const stripeCurrencySupported =
    isStripeChargeCurrencySupported(defaultCurrency);
  const onlinePaymentsEnabled = Boolean(
    getBusinessStripeIntegration(settings).connectAccountId,
  );
  const acceptCashPayments =
    resolvePublicPaymentSettings(settings).acceptCashPayments;

  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    select: { id: true, name: true, currency: true },
  });

  const { mismatchCount, servicesByCurrency } = countServicesOnDifferentCurrency(
    services,
    defaultCurrency,
  );

  const displayLabel = describeCheckoutCurrencyDisplay(defaultCurrency);
  const chargePart = stripeCurrencySupported
    ? `Online Stripe checkout charges in ${displayLabel} (${defaultCurrency}) when the booked service has no legacy ISO code — each session uses resolvePriceCurrency on that service (fallback to the salon business default).`
    : `stripeCurrencySupported is false for ${defaultCurrency} — Stripe may not create an online card checkout session in this currency.`;

  const summary = [
    chargePart,
    formatStripeCheckoutLegacyNote(mismatchCount, servicesByCurrency),
    formatStripeCheckoutAlternativeNote(
      stripeCurrencySupported,
      onlinePaymentsEnabled,
      acceptCashPayments,
    ),
  ].join(' ');

  return success('explain_stripe_checkout_currency', summary, {
    currencyCode: defaultCurrency,
    displayCurrency: defaultCurrency,
    stripeCurrencySupported,
    onlinePaymentsEnabled,
    acceptCashPayments,
    payAtVenueAvailable: acceptCashPayments,
    servicesOnDifferentCurrencyCount: mismatchCount,
    servicesByCurrency,
    totalActiveServices: services.length,
  });
}

export async function handleExplainStripeCurrencyWarningLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_stripe_currency_warning', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const defaultCurrency = getBusinessDefaultCurrency(settings);
  const stripeCurrencySupported =
    isStripeChargeCurrencySupported(defaultCurrency);
  const connectReady = Boolean(
    getBusinessStripeIntegration(settings).connectAccountId,
  );
  const settingsStripeWarningVisible = connectReady && !stripeCurrencySupported;
  const stripeChargeCurrencies = listStripeChargeCurrencyCodes();
  const supportedList = stripeChargeCurrencies.join(', ');

  const alternativePart = stripeCurrencySupported
    ? 'Cash and pay-at-venue bookings remain available even when online card payments work.'
    : 'Cash and pay-at-venue bookings are unaffected — only online card collection is limited.';

  const summary = [
    formatSettingsStripeWarningNote(
      connectReady,
      defaultCurrency,
      stripeCurrencySupported,
      supportedList,
    ),
    `Stripe supports online card payments in: ${supportedList}.`,
    alternativePart,
  ].join(' ');

  return success('explain_stripe_currency_warning', summary, {
    currencyCode: defaultCurrency,
    defaultCurrency,
    stripeConnectReady: connectReady,
    stripeCurrencySupported,
    settingsStripeWarningVisible,
    stripeChargeCurrencies,
  });
}

function summarizeUnsupportedResolvedServiceCurrencies(
  services: Pick<Service, 'currency'>[],
  defaultCurrency: string,
  businessSettings: Record<string, unknown> | undefined,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const service of services) {
    const resolved = resolvePriceCurrency(service.currency, businessSettings);
    if (!isStripeChargeCurrencySupported(resolved)) {
      counts[resolved] = (counts[resolved] ?? 0) + 1;
    }
  }
  return counts;
}

export async function handleDiagnoseStripeCheckoutFailureLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('diagnose_stripe_checkout_failure', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const defaultCurrency = getBusinessDefaultCurrency(settings);
  const stripeCurrencySupported =
    isStripeChargeCurrencySupported(defaultCurrency);
  const connectReady = Boolean(
    getBusinessStripeIntegration(settings).connectAccountId,
  );
  const acceptCashPayments =
    resolvePublicPaymentSettings(settings).acceptCashPayments;
  const stripeChargeCurrencies = listStripeChargeCurrencyCodes();
  const supportedList = stripeChargeCurrencies.join(', ');

  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    select: { id: true, name: true, currency: true },
  });

  const { mismatchCount, servicesByCurrency } = countServicesOnDifferentCurrency(
    services,
    defaultCurrency,
  );
  const unsupportedResolvedByCurrency = summarizeUnsupportedResolvedServiceCurrencies(
    services,
    defaultCurrency,
    settings,
  );
  const unsupportedServiceCount = Object.values(unsupportedResolvedByCurrency).reduce(
    (sum, count) => sum + count,
    0,
  );

  const likelyCauses: string[] = [];
  const recommendedFixes: string[] = [];

  if (!connectReady) {
    likelyCauses.push(
      'Stripe Connect is not linked — createCheckoutSession calls assertCanAcceptOnlinePayments and fails before a session is created.',
    );
    recommendedFixes.push('Link Stripe Connect in Dashboard → Billing.');
  } else {
    likelyCauses.push(
      'Stripe Connect is linked but onboarding may be incomplete (charges not enabled) — finish setup in Billing if session creation still fails.',
    );
  }

  if (!stripeCurrencySupported) {
    likelyCauses.push(
      `${defaultCurrency} is outside Stripe's online card charge list — session creation fails when resolvePriceCurrency returns that ISO code.`,
    );
    recommendedFixes.push(
      `Switch the business default to a supported currency (${supportedList}) or enable cash/pay-at-venue while you migrate.`,
    );
  }

  if (unsupportedServiceCount > 0) {
    const breakdown = Object.entries(unsupportedResolvedByCurrency)
      .map(([code, count]) => `${count} resolving to ${code}`)
      .join(', ');
    likelyCauses.push(
      `${unsupportedServiceCount} active service(s) resolve to unsupported Stripe charge currencies (${breakdown}) — checkout for those bookings fails even when the business default is supported.`,
    );
    recommendedFixes.push(
      'Align legacy catalog ISO codes to the business default with bulk_update_service_currency.',
    );
  } else if (mismatchCount > 0) {
    const breakdown = Object.entries(servicesByCurrency)
      .map(([code, count]) => `${count} in ${code}`)
      .join(', ');
    likelyCauses.push(
      `${mismatchCount} service(s) still use legacy ISO codes (${breakdown}) — checkout may charge an unexpected supported currency until the catalog is aligned.`,
    );
    recommendedFixes.push(
      'Run bulk_update_service_currency to align catalog prices to the business default.',
    );
  }

  const cashFallbackPart = acceptCashPayments
    ? 'Cash or pay-at-venue is enabled — offer it when online checkout fails for unsupported currencies.'
    : 'Cash/pay-at-venue is not enabled — customers have no fallback when Stripe rejects the charge currency.';

  const summary = [
    'Common Stripe Connect checkout session failure causes for this tenant:',
    ...likelyCauses.map((cause, index) => `${index + 1}. ${cause}`),
    recommendedFixes.length
      ? `Recommended fixes: ${recommendedFixes.join(' ')}`
      : '',
    `Stripe supports online card charges in: ${supportedList}.`,
    cashFallbackPart,
  ]
    .filter(Boolean)
    .join(' ');

  return success('diagnose_stripe_checkout_failure', summary, {
    currencyCode: defaultCurrency,
    defaultCurrency,
    stripeConnectReady: connectReady,
    stripeCurrencySupported,
    acceptCashPayments,
    likelyCauses,
    recommendedFixes,
    servicesOnDifferentCurrencyCount: mismatchCount,
    servicesByCurrency,
    unsupportedResolvedServiceCount: unsupportedServiceCount,
    unsupportedResolvedByCurrency,
    stripeChargeCurrencies,
    totalActiveServices: services.length,
  });
}

export async function handleExplainReportsCurrencyLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_reports_currency', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const defaultCurrency = getBusinessDefaultCurrency(settings);
  const displayLabel = describeCheckoutCurrencyDisplay(defaultCurrency);

  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    select: { id: true, name: true, currency: true },
  });

  const { mismatchCount, servicesByCurrency } = countServicesOnDifferentCurrency(
    services,
    defaultCurrency,
  );

  const legacyPart =
    mismatchCount === 0
      ? 'Catalog prices use the same ISO code for new KPI totals.'
      : formatMismatchSummary(mismatchCount, servicesByCurrency) +
        ' Report totals still sum paid amounts in the business default — v1 does not re-denominate legacy service prices into another ISO code.';

  const summary = [
    `Dashboard overview revenue, Reports staff/service revenue columns, and Operations P&L KPIs (gross revenue, tax, net revenue, expenses, commissions, net profit) label amounts in ${displayLabel} (${defaultCurrency}), the salon business default.`,
    'Analytics APIs attach the same currency field to staff performance, service popularity, and profit-and-loss payloads — column headers use labels like Revenue (EUR) and Net profit (EUR).',
    'v1 uses a single currency per tenant: amounts are summed as-is with no FX conversion, exchange rates, or mixed-currency totals.',
    legacyPart,
    'Change what reports display by updating the business default currency in Settings; existing stored amounts are not automatically recalculated.',
  ].join(' ');

  return success('explain_reports_currency', summary, {
    currencyCode: defaultCurrency,
    defaultCurrency,
    displayCurrency: defaultCurrency,
    noFxConversion: true,
    reportSurfaces: [
      'dashboard-overview-revenue',
      'reports-staff-revenue',
      'reports-service-revenue',
      'operations-pl',
      'analytics-csv-export',
      'analytics-pdf-export',
    ],
    servicesOnDifferentCurrencyCount: mismatchCount,
    servicesByCurrency,
    totalActiveServices: services.length,
  });
}

function resolveRevenueKpiDateRange(
  params: Record<string, unknown>,
  prompt?: string,
): { from: string; to: string } {
  if (params.from && params.to) {
    return { from: String(params.from), to: String(params.to) };
  }

  const range = extractDateRangeFromPrompt(String(prompt ?? params._prompt ?? ''));
  if (range) {
    return { from: range.start, to: range.end };
  }

  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);
  return { from, to };
}

function formatTopRevenueLines(
  items: Array<{ label: string; revenue: number }>,
  currency: string,
  businessSettings: Record<string, unknown> | undefined,
  limit = 3,
): string {
  if (items.length === 0) return '';

  return items
    .slice(0, limit)
    .map(
      (item) =>
        `${item.label} ${formatBusinessMoney(item.revenue, businessSettings)}`,
    )
    .join(', ');
}

export async function handleSummarizeRevenueKpisLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  if (!deps.dashboardService || !deps.analyticsService) {
    return failure(
      'summarize_revenue_kpis',
      'Revenue KPI services are not configured.',
    );
  }

  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('summarize_revenue_kpis', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const { from, to } = resolveRevenueKpiDateRange(params, prompt);

  try {
    const [overview, staffReport, serviceReport] = await Promise.all([
      deps.dashboardService.getOverview(businessId),
      deps.analyticsService.staffPerformance(businessId, { from, to }),
      deps.analyticsService.servicePopularity(businessId, { from, to }),
    ]);

    const currency = overview.currency;
    const staffRevenueTotal = staffReport.rows.reduce(
      (sum, row) => sum + row.revenue,
      0,
    );
    const serviceRevenueTotal = serviceReport.rows.reduce(
      (sum, row) => sum + row.revenue,
      0,
    );

    const topStaff = [...staffReport.rows]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map((row) => ({ label: row.employeeName, revenue: row.revenue }));
    const topServices = [...serviceReport.rows]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map((row) => ({ label: row.serviceName, revenue: row.revenue }));

    const overviewRevenue = formatBusinessMoney(
      overview.revenueThisMonth,
      settings,
    );
    const overviewNet = formatBusinessMoney(
      overview.netRevenueThisMonth,
      settings,
    );
    const staffTotalLabel = formatBusinessMoney(staffRevenueTotal, settings);
    const serviceTotalLabel = formatBusinessMoney(serviceRevenueTotal, settings);

    const summary = [
      `Revenue KPI summary (${currency}) for ${from} to ${to}:`,
      `Dashboard overview — revenue this month ${overviewRevenue}, net ${overviewNet}, ${overview.bookingsThisMonth} bookings (${overview.completedThisMonth} completed).`,
      `Reports staff revenue ${staffTotalLabel} across ${staffReport.rows.length} provider(s)${topStaff.length ? `; top: ${formatTopRevenueLines(topStaff, currency, settings)}` : ''}.`,
      `Reports service revenue ${serviceTotalLabel} across ${serviceReport.rows.length} service(s)${topServices.length ? `; top: ${formatTopRevenueLines(topServices, currency, settings)}` : ''}.`,
      'All figures use the business default currency with no FX conversion.',
    ].join(' ');

    return success('summarize_revenue_kpis', summary, {
      currencyCode: currency,
      defaultCurrency: currency,
      period: { from, to },
      dashboardOverview: overview,
      staffReport,
      serviceReport,
      staffRevenueTotal,
      serviceRevenueTotal,
      noFxConversion: true,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Could not summarize revenue KPIs.';
    return failure('summarize_revenue_kpis', message);
  }
}

function buildBulkCurrencyConfirmationResult(
  prompt: string,
  defaultCurrency: string,
  mismatched: Pick<Service, 'id' | 'name' | 'currency'>[],
  fromCurrency?: string | null,
): CommandResult {
  const servicesByCurrency = summarizeServicesByCurrency(mismatched);
  const breakdown = Object.entries(servicesByCurrency)
    .map(([code, count]) => `${count} in ${code}`)
    .join(', ');
  const filterNote = fromCurrency
    ? ` (${fromCurrency} services only)`
    : '';

  return success(
    'bulk_update_service_currency',
    [
      `Ready to align ${mismatched.length} catalog service(s)${filterNote} to ${defaultCurrency}.`,
      breakdown ? `Current codes: ${breakdown}.` : '',
      'Prices stay the same — only the ISO currency code changes.',
      'Confirm below to execute.',
    ]
      .filter(Boolean)
      .join(' '),
    {
      requiresExecutionConfirmation: true,
      confirmationPrompt: prompt,
      interpretedAction: 'bulk_update_service_currency',
      previewParams: {
        targetCurrency: defaultCurrency,
        serviceCount: mismatched.length,
        servicesByCurrency,
        fromCurrency: fromCurrency ?? null,
      },
      targetCurrency: defaultCurrency,
      serviceCount: mismatched.length,
      servicesByCurrency,
      fromCurrency: fromCurrency ?? null,
    },
  );
}

export async function handleBulkUpdateServiceCurrencyLogic(
  deps: BusinessCurrencyLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt?: string,
  confirmed = false,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('bulk_update_service_currency', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const defaultCurrency = getBusinessDefaultCurrency(settings);
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const requestedCurrency = parseCurrencyFromPrompt(effectivePrompt, params);
  const fromCurrency =
    requestedCurrency && requestedCurrency !== defaultCurrency
      ? requestedCurrency
      : null;

  if (
    requestedCurrency &&
    requestedCurrency !== defaultCurrency &&
    !/\b(services?|catalog)\b/i.test(effectivePrompt)
  ) {
    return failure(
      'bulk_update_service_currency',
      `Bulk service currency migration aligns catalog rows to the current business default (${defaultCurrency}), not ${requestedCurrency}. Set the business default first, or ask to align services still on ${requestedCurrency}.`,
      {
        clarify: true,
        targetCurrency: defaultCurrency,
        requestedCurrency,
      },
    );
  }

  const services = await deps.serviceRepo.find({
    where: { businessId },
    select: { id: true, name: true, currency: true },
  });

  const mismatched = findMismatchedServices(
    services,
    defaultCurrency,
    fromCurrency,
  );

  if (!mismatched.length) {
    const filterLabel = fromCurrency ? ` in ${fromCurrency}` : '';
    return success(
      'bulk_update_service_currency',
      fromCurrency
        ? `No catalog services${filterLabel} need currency alignment — all matching services already use ${defaultCurrency}.`
        : `All catalog services already use the business default currency (${defaultCurrency}).`,
      {
        targetCurrency: defaultCurrency,
        serviceCount: 0,
        unchanged: true,
        fromCurrency,
      },
    );
  }

  if (!confirmed) {
    return buildBulkCurrencyConfirmationResult(
      effectivePrompt,
      defaultCurrency,
      mismatched,
      fromCurrency,
    );
  }

  await deps.serviceRepo.update(
    { id: In(mismatched.map((service) => service.id)), businessId },
    { currency: defaultCurrency },
  );

  const servicesByCurrency = summarizeServicesByCurrency(mismatched);
  const breakdown = Object.entries(servicesByCurrency)
    .map(([code, count]) => `${count} from ${code}`)
    .join(', ');

  return success(
    'bulk_update_service_currency',
    `Updated ${mismatched.length} catalog service(s) to ${defaultCurrency}${breakdown ? ` (${breakdown})` : ''}.`,
    {
      targetCurrency: defaultCurrency,
      serviceCount: mismatched.length,
      updatedServiceIds: mismatched.map((service) => service.id),
      servicesByCurrency,
      fromCurrency,
    },
  );
}
