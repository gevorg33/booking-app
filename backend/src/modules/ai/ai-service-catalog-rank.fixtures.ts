import type {
  PickRankedServicesOptions,
  ServiceCatalogPriceEntry,
} from './ai-service-catalog-rank.util.js';

type CatalogFixtureService = ServiceCatalogPriceEntry & {
  id: string;
  name: string;
  serviceCategory?: string;
};

export type { CatalogFixtureService };

export const FILTER_SERVICES_BY_MAX_PRICE_SCENARIOS: Array<{
  id: string;
  services: CatalogFixtureService[];
  maxPrice: number;
  expectedIds: string[];
}> = [
  {
    id: 'budget-empty-catalog',
    services: [],
    maxPrice: 50,
    expectedIds: [],
  },
  {
    id: 'budget-multiple-matches',
    services: [
      { id: 'hair-55', name: 'Haircut premium', price: 55 },
      { id: 'hair-35', name: 'Haircut basic', price: 35 },
      { id: 'hair-45', name: 'Haircut standard', price: 45 },
    ],
    maxPrice: 50,
    expectedIds: ['hair-35', 'hair-45'],
  },
  {
    id: 'budget-exact-at-ceiling',
    services: [{ id: 'massage-50', name: 'Massage', price: 50 }],
    maxPrice: 50,
    expectedIds: ['massage-50'],
  },
  {
    id: 'budget-excludes-null-price',
    services: [
      { id: 'priced', name: 'Priced', price: 40 },
      { id: 'null-price', name: 'Quote only', price: null },
      { id: 'undefined-price', name: 'TBD', price: undefined },
    ],
    maxPrice: 50,
    expectedIds: ['priced'],
  },
  {
    id: 'budget-no-match',
    services: [
      { id: 'facial-55', name: 'Facial', price: 55 },
      { id: 'facial-60', name: 'Facial deluxe', price: 60 },
    ],
    maxPrice: 50,
    expectedIds: [],
  },
  {
    id: 'budget-decimal-ceiling',
    services: [
      { id: 'trim-4999', name: 'Trim', price: 49.99 },
      { id: 'trim-5001', name: 'Trim plus', price: 50.01 },
    ],
    maxPrice: 50,
    expectedIds: ['trim-4999'],
  },
];

export const SORT_SERVICES_BY_PRICE_ASC_SCENARIOS: Array<{
  id: string;
  services: CatalogFixtureService[];
  expectedIds: string[];
}> = [
  {
    id: 'sort-empty-catalog',
    services: [],
    expectedIds: [],
  },
  {
    id: 'sort-equal-prices-by-name',
    services: [
      { id: 'c', name: 'Cut C', price: 40 },
      { id: 'a', name: 'Cut A', price: 40 },
      { id: 'b', name: 'Cut B', price: 40 },
    ],
    expectedIds: ['a', 'b', 'c'],
  },
  {
    id: 'sort-null-prices-last',
    services: [
      { id: 'null', name: 'Quote', price: null },
      { id: 'cheap', name: 'Cheap', price: 25 },
      { id: 'mid', name: 'Mid', price: 40 },
    ],
    expectedIds: ['cheap', 'mid', 'null'],
  },
  {
    id: 'rank-lowest-standard-tier-en',
    services: [
      {
        id: 'prem-low',
        name: 'Premium lite',
        price: 50,
        serviceTier: 'premium',
      },
      {
        id: 'std-high',
        name: 'Standard plus',
        price: 80,
        serviceTier: 'standard',
      },
    ],
    expectedIds: ['std-high', 'prem-low'],
  },
  {
    id: 'sort-mixed-order',
    services: [
      { id: 'high', name: 'High', price: 80 },
      { id: 'low', name: 'Low', price: 20 },
      { id: 'mid', name: 'Mid', price: 50 },
    ],
    expectedIds: ['low', 'mid', 'high'],
  },
  {
    id: 'sort-equal-prices-by-duration-then-name',
    services: [
      { id: 'b', name: 'Cut B', price: 80, durationMinutes: 45 },
      { id: 'a', name: 'Cut A', price: 80, durationMinutes: 90 },
      { id: 'c', name: 'Cut C', price: 80, durationMinutes: 60 },
    ],
    expectedIds: ['a', 'c', 'b'],
  },
];

