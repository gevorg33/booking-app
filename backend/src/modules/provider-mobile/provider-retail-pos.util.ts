import { BookingStatus } from '../booking/entities/booking.entity.js';

/** Retail POS is available when admin configured at least one active product with a retail price. */
export function isProviderRetailPosEnabled(
  hasConfiguredRetailCatalog: boolean,
): boolean {
  return hasConfiguredRetailCatalog;
}

export function canProviderSaveRetailCart(bookingStatus: string): boolean {
  return bookingStatus !== BookingStatus.CANCELLED;
}

export function buildProviderRetailCartBlockedReason(
  bookingStatus: string,
): string | null {
  if (bookingStatus === BookingStatus.CANCELLED) {
    return 'Retail cart cannot be changed on a cancelled appointment';
  }
  return null;
}

/** prov-exp-5.2 — search / quick-add helpers (v1 search-only; barcode scan is future). */

export type RetailProductSearchable = {
  id: string;
  name: string;
  sku: string | null;
  quantityOnHand: number;
};

export type QuickAddRetailProductResult =
  | { status: 'empty' }
  | { status: 'exact_sku'; product: RetailProductSearchable }
  | { status: 'single_match'; product: RetailProductSearchable }
  | { status: 'no_match' }
  | { status: 'ambiguous'; matchCount: number }
  | { status: 'out_of_stock'; product: RetailProductSearchable };

export function normalizeRetailSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function filterRetailProductsBySearchQuery<
  T extends { name: string; sku: string | null },
>(products: T[], query: string): T[] {
  const normalized = normalizeRetailSearchQuery(query);
  if (!normalized) return products;
  return products.filter((product) => {
    const nameMatch = product.name.toLowerCase().includes(normalized);
    const skuMatch = product.sku?.toLowerCase().includes(normalized) ?? false;
    return nameMatch || skuMatch;
  });
}

export function resolveQuickAddRetailProduct<T extends RetailProductSearchable>(
  products: T[],
  query: string,
): QuickAddRetailProductResult {
  const normalized = normalizeRetailSearchQuery(query);
  if (!normalized) return { status: 'empty' };

  const exactSku = products.find(
    (product) => product.sku?.toLowerCase() === normalized,
  );
  if (exactSku) {
    if (exactSku.quantityOnHand <= 0) {
      return { status: 'out_of_stock', product: exactSku };
    }
    return { status: 'exact_sku', product: exactSku };
  }

  const matches = filterRetailProductsBySearchQuery(products, query);
  if (matches.length === 0) return { status: 'no_match' };
  if (matches.length > 1) {
    return { status: 'ambiguous', matchCount: matches.length };
  }

  const product = matches[0];
  if (product.quantityOnHand <= 0) {
    return { status: 'out_of_stock', product };
  }
  return { status: 'single_match', product };
}
