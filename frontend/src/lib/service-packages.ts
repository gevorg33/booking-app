import { calculatePackagePricing, type PackageDiscountType } from './service-package-pricing';
import {
  emptyLocalizedNamesForm,
  localizedNamesFromApi,
  localizedNamesToPayload,
  type LocalizedNamesFormState,
  type LocalizedNamesMap,
} from './localized-names';

export type PackageStatus = 'active' | 'inactive' | 'expired';

export interface ServicePackageItemInput {
  serviceId: string;
  quantity: number;
}

export interface ServicePackageRecord {
  id: string;
  name: string;
  localizedNames?: LocalizedNamesMap;
  description?: string | null;
  imageUrl?: string | null;
  discountType: PackageDiscountType;
  discountValue: number;
  displayOrder: number;
  isActive: boolean;
  expiresAt?: string | null;
  status?: PackageStatus;
  items?: Array<{
    serviceId: string;
    quantity: number;
    service?: { id: string; name: string; price: number; durationMinutes?: number };
  }>;
  preview?: {
    pricing?: {
      regularTotal?: number;
      packagePrice?: number;
      savings?: number;
      savingsPercent?: number;
    };
  };
}

export function isPackageExpired(
  expiresAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < now;
}

export function resolvePackageStatus(
  pkg: Pick<ServicePackageRecord, 'isActive' | 'expiresAt'>,
  now = Date.now(),
): PackageStatus {
  if (!pkg.isActive) return 'inactive';
  if (isPackageExpired(pkg.expiresAt, now)) return 'expired';
  return 'active';
}

export function formatPackageSavings(
  savings: number,
  savingsPercent: number,
  currency = 'USD',
): string {
  return `Save ${savingsPercent.toFixed(0)}% (${formatMoney(savings, currency)})`;
}

export function previewPackageFromForm(options: {
  selectedItems: Array<{ serviceId: string; quantity: number; unitPrice: number }>;
  discountType: PackageDiscountType;
  discountValue: number;
}) {
  return calculatePackagePricing(
    options.selectedItems.map((item) => ({
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
    options.discountType,
    options.discountValue,
  );
}

export function buildPackageItemsPayload(
  selectedServiceIds: string[],
  quantities: Record<string, number>,
): ServicePackageItemInput[] {
  return selectedServiceIds.map((serviceId) => ({
    serviceId,
    quantity: Math.max(1, quantities[serviceId] ?? 1),
  }));
}

export function togglePackageServiceSelection(
  selected: string[],
  serviceId: string,
): string[] {
  return selected.includes(serviceId)
    ? selected.filter((id) => id !== serviceId)
    : [...selected, serviceId];
}

export function packageToFormState(pkg: ServicePackageRecord) {
  const selectedServiceIds = (pkg.items ?? []).map((item) => item.serviceId);
  const quantities = Object.fromEntries(
    (pkg.items ?? []).map((item) => [item.serviceId, item.quantity]),
  );
  return {
    name: pkg.name,
    localizedNames: localizedNamesFromApi(pkg.localizedNames),
    description: pkg.description ?? '',
    imageUrl: pkg.imageUrl ?? '',
    discountType: pkg.discountType,
    discountValue: String(pkg.discountValue),
    displayOrder: String(pkg.displayOrder ?? 0),
    expiresAtDay: pkg.expiresAt ? pkg.expiresAt.slice(0, 10) : '',
    selectedServiceIds,
    quantities,
  };
}

export type PackageFormState = {
  name: string;
  localizedNames: LocalizedNamesFormState;
  description: string;
  imageUrl: string;
  discountType: PackageDiscountType;
  discountValue: string;
  displayOrder: string;
  expiresAtDay: string;
  selectedServiceIds: string[];
  quantities: Record<string, number>;
};

export function defaultPackageFormState(): PackageFormState {
  return {
    name: '',
    localizedNames: emptyLocalizedNamesForm(),
    description: '',
    imageUrl: '',
    discountType: 'percent',
    discountValue: '15',
    displayOrder: '0',
    expiresAtDay: '',
    selectedServiceIds: [],
    quantities: {},
  };
}

export function packageLocalizedNamesPayload(
  form: Pick<PackageFormState, 'localizedNames'>,
) {
  return localizedNamesToPayload(form.localizedNames);
}

function formatMoney(value: number, currency: string): string {
  try {
    // e2e-bug.115 — pin locale; bare `undefined` follows runtime ICU defaults.
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}