export const SORT_SERVICES_BY_PRICE_DESC_SCENARIOS: Array<{
  id: string;
  services: CatalogFixtureService[];
  expectedIds: string[];
}> = [
  {
    id: 'sort-desc-empty-catalog',
    services: [],
    expectedIds: [],
  },
  {
    id: 'sort-desc-mixed-order',
    services: [
      { id: 'low', name: 'Low', price: 20 },
      { id: 'high', name: 'High', price: 80 },
      { id: 'mid', name: 'Mid', price: 50 },
    ],
    expectedIds: ['high', 'mid', 'low'],
  },
  {
    id: 'sort-desc-equal-prices-by-duration',
    services: [
      { id: 'b', name: 'Deluxe B', price: 100, durationMinutes: 60 },
      { id: 'a', name: 'Deluxe A', price: 100, durationMinutes: 90 },
    ],
    expectedIds: ['a', 'b'],
  },
  {
    id: 'rank-featured-flag-en',
    services: [
      { id: 'expensive', name: 'Deluxe cut', price: 120 },
      { id: 'featured', name: 'Featured cut', price: 80, isFeatured: true },
    ],
    expectedIds: ['featured', 'expensive'],
  },
  {
    id: 'rank-tier-metadata-en',
    services: [
      {
        id: 'std-high',
        name: 'Standard plus',
        price: 100,
        serviceTier: 'standard',
      },
      {
        id: 'prem-low',
        name: 'Premium lite',
        price: 70,
        serviceTier: 'premium',
      },
    ],
    expectedIds: ['prem-low', 'std-high'],
  },
];

export const PICK_RANKED_SERVICES_SCENARIOS: Array<{
  id: string;
  catalog: CatalogFixtureService[];
  options: PickRankedServicesOptions;
  expectedIds: string[];
}> = [
  {
    id: 'pick-empty-catalog',
    catalog: [],
    options: { serviceRank: 'highest_price', limit: 1 },
    expectedIds: [],
  },
  {
    id: 'pick-highest-single',
    catalog: [
      {
        id: 'basic',
        name: 'Haircut basic',
        price: 35,
        serviceCategory: 'haircut',
      },
      {
        id: 'premium',
        name: 'Haircut premium',
        price: 85,
        serviceCategory: 'haircut',
      },
      {
        id: 'standard',
        name: 'Haircut standard',
        price: 55,
        serviceCategory: 'haircut',
      },
    ],
    options: {
      serviceCategory: 'haircut',
      serviceRank: 'highest_price',
      limit: 1,
    },
    expectedIds: ['premium'],
  },
  {
    id: 'pick-lowest-single',
    catalog: [
      {
        id: 'basic',
        name: 'Haircut basic',
        price: 35,
        serviceCategory: 'haircut',
      },
      {
        id: 'premium',
        name: 'Haircut premium',
        price: 85,
        serviceCategory: 'haircut',
      },
    ],
    options: {
      serviceCategory: 'haircut',
      serviceRank: 'lowest_price',
      limit: 1,
    },
    expectedIds: ['basic'],
  },
  {
    id: 'pick-missing-price-excluded',
    catalog: [
      {
        id: 'quote-only',
        name: 'Custom quote',
        price: null,
        serviceCategory: 'color',
      },
      {
        id: 'priced-color',
        name: 'Color basic',
        price: 80,
        serviceCategory: 'color',
      },
    ],
    options: {
      serviceCategory: 'color',
      serviceRank: 'highest_price',
      limit: 1,
    },
    expectedIds: ['priced-color'],
  },
  {
    id: 'pick-highest-top-three',
    catalog: [
      { id: 'a', name: 'Style A', price: 40, serviceCategory: 'styling' },
      { id: 'b', name: 'Style B', price: 120, serviceCategory: 'styling' },
      { id: 'c', name: 'Style C', price: 80, serviceCategory: 'styling' },
      { id: 'd', name: 'Style D', price: 100, serviceCategory: 'styling' },
    ],
    options: {
      serviceCategory: 'styling',
      serviceRank: 'highest_price',
      limit: 3,
    },
    expectedIds: ['b', 'd', 'c'],
  },
  {
    id: 'pick-tie-duration-wins',
    catalog: [
      {
        id: 'short',
        name: 'Premium short',
        price: 100,
        durationMinutes: 45,
        serviceCategory: 'massage',
      },
      {
        id: 'long',
        name: 'Premium long',
        price: 100,
        durationMinutes: 90,
        serviceCategory: 'massage',
      },
    ],
    options: { serviceRank: 'highest_price', limit: 1 },
    expectedIds: ['long'],
  },
  {
    id: 'pick-category-filter-first',
    catalog: [
      {
        id: 'hair-120',
        name: 'Color deluxe',
        price: 120,
        serviceCategory: 'hair color',
      },
      {
        id: 'facial-90',
        name: 'Facial gold',
        price: 90,
        serviceCategory: 'facial',
      },
      {
        id: 'hair-80',
        name: 'Color basic',
        price: 80,
        serviceCategory: 'hair color',
      },
    ],
    options: {
      serviceCategory: 'hair color',
      serviceRank: 'highest_price',
      limit: 1,
    },
    expectedIds: ['hair-120'],
  },
  {
    id: 'pick-most-popular',
    catalog: [
      { id: 'quiet', name: 'Quiet cut', price: 30, bookingCount: 12 },
      { id: 'popular', name: 'Popular cut', price: 45, bookingCount: 240 },
      { id: 'steady', name: 'Steady cut', price: 40, bookingCount: 80 },
    ],
    options: { serviceRank: 'most_popular', limit: 2 },
    expectedIds: ['popular', 'steady'],
  },
  {
    id: 'pick-no-rank-respects-limit',
    catalog: [
      { id: 'a', name: 'A', price: 10 },
      { id: 'b', name: 'B', price: 20 },
      { id: 'c', name: 'C', price: 30 },
    ],
    options: { limit: 2 },
    expectedIds: ['a', 'b'],
  },
  {
    id: 'rank-name-premium-fallback',
    catalog: [
      { id: 'named-premium', name: 'Haircut premium', price: 55 },
      { id: 'named-basic', name: 'Haircut basic', price: 35 },
    ],
    options: { serviceRank: 'highest_price', limit: 1 },
    expectedIds: ['named-premium'],
  },
  {
    id: 'pick-featured-over-price',
    catalog: [
      { id: 'expensive', name: 'Deluxe cut', price: 120 },
      { id: 'featured', name: 'Featured cut', price: 80, isFeatured: true },
    ],
    options: { serviceRank: 'highest_price', limit: 1 },
    expectedIds: ['featured'],
  },
  {
    id: 'pick-premium-tier-over-price',
    catalog: [
      {
        id: 'std-high',
        name: 'Standard plus',
        price: 100,
        serviceTier: 'standard',
      },
      {
        id: 'prem-low',
        name: 'Premium lite',
        price: 70,
        serviceTier: 'premium',
      },
    ],
    options: { serviceRank: 'highest_price', limit: 1 },
    expectedIds: ['prem-low'],
  },
  {
    id: 'pick-most-popular-within-category',
    catalog: [
      {
        id: 'hair-quiet',
        name: 'Haircut basic',
        price: 35,
        serviceCategory: 'haircut',
        bookingCount: 12,
      },
      {
        id: 'hair-popular',
        name: 'Haircut deluxe',
        price: 55,
        serviceCategory: 'haircut',
        bookingCount: 240,
      },
      {
        id: 'facial-popular',
        name: 'Facial gold',
        price: 90,
        serviceCategory: 'facial',
        bookingCount: 500,
      },
    ],
    options: {
      serviceCategory: 'haircut',
      serviceRank: 'most_popular',
      limit: 1,
    },
    expectedIds: ['hair-popular'],
  },
];

