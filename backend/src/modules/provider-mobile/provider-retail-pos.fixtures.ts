/** prov-exp-5.1 — provider mobile retail cart scenarios. */

import type { RetailProductSearchable } from './provider-retail-pos.util.js';

export const PROVIDER_RETAIL_POS_CATALOG_FIXTURE: RetailProductSearchable[] = [
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

export const PROVIDER_RETAIL_POS_FILTER_SCENARIOS = [
  {
    id: 'empty-query-shows-all',
    query: '',
    expectedIds: [
      'prod-shampoo',
      'prod-conditioner',
      'prod-serum',
      'prod-brush',
    ],
  },
  {
    id: 'whitespace-query-shows-all',
    query: '   ',
    expectedIds: [
      'prod-shampoo',
      'prod-conditioner',
      'prod-serum',
      'prod-brush',
    ],
  },
  {
    id: 'sku-partial-match',
    query: 'shp',
    expectedIds: ['prod-shampoo'],
  },
  {
    id: 'sku-case-insensitive',
    query: 'con-002',
    expectedIds: ['prod-conditioner'],
  },
  {
    id: 'name-partial-match',
    query: 'hair',
    expectedIds: ['prod-serum'],
  },
  {
    id: 'name-shared-token-ambiguous-list',
    query: 'pro',
    expectedIds: ['prod-shampoo'],
  },
  {
    id: 'no-match',
    query: 'wax-999',
    expectedIds: [] as string[],
  },
  {
    id: 'name-without-sku',
    query: 'brush',
    expectedIds: ['prod-brush'],
  },
] as const;

export const PROVIDER_RETAIL_POS_QUICK_ADD_SCENARIOS = [
  {
    id: 'empty-query',
    query: '',
    expectedStatus: 'empty',
  },
  {
    id: 'exact-sku-match',
    query: 'CON-002',
    expectedStatus: 'exact_sku',
    productId: 'prod-conditioner',
  },
  {
    id: 'exact-sku-lowercase',
    query: 'shp-001',
    expectedStatus: 'exact_sku',
    productId: 'prod-shampoo',
  },
  {
    id: 'single-name-match',
    query: 'Detangling',
    expectedStatus: 'single_match',
    productId: 'prod-brush',
  },
  {
    id: 'no-match',
    query: 'missing-sku',
    expectedStatus: 'no_match',
  },
  {
    id: 'ambiguous-name',
    query: 'r',
    expectedStatus: 'ambiguous',
  },
  {
    id: 'out-of-stock-sku',
    query: 'SER-003',
    expectedStatus: 'out_of_stock',
    productId: 'prod-serum',
  },
] as const;

export const PROVIDER_RETAIL_POS_ELIGIBILITY_SCENARIOS = [
  {
    id: 'enabled-with-catalog',
    configuredRetailProductCount: 2,
    bookingStatus: 'confirmed',
    expectedEnabled: true,
    expectedCanSave: true,
  },
  {
    id: 'disabled-no-catalog',
    configuredRetailProductCount: 0,
    bookingStatus: 'confirmed',
    expectedEnabled: false,
    expectedCanSave: true,
  },
  {
    id: 'blocked-cancelled',
    configuredRetailProductCount: 3,
    bookingStatus: 'cancelled',
    expectedEnabled: true,
    expectedCanSave: false,
  },
] as const;
