import { describe, expect, it } from 'vitest';
import {
  filterRetailProductsBySearchQuery,
  resolveQuickAddRetailProduct,
} from './provider-retail-pos-search.util';

const catalog = [
  {
    id: 'prod-shampoo',
    name: 'Shampoo Pro',
    sku: 'SHP-001',
    quantityOnHand: 10,
  },
  {
    id: 'prod-conditioner',
    name: 'Conditioner Lux',
    sku: 'CON-002',
    quantityOnHand: 5,
  },
  {
    id: 'prod-serum',
    name: 'Hair Serum',
    sku: 'SER-003',
    quantityOnHand: 0,
  },
  {
    id: 'prod-brush',
    name: 'Detangling Brush',
    sku: null,
    quantityOnHand: 8,
  },
];

describe('provider-retail-pos-search.util (prov-exp-5.2)', () => {
  it('filters by sku or name', () => {
    expect(
      filterRetailProductsBySearchQuery(catalog, 'con-002').map((p) => p.id),
    ).toEqual(['prod-conditioner']);
    expect(
      filterRetailProductsBySearchQuery(catalog, 'brush').map((p) => p.id),
    ).toEqual(['prod-brush']);
  });

  it('quick-adds on exact sku', () => {
    expect(resolveQuickAddRetailProduct(catalog, 'SHP-001')).toMatchObject({
      status: 'exact_sku',
      product: { id: 'prod-shampoo' },
    });
  });

  it('blocks out-of-stock quick-add', () => {
    expect(resolveQuickAddRetailProduct(catalog, 'SER-003')).toMatchObject({
      status: 'out_of_stock',
      product: { id: 'prod-serum' },
    });
  });

  it('returns ambiguous when multiple products match', () => {
    expect(resolveQuickAddRetailProduct(catalog, 'r').status).toBe('ambiguous');
  });
});