/** Shared with budget handler specs — filter outcomes must stay aligned (rank-1.10 / budget-1.10). */
export const SHARED_BUDGET_FILTER_SCENARIO_IDS = [
  'budget-multiple-matches',
  'budget-exact-at-ceiling',
] as const;

export const DISCOVER_INTERSECTION_CATALOG: CatalogFixtureService[] = [
  {
    id: 'hair-35',
    name: 'Haircut basic',
    price: 35,
    serviceCategory: 'haircut',
  },
  {
    id: 'hair-45',
    name: 'Haircut standard',
    price: 45,
    serviceCategory: 'haircut',
  },
  {
    id: 'hair-75',
    name: 'Haircut premium',
    price: 75,
    serviceCategory: 'haircut',
  },
  {
    id: 'facial-55',
    name: 'Facial standard',
    price: 55,
    serviceCategory: 'facial',
  },
  {
    id: 'facial-95',
    name: 'Facial deluxe',
    price: 95,
    serviceCategory: 'facial',
  },
  {
    id: 'facial-120',
    name: 'Facial luxury',
    price: 120,
    serviceCategory: 'facial',
  },
];

export const DISCOVER_SECTION_A_MASSAGE_CATALOG: CatalogFixtureService[] = [
  {
    id: 'massage-55',
    name: 'Massage basic',
    price: 55,
    serviceCategory: 'massage',
  },
  {
    id: 'massage-65',
    name: 'Massage standard',
    price: 65,
    serviceCategory: 'massage',
  },
  {
    id: 'massage-95',
    name: 'Massage premium',
    price: 95,
    serviceCategory: 'massage',
  },
];

