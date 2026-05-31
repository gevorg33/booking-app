import {
  allocatePackageLinePricing,
  type PackageLineAllocation,
} from './service-package-pricing';
import type { PublicPackageItem, PublicServicePackage } from './public-api';

export type PackageItemWithPricing = PublicPackageItem & PackageLineAllocation;

export function resolvePackageItemPricing(
  pkg: Pick<PublicServicePackage, 'items' | 'pricing'>,
): PackageItemWithPricing[] {
  const allocations = allocatePackageLinePricing(
    pkg.items.map((item) => ({ unitPrice: item.unitPrice, quantity: item.quantity })),
    pkg.pricing.packagePrice,
  );

  return pkg.items.map((item, index) => {
    const allocation = allocations[index];
    return {
      ...item,
      lineTotal: item.lineTotal ?? allocation.lineTotal,
      discountedLineTotal: item.discountedLineTotal ?? allocation.discountedLineTotal,
      lineSavings: item.lineSavings ?? allocation.lineSavings,
    };
  });
}
