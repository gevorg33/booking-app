import type { PublicGiftCardCatalogSettings, PublicGiftCardType } from './gift-card.types.js';
import type { PublicService } from './types.js';

export function resolveGiftCardAvailableTypes(
  settings: PublicGiftCardCatalogSettings,
): PublicGiftCardType[] {
  const types: PublicGiftCardType[] = [];
  if (settings.presetAmounts.length > 0) types.push('monetary');
  if (settings.purchasableServices.length > 0) types.push('service');
  if (settings.bundles.length > 0) types.push('bundle');
  if ((settings.purchasablePackages ?? []).length > 0) types.push('package');
  if ((settings.purchasableSubscriptionPlans ?? []).length > 0) types.push('subscription');
  return types;
}

export function buildGiftCardServicePriceMap(
  settings: PublicGiftCardCatalogSettings,
  services: PublicService[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of settings.purchasableServices) {
    const catalogPrice = entry.price != null ? Number(entry.price) : null;
    const listPrice = services.find((service) => service.id === entry.serviceId)?.price;
    map.set(entry.serviceId, catalogPrice ?? Number(listPrice ?? 0));
  }
  return map;
}

export function canContinueGiftCardCatalog(input: {
  cardType: PublicGiftCardType;
  amount: string;
  selectedServiceIds: string[];
  bundleId: string;
  packageId: string;
  subscriptionPlanId: string;
}): boolean {
  if (input.cardType === 'monetary') return Number(input.amount) > 0;
  if (input.cardType === 'service') return input.selectedServiceIds.length > 0;
  if (input.cardType === 'package') return Boolean(input.packageId);
  if (input.cardType === 'subscription') return Boolean(input.subscriptionPlanId);
  return Boolean(input.bundleId);
}

export function buildGiftCardCheckoutSearchParams(input: {
  cardType: PublicGiftCardType;
  amount: string;
  selectedServiceIds: string[];
  bundleId: string;
  packageId: string;
  subscriptionPlanId: string;
}): URLSearchParams {
  const params = new URLSearchParams({ cardType: input.cardType });
  if (input.cardType === 'monetary') params.set('amount', input.amount);
  if (input.cardType === 'service') {
    if (input.selectedServiceIds.length === 1) {
      params.set('serviceId', input.selectedServiceIds[0]);
    } else {
      params.set('serviceIds', input.selectedServiceIds.join(','));
    }
  }
  if (input.cardType === 'bundle') params.set('bundleId', input.bundleId);
  if (input.cardType === 'package') params.set('packageId', input.packageId);
  if (input.cardType === 'subscription') params.set('subscriptionPlanId', input.subscriptionPlanId);
  return params;
}

export function sumSelectedGiftCardServices(
  selectedServiceIds: string[],
  priceById: Map<string, number>,
): number {
  return selectedServiceIds.reduce((sum, id) => sum + (priceById.get(id) ?? 0), 0);
}

export function formatGiftCardCancelWindow(ms: number): string {
  if (ms <= 0) return '';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  return `${hours}h ${minutes}m left`;
}

/** e2e-bug.9 — distinguish disabled gift cards from a real load failure. */
export type GiftCardCatalogGate =
  | 'loading'
  | 'tenant_error'
  | 'catalog_error'
  | 'purchase_disabled'
  | 'ready';

export function resolveGiftCardCatalogGate(input: {
  bootstrapLoading: boolean;
  catalogLoading: boolean;
  bootstrapError?: string | null;
  hasProfile: boolean;
  hasSlug: boolean;
  catalogFetchFailed: boolean;
  purchaseEnabled?: boolean;
  hasSettings: boolean;
}): GiftCardCatalogGate {
  if (input.bootstrapLoading || input.catalogLoading) return 'loading';
  if (input.bootstrapError || !input.hasProfile || !input.hasSlug) return 'tenant_error';
  if (input.catalogFetchFailed) return 'catalog_error';
  if (input.purchaseEnabled === false || !input.hasSettings) return 'purchase_disabled';
  if (input.purchaseEnabled !== true) return 'purchase_disabled';
  return 'ready';
}
