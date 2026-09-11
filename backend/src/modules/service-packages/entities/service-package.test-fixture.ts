import type {
  PackagePurchase,
  ServicePackage,
} from './service-package.entity.js';

/**
 * Build a complete `ServicePackage` for tests.
 *
 * 15 properties; specs build it as `{ id, metadata }`. The omitted fields
 * include `discountType`, `discountValue` and `expiresAt` — what a package
 * actually is — so a two-field literal cannot exercise a pricing or expiry
 * decision.
 *
 * Defaults are inert: an active, non-expiring package with no discount and no
 * items. The `business` relation is left unpopulated the way a query without
 * `relations` returns it.
 */
export function makeServicePackage(
  partial: Partial<ServicePackage> = {},
): ServicePackage {
  return {
    id: 'package-test',
    businessId: 'biz-test',
    business: undefined as unknown as ServicePackage['business'],
    name: 'Test package',
    description: null,
    imageUrl: null,
    // `'percent'` — `PackageDiscountType` is `'percent' | 'fixed'`. The entity
    // column is `string`, which let an invented `'percentage'` typecheck here
    // while being a value the pricing util does not recognise.
    discountType: 'percent',
    discountValue: 0,
    displayOrder: 0,
    isActive: true,
    expiresAt: null,
    metadata: {},
    items: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}

/**
 * Build a complete `PackagePurchase` for tests.
 *
 * Specs build it as `{ id }`. `pricePaid` and `currency` — what a purchase *is*
 * — were absent, so a one-field literal cannot exercise a refund or receipt
 * decision.
 */
export function makePackagePurchase(
  partial: Partial<PackagePurchase> = {},
): PackagePurchase {
  return {
    id: 'purchase-test',
    businessId: 'biz-test',
    business: undefined as unknown as PackagePurchase['business'],
    packageId: 'package-test',
    package: undefined as unknown as PackagePurchase['package'],
    customerId: null,
    customer: null,
    pricePaid: 0,
    currency: 'USD',
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}