export const RESOLVE_SERVICE_DISCOVERY_PARAMS_SCENARIOS: Array<{
  id: string;
  params: Record<string, unknown>;
  expected: {
    maxPrice: number | null;
    serviceRank: 'highest_price' | 'lowest_price' | 'most_popular' | null;
    serviceCategory: string | null;
    serviceTier: 'standard' | 'premium' | null;
    limit: number | null;
    hasBudget: boolean;
    hasRank: boolean;
    hasTier: boolean;
  };
}> = [
  {
    id: 'discover-budget-only',
    params: { maxPrice: 50, serviceCategory: 'haircut' },
    expected: {
      maxPrice: 50,
      serviceRank: null,
      serviceCategory: 'haircut',
      serviceTier: null,
      limit: null,
      hasBudget: true,
      hasRank: false,
      hasTier: false,
    },
  },
  {
    id: 'discover-rank-only',
    params: { serviceRank: 'highest_price', serviceCategory: 'facial' },
    expected: {
      maxPrice: null,
      serviceRank: 'highest_price',
      serviceCategory: 'facial',
      serviceTier: null,
      limit: null,
      hasBudget: false,
      hasRank: true,
      hasTier: false,
    },
  },
  {
    id: 'discover-tier-filter-only',
    params: { serviceTier: 'premium', serviceCategory: 'color' },
    expected: {
      maxPrice: null,
      serviceRank: null,
      serviceCategory: 'color',
      serviceTier: 'premium',
      limit: null,
      hasBudget: false,
      hasRank: false,
      hasTier: true,
    },
  },
  {
    id: 'discover-budget-rank-intersection',
    params: {
      maxPrice: 50,
      serviceRank: 'lowest_price',
      serviceCategory: 'haircut',
      limit: 1,
    },
    expected: {
      maxPrice: 50,
      serviceRank: 'lowest_price',
      serviceCategory: 'haircut',
      serviceTier: null,
      limit: 1,
      hasBudget: true,
      hasRank: true,
      hasTier: false,
    },
  },
  {
    id: 'discover-invalid-maxPrice',
    params: { maxPrice: -1, serviceRank: 'lowest_price' },
    expected: {
      maxPrice: null,
      serviceRank: 'lowest_price',
      serviceCategory: null,
      serviceTier: null,
      limit: null,
      hasBudget: false,
      hasRank: true,
      hasTier: false,
    },
  },
  {
    id: 'discover-invalid-rank',
    params: { maxPrice: 80, serviceRank: 'premium' },
    expected: {
      maxPrice: 80,
      serviceRank: null,
      serviceCategory: null,
      serviceTier: null,
      limit: null,
      hasBudget: true,
      hasRank: false,
      hasTier: false,
    },
  },
];

