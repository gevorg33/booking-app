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
      { id: 'prem-low', name: 'Premium lite', price: 50, serviceTier: 'premium' },
      { id: 'std-high', name: 'Standard plus', price: 80, serviceTier: 'standard' },
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
      { id: 'std-high', name: 'Standard plus', price: 100, serviceTier: 'standard' },
      { id: 'prem-low', name: 'Premium lite', price: 70, serviceTier: 'premium' },
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
      { id: 'basic', name: 'Haircut basic', price: 35, serviceCategory: 'haircut' },
      { id: 'premium', name: 'Haircut premium', price: 85, serviceCategory: 'haircut' },
      { id: 'standard', name: 'Haircut standard', price: 55, serviceCategory: 'haircut' },
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
      { id: 'basic', name: 'Haircut basic', price: 35, serviceCategory: 'haircut' },
      { id: 'premium', name: 'Haircut premium', price: 85, serviceCategory: 'haircut' },
    ],
    options: {
      serviceCategory: 'haircut',
      serviceRank: 'lowest_price',
      limit: 1,
    },
    expectedIds: ['basic'],
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
      { id: 'hair-120', name: 'Color deluxe', price: 120, serviceCategory: 'hair color' },
      { id: 'facial-90', name: 'Facial gold', price: 90, serviceCategory: 'facial' },
      { id: 'hair-80', name: 'Color basic', price: 80, serviceCategory: 'hair color' },
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
      { id: 'std-high', name: 'Standard plus', price: 100, serviceTier: 'standard' },
      { id: 'prem-low', name: 'Premium lite', price: 70, serviceTier: 'premium' },
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
  { id: 'hair-35', name: 'Haircut basic', price: 35, serviceCategory: 'haircut' },
  { id: 'hair-45', name: 'Haircut standard', price: 45, serviceCategory: 'haircut' },
  { id: 'hair-75', name: 'Haircut premium', price: 75, serviceCategory: 'haircut' },
  { id: 'facial-55', name: 'Facial standard', price: 55, serviceCategory: 'facial' },
  { id: 'facial-95', name: 'Facial deluxe', price: 95, serviceCategory: 'facial' },
  { id: 'facial-120', name: 'Facial luxury', price: 120, serviceCategory: 'facial' },
];

export const RESOLVE_SERVICE_DISCOVERY_PARAMS_SCENARIOS: Array<{
  id: string;
  params: Record<string, unknown>;
  expected: {
    maxPrice: number | null;
    serviceRank: 'highest_price' | 'lowest_price' | 'most_popular' | null;
    serviceCategory: string | null;
    limit: number | null;
    hasBudget: boolean;
    hasRank: boolean;
  };
}> = [
  {
    id: 'discover-budget-only',
    params: { maxPrice: 50, serviceCategory: 'haircut' },
    expected: {
      maxPrice: 50,
      serviceRank: null,
      serviceCategory: 'haircut',
      limit: null,
      hasBudget: true,
      hasRank: false,
    },
  },
  {
    id: 'discover-rank-only',
    params: { serviceRank: 'highest_price', serviceCategory: 'facial' },
    expected: {
      maxPrice: null,
      serviceRank: 'highest_price',
      serviceCategory: 'facial',
      limit: null,
      hasBudget: false,
      hasRank: true,
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
      limit: 1,
      hasBudget: true,
      hasRank: true,
    },
  },
  {
    id: 'discover-invalid-maxPrice',
    params: { maxPrice: -1, serviceRank: 'lowest_price' },
    expected: {
      maxPrice: null,
      serviceRank: 'lowest_price',
      serviceCategory: null,
      limit: null,
      hasBudget: false,
      hasRank: true,
    },
  },
  {
    id: 'discover-invalid-rank',
    params: { maxPrice: 80, serviceRank: 'premium' },
    expected: {
      maxPrice: 80,
      serviceRank: null,
      serviceCategory: null,
      limit: null,
      hasBudget: true,
      hasRank: false,
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
    catalog: DISCOVER_INTERSECTION_CATALOG,
    params: {
      maxPrice: 80,
      serviceCategory: 'haircut',
    },
    expectedIds: ['hair-35', 'hair-45', 'hair-75'],
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
      },
      expectedAfterPipeline: {
        maxPrice: 50,
        serviceRank: 'lowest_price',
      },
    },
    {
      id: 'discover-premium-under-en',
      prompt: 'Best premium facial under $120',
      params: {},
      expectedAfterServiceDiscovery: {
        maxPrice: 120,
        serviceRank: 'highest_price',
      },
      expectedAfterPipeline: {
        maxPrice: 120,
        serviceRank: 'highest_price',
      },
    },
    {
      id: 'discover-flagship-book-en',
      prompt: 'Cheapest massage tomorrow or Thursday evening, under $80',
      params: { serviceCategory: 'massage' },
      expectedAfterServiceDiscovery: {
        serviceCategory: 'massage',
        maxPrice: 80,
        serviceRank: 'lowest_price',
      },
      expectedAfterPipeline: {
        serviceCategory: 'massage',
        maxPrice: 80,
        serviceRank: 'lowest_price',
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['thursday'], timeOfDay: 'evening' },
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
  ];
