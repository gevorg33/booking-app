import type { Product } from './inventory.entity.js';

/**
 * Build a complete `Product` for tests.
 *
 * Specs build it as `{ id, name, retailPrice }`. The omitted fields include
 * `quantityOnHand` and `reorderLevel` — the pair that decides whether a product
 * is recommendable at all — so a partial literal cannot exercise a stock
 * decision.
 *
 * Defaults are inert: an active, in-stock product with no image or external
 * link.
 */
export function makeProduct(partial: Partial<Product> = {}): Product {
  return {
    id: 'product-test',
    businessId: 'biz-test',
    locationId: '',
    name: 'Test product',
    sku: 'SKU-TEST',
    unitCost: 0,
    retailPrice: 0,
    quantityOnHand: 0,
    reorderLevel: 0,
    isActive: true,
    description: null,
    imageUrl: null,
    externalLink: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}