/** Cross-sprint budget + rank intersection golden rows (discover-1.1 / ai-cmd-discover section A). */
export const APPLY_SERVICE_DISCOVERY_TO_CATALOG_SCENARIOS: Array<{
  id: string;
  catalog: CatalogFixtureService[];
  params: Record<string, unknown>;
  expectedIds: string[];
}> = [
  {
    id: 'discover-cheapest-under-en',
    catalog: DISCOVER_INTERSECTION_CATALOG,
    params: {
      maxPrice: 50,
      serviceRank: 'lowest_price',
      serviceCategory: 'haircut',
      limit: 1,
    },
    expectedIds: ['hair-35'],
  },
  {
    id: 'discover-premium-under-en',
    catalog: DISCOVER_INTERSECTION_CATALOG,
    params: {
      maxPrice: 120,
      serviceRank: 'highest_price',
      serviceCategory: 'facial',
      limit: 1,
    },
    expectedIds: ['facial-120'],
  },
  {
    id: 'discover-value-or-premium-en',
    catalog: DISCOVER_SECTION_A_MASSAGE_CATALOG,
    params: {
      maxPrice: 80,
      serviceCategory: 'massage',
    },
    expectedIds: ['massage-55', 'massage-65'],
  },
  {
    id: 'discover-no-premium-in-budget-en',
    catalog: DISCOVER_INTERSECTION_CATALOG,
    params: {
      maxPrice: 30,
      serviceRank: 'highest_price',
      serviceCategory: 'haircut',
      limit: 1,
    },
    expectedIds: [],
  },
  {
    id: 'discover-rank-premium-only',
    catalog: DISCOVER_INTERSECTION_CATALOG,
    params: {
      serviceRank: 'highest_price',
      serviceCategory: 'facial',
      limit: 1,
    },
    expectedIds: ['facial-120'],
  },
  {
    id: 'discover-premium-tomorrow-en',
    catalog: DISCOVER_INTERSECTION_CATALOG,
    params: {
      serviceRank: 'highest_price',
      serviceCategory: 'facial',
      limit: 1,
    },
    expectedIds: ['facial-120'],
  },
  {
    id: 'discover-budget-asap-en',
    catalog: [
      {
        id: 'manicure-25',
        name: 'Manicure basic',
        price: 25,
        serviceCategory: 'manicure',
      },
      {
        id: 'hair-35',
        name: 'Haircut basic',
        price: 35,
        serviceCategory: 'haircut',
      },
      {
        id: 'manicure-40',
        name: 'Manicure deluxe',
        price: 40,
        serviceCategory: 'manicure',
      },
      {
        id: 'hair-45',
        name: 'Haircut standard',
        price: 45,
        serviceCategory: 'haircut',
      },
    ],
    params: { maxPrice: 40, limit: 1 },
    expectedIds: ['manicure-25'],
  },
  {
    id: 'discover-budget-weekend-en',
    catalog: DISCOVER_SECTION_A_MASSAGE_CATALOG,
    params: { maxPrice: 70, serviceCategory: 'massage' },
    expectedIds: ['massage-55', 'massage-65'],
  },
  {
    id: 'discover-flagship-book-en',
    catalog: DISCOVER_SECTION_A_MASSAGE_CATALOG,
    params: {
      maxPrice: 80,
      serviceRank: 'lowest_price',
      serviceCategory: 'massage',
      limit: 1,
    },
    expectedIds: ['massage-55'],
  },
  {
    id: 'discover-flagship-premium-en',
    catalog: [
      {
        id: 'style-120',
        name: 'Styling premium',
        price: 120,
        serviceCategory: 'styling',
      },
      {
        id: 'style-140',
        name: 'Styling luxury',
        price: 140,
        serviceCategory: 'styling',
      },
    ],
    params: {
      maxPrice: 150,
      serviceRank: 'highest_price',
      serviceCategory: 'styling',
      limit: 1,
    },
    expectedIds: ['style-140'],
  },
  {
    id: 'discover-cheapest-friday-en',
    catalog: [
      {
        id: 'manicure-25',
        name: 'Manicure basic',
        price: 25,
        serviceCategory: 'manicure',
      },
      {
        id: 'manicure-40',
        name: 'Manicure deluxe',
        price: 40,
        serviceCategory: 'manicure',
      },
    ],
    params: {
      serviceRank: 'lowest_price',
      serviceCategory: 'manicure',
      limit: 1,
    },
    expectedIds: ['manicure-25'],
  },
  {
    id: 'discover-flagship-question-en',
    catalog: DISCOVER_INTERSECTION_CATALOG.filter(
      (service) => service.serviceCategory === 'facial',
    ),
    params: { maxPrice: 100, serviceCategory: 'facial' },
    expectedIds: ['facial-55', 'facial-95'],
  },
  {
    id: 'discover-provider-budget-or-en',
    catalog: DISCOVER_INTERSECTION_CATALOG.filter(
      (service) => service.serviceCategory === 'haircut',
    ),
    params: { maxPrice: 50, serviceCategory: 'haircut' },
    expectedIds: ['hair-35', 'hair-45'],
  },
  {
    id: 'discover-best-provider-budget-en',
    catalog: DISCOVER_INTERSECTION_CATALOG.filter(
      (service) => service.serviceCategory === 'haircut',
    ),
    params: { maxPrice: 60, serviceCategory: 'haircut' },
    expectedIds: ['hair-35', 'hair-45'],
  },
  {
    id: 'discover-journey-budget-list-book-en',
    catalog: DISCOVER_INTERSECTION_CATALOG.filter((service) =>
      (service.serviceCategory ?? '').includes('hair'),
    ),
    params: { maxPrice: 50, serviceCategory: 'hair' },
    expectedIds: ['hair-35', 'hair-45'],
  },
  {
    id: 'discover-journey-premium-en-t1',
    catalog: DISCOVER_SECTION_A_MASSAGE_CATALOG,
    params: {
      serviceRank: 'highest_price',
      serviceCategory: 'massage',
      limit: 3,
    },
    expectedIds: ['massage-95', 'massage-65', 'massage-55'],
  },
  {
    id: 'discover-journey-premium-en-t2',
    catalog: DISCOVER_SECTION_A_MASSAGE_CATALOG,
    params: {
      serviceRank: 'highest_price',
      serviceCategory: 'massage',
      maxPrice: 90,
      limit: 1,
    },
    expectedIds: ['massage-65'],
  },
  {
    id: 'discover-journey-clarify-en',
    catalog: DISCOVER_INTERSECTION_CATALOG.filter(
      (service) => service.serviceCategory === 'haircut',
    ),
    params: { maxPrice: 50, serviceCategory: 'haircut' },
    expectedIds: ['hair-35', 'hair-45'],
  },
  {
    id: 'discover-parity-budget-public',
    catalog: DISCOVER_INTERSECTION_CATALOG.filter(
      (service) => service.serviceCategory === 'facial',
    ),
    params: { maxPrice: 50, serviceCategory: 'facial' },
    expectedIds: [],
  },
  {
    id: 'discover-not-admin-en',
    catalog: [
      {
        id: 'hair-35',
        name: 'Haircut basic',
        price: 35,
        serviceCategory: 'haircut',
      },
      {
        id: 'hair-45',
        name: 'Haircut standard',
        price: 45,
        serviceCategory: 'haircut',
      },
      {
        id: 'hair-75',
        name: 'Haircut premium',
        price: 75,
        serviceCategory: 'haircut',
      },
      {
        id: 'facial-55',
        name: 'Facial standard',
        price: 55,
        serviceCategory: 'facial',
      },
      {
        id: 'massage-55',
        name: 'Massage basic',
        price: 55,
        serviceCategory: 'massage',
      },
      {
        id: 'manicure-25',
        name: 'Manicure basic',
        price: 25,
        serviceCategory: 'manicure',
      },
      {
        id: 'manicure-40',
        name: 'Manicure deluxe',
        price: 40,
        serviceCategory: 'manicure',
      },
    ],
    params: { maxPrice: 50 },
    expectedIds: ['manicure-25', 'hair-35', 'manicure-40', 'hair-45'],
  },
  {
    id: 'discover-ru-premium-en',
    catalog: DISCOVER_SECTION_A_MASSAGE_CATALOG,
    params: {
      maxPrice: 8000,
      serviceRank: 'highest_price',
      serviceCategory: 'massage',
      limit: 1,
    },
    expectedIds: ['massage-95'],
  },
  {
    id: 'discover-hy-cheapest-en',
    catalog: [
      {
        id: 'manicure-25',
        name: 'Manicure basic',
        price: 25,
        serviceCategory: 'manicure',
      },
      {
        id: 'manicure-40',
        name: 'Manicure deluxe',
        price: 40,
        serviceCategory: 'manicure',
      },
    ],
    params: {
      maxPrice: 30,
      serviceRank: 'lowest_price',
      serviceCategory: 'manicure',
    },
    expectedIds: ['manicure-25'],
  },
];

/** Post-LLM discover rescue pipeline golden rows (discover-1.3). */
export type ServiceDiscoveryEnrichmentPipelineScenario = {
  id: string;
  prompt: string;
  params?: Record<string, unknown>;
  expectedAfterServiceDiscovery: Record<string, unknown>;
  expectedAfterPipeline: Record<string, unknown>;
};

export const SERVICE_DISCOVERY_ENRICHMENT_PIPELINE_SCENARIOS: ServiceDiscoveryEnrichmentPipelineScenario[] =
  [
    {
      id: 'discover-flagship-en',
      prompt:
        'I want a haircut tomorrow evening or Friday afternoon, I have $50',
      params: {
        serviceCategory: 'haircut',
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'haircut',
        date: 'tomorrow',
        timeOfDay: 'evening',
        maxPrice: 50,
      },
      expectedAfterPipeline: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'discover-cheapest-under-en',
      prompt: 'Cheapest haircut under $50',
      params: {},
      expectedAfterServiceDiscovery: {
        maxPrice: 50,
        serviceRank: 'lowest_price',
        serviceCategory: 'haircut',
      },
      expectedAfterPipeline: {
        maxPrice: 50,
        serviceRank: 'lowest_price',
        serviceCategory: 'haircut',
      },
    },
    {
      id: 'discover-premium-under-en',
      prompt: 'Best premium facial under $120',
      params: {},
      expectedAfterServiceDiscovery: {
        maxPrice: 120,
        serviceRank: 'highest_price',
        serviceCategory: 'facial',
      },
      expectedAfterPipeline: {
        maxPrice: 120,
        serviceRank: 'highest_price',
        serviceCategory: 'facial',
      },
    },
    {
      id: 'discover-flagship-book-en',
      prompt:
        'Book cheapest massage tomorrow or Thursday evening under $80, whichever is sooner',
      params: {
        serviceCategory: 'massage',
        bookingFirstAvailable: true,
      },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'massage',
        bookingFirstAvailable: true,
        maxPrice: 80,
        serviceRank: 'lowest_price',
      },
      expectedAfterPipeline: {
        serviceCategory: 'massage',
        bookingFirstAvailable: true,
        maxPrice: 80,
        serviceRank: 'lowest_price',
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['thursday'], timeOfDay: 'evening' },
        ],
      },
    },
    {
      id: 'discover-flagship-premium-en',
      prompt:
        'Best premium styling tomorrow or Saturday under $150, whichever is sooner',
      params: {
        serviceCategory: 'styling',
        bookingFirstAvailable: true,
      },
      expectedAfterServiceDiscovery: {
        // e2e-bug.101 — "styling" aliases to "haircut" (like cut/cuts/trim).
        serviceCategory: 'haircut',
        bookingFirstAvailable: true,
        maxPrice: 150,
        serviceRank: 'highest_price',
      },
      expectedAfterPipeline: {
        serviceCategory: 'haircut',
        bookingFirstAvailable: true,
        maxPrice: 150,
        serviceRank: 'highest_price',
        availabilityWindows: [{ date: 'tomorrow' }, { weekdays: ['saturday'] }],
      },
    },
    {
      id: 'discover-flagship-question-en',
      prompt: 'Can I afford a deluxe facial tomorrow or Sunday under $100?',
      params: { serviceCategory: 'facial' },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'facial',
        maxPrice: 100,
      },
      expectedAfterPipeline: {
        serviceCategory: 'facial',
        maxPrice: 100,
        availabilityWindows: [{ date: 'tomorrow' }, { weekdays: ['sunday'] }],
      },
    },
    {
      id: 'discover-best-provider-budget-en',
      prompt: 'Best rated stylist for a cut under $60 this week',
      params: { serviceCategory: 'haircut' },
      // e2e-bug.323 — bare "cut" no longer pre-aliases to "haircut" (which
      // let the hairstyle synonym steal literal "* cut" catalog matches);
      // it stays "cut" here and still resolves the same catalog via the
      // haircut/hairstyle synonym fallback when no cut-named service exists.
      expectedAfterServiceDiscovery: {
        serviceCategory: 'cut',
        maxPrice: 60,
      },
      expectedAfterPipeline: {
        serviceCategory: 'cut',
        maxPrice: 60,
      },
    },
    {
      id: 'discover-provider-budget-or-en',
      prompt: 'Karo or anyone — haircut under $50 tomorrow eve or Fri PM',
      params: { serviceCategory: 'haircut' },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'haircut',
        maxPrice: 50,
      },
      expectedAfterPipeline: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: [
          { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'discover-parity-or-public',
      prompt: 'Massage tomorrow AM or Sat PM',
      params: { serviceCategory: 'massage' },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'massage',
      },
      expectedAfterPipeline: {
        serviceCategory: 'massage',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'morning' },
          { weekdays: ['saturday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'discover-gift-card-or-skips-budget',
      prompt: '$50 gift card, haircut tomorrow or Friday afternoon',
      params: { maxPrice: 50, serviceCategory: 'haircut' },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'haircut',
      },
      expectedAfterPipeline: {
        serviceCategory: 'haircut',
      },
    },
    {
      id: 'discover-not-gift-en',
      prompt: '$50 gift card, premium cut tomorrow',
      params: {
        serviceCategory: 'haircut',
        date: 'tomorrow',
        maxPrice: 50,
      },
      // e2e-bug.323 — bare "cut" no longer pre-aliases to "haircut" (see
      // discover-best-provider-budget-en above for the full rationale).
      expectedAfterServiceDiscovery: {
        serviceCategory: 'cut',
        date: 'tomorrow',
      },
      expectedAfterPipeline: {
        serviceCategory: 'cut',
        date: 'tomorrow',
      },
    },
    {
      id: 'discover-parity-voice-customer',
      prompt: 'Haircut fifty bucks tomorrow or Friday',
      params: { serviceCategory: 'haircut' },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'haircut',
        maxPrice: 50,
      },
      expectedAfterPipeline: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: [{ date: 'tomorrow' }, { weekdays: ['friday'] }],
      },
    },
    {
      id: 'discover-not-admin-en',
      prompt: 'services under $50',
      params: {},
      expectedAfterServiceDiscovery: {
        maxPrice: 50,
      },
      expectedAfterPipeline: {
        maxPrice: 50,
      },
    },
    {
      id: 'discover-not-multi-cart-en',
      prompt: 'Two services under $100 total tomorrow',
      params: {},
      expectedAfterServiceDiscovery: {
        maxTotalPrice: 100,
        serviceCount: 2,
      },
      expectedAfterPipeline: {
        maxTotalPrice: 100,
        serviceCount: 2,
        date: 'tomorrow',
      },
    },
    {
      id: 'discover-not-currency-explain-en',
      prompt: 'Why is premium $120 in dram?',
      params: {
        serviceCategory: 'haircut',
        maxPrice: 120,
        serviceRank: 'highest_price',
      },
      expectedAfterServiceDiscovery: {},
      expectedAfterPipeline: {},
    },
    {
      id: 'discover-hy-budget-or-en',
      prompt:
        'Ցանկանում եմ մազակրտում վաղը երեկոյան կամ ուրբաթ, 5000 դրամ ունեմ',
      params: { serviceCategory: 'haircut' },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'haircut',
        maxPrice: 5000,
      },
      expectedAfterPipeline: {
        serviceCategory: 'haircut',
        maxPrice: 5000,
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'] },
        ],
      },
    },
    {
      id: 'discover-ru-premium-en',
      prompt: 'Люксовый массаж до 8000 рублей завтра вечером',
      params: { serviceCategory: 'massage' },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'massage',
        serviceRank: 'highest_price',
        maxPrice: 8000,
      },
      expectedAfterPipeline: {
        serviceCategory: 'massage',
        serviceRank: 'highest_price',
        maxPrice: 8000,
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
    },
    {
      id: 'discover-hy-cheapest-en',
      prompt: 'Ամենաէժան մանիկյուր $30-ից ցածր',
      params: {},
      expectedAfterServiceDiscovery: {
        serviceRank: 'lowest_price',
        maxPrice: 30,
      },
      expectedAfterPipeline: {
        serviceCategory: 'manicure',
        serviceName: null,
        serviceRank: 'lowest_price',
        maxPrice: 30,
      },
    },
    {
      id: 'discover-ru-or-book-en',
      prompt: 'Стрижка завтра вечером или в субботу — забронируй',
      params: { serviceCategory: 'haircut' },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'haircut',
      },
      expectedAfterPipeline: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['saturday'] },
        ],
      },
    },
    {
      id: 'discover-value-or-premium-en',
      prompt: 'Affordable or premium massage — what fits $80?',
      params: { serviceCategory: 'massage' },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'massage',
        maxPrice: 80,
      },
      expectedAfterPipeline: {
        serviceCategory: 'massage',
        maxPrice: 80,
      },
    },
    {
      id: 'discover-no-premium-in-budget-en',
      prompt: 'Premium haircut under $30 (none exist)',
      params: { serviceCategory: 'haircut' },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'haircut',
        maxPrice: 30,
        serviceRank: 'highest_price',
      },
      expectedAfterPipeline: {
        serviceCategory: 'haircut',
        maxPrice: 30,
        serviceRank: 'highest_price',
      },
    },
    {
      id: 'discover-premium-tomorrow-en',
      prompt: 'Book your most premium facial tomorrow nearest slot',
      params: {
        serviceCategory: 'facial',
        date: 'tomorrow',
        bookingFirstAvailable: true,
      },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'facial',
        date: 'tomorrow',
        bookingFirstAvailable: true,
        serviceRank: 'highest_price',
      },
      expectedAfterPipeline: {
        serviceCategory: 'facial',
        date: 'tomorrow',
        bookingFirstAvailable: true,
        serviceRank: 'highest_price',
      },
    },
    {
      id: 'discover-budget-asap-en',
      prompt: 'Anything under $40 ASAP',
      params: { bookingFirstAvailable: true },
      expectedAfterServiceDiscovery: {
        bookingFirstAvailable: true,
        maxPrice: 40,
      },
      expectedAfterPipeline: {
        bookingFirstAvailable: true,
        maxPrice: 40,
        date: 'tomorrow',
      },
    },
    {
      id: 'discover-budget-weekend-en',
      prompt: 'Massage under $70 this Saturday afternoon',
      params: {
        serviceCategory: 'massage',
        weekdays: ['saturday'],
        timeOfDay: 'afternoon',
      },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'massage',
        weekdays: ['saturday'],
        timeOfDay: 'afternoon',
        maxPrice: 70,
      },
      expectedAfterPipeline: {
        serviceCategory: 'massage',
        maxPrice: 70,
        timeOfDay: 'afternoon',
        weekdays: ['saturday'],
      },
    },
    {
      id: 'discover-cheapest-friday-en',
      prompt: 'Cheapest manicure Friday afternoon if available',
      params: {
        serviceCategory: 'manicure',
        weekdays: ['friday'],
        timeOfDay: 'afternoon',
      },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'manicure',
        weekdays: ['friday'],
        timeOfDay: 'afternoon',
        serviceRank: 'lowest_price',
      },
      expectedAfterPipeline: {
        serviceCategory: 'manicure',
        serviceRank: 'lowest_price',
        timeOfDay: 'afternoon',
        weekdays: ['friday'],
      },
    },
  ];
