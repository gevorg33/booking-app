import type { ServiceTier } from '../../common/utils/service-rank-metadata.util.js';
import type { ServiceRank } from './ai-service-catalog-rank.util.js';
import type { BudgetCatalogService } from './ai-budget-service-discovery.util.js';
import type { ListServicesNavigateHint } from './ai-budget-list-services.logic.js';

export type RankHandlerOutcomeScenario = {
  id: string;
  services: Array<BudgetCatalogService & { serviceCategory?: string | null }>;
  serviceCategory?: string | null;
  serviceRank: ServiceRank;
  limit: number;
  maxPrice?: number;
  expectedIds: string[];
  expectedNavigateServiceId?: string;
  expectSingleMatchHeader?: boolean;
  expectEmptyCategoryHint?: boolean;
  expectedCategorySuggestions?: string[];
};

export const RANK_HANDLER_OUTCOME_SCENARIOS: RankHandlerOutcomeScenario[] = [
  {
    id: 'rank-premium-single-hair',
    services: [
      { id: 'hair-35', name: 'Haircut basic', price: 35, durationMinutes: 30 },
      { id: 'hair-85', name: 'Haircut premium', price: 85, durationMinutes: 60 },
      { id: 'hair-55', name: 'Haircut standard', price: 55, durationMinutes: 45 },
    ],
    serviceCategory: 'haircut',
    serviceRank: 'highest_price',
    limit: 1,
    expectedIds: ['hair-85'],
    expectedNavigateServiceId: 'hair-85',
    expectSingleMatchHeader: true,
  },
  {
    id: 'rank-cheapest-single-massage',
    services: [
      { id: 'massage-120', name: 'Luxury massage', price: 120, durationMinutes: 90 },
      { id: 'massage-60', name: 'Relax massage', price: 60, durationMinutes: 60 },
    ],
    serviceCategory: 'massage',
    serviceRank: 'lowest_price',
    limit: 1,
    expectedIds: ['massage-60'],
    expectedNavigateServiceId: 'massage-60',
    expectSingleMatchHeader: true,
  },
  {
    id: 'rank-show-all-premium-top-three',
    services: [
      { id: 'color-40', name: 'Color basic', price: 40, durationMinutes: 60 },
      { id: 'color-80', name: 'Color deluxe', price: 80, durationMinutes: 90 },
      { id: 'color-120', name: 'Color premium', price: 120, durationMinutes: 120 },
      { id: 'color-100', name: 'Color signature', price: 100, durationMinutes: 105 },
    ],
    serviceCategory: 'color',
    serviceRank: 'highest_price',
    limit: 3,
    expectedIds: ['color-120', 'color-100', 'color-80'],
  },
  {
    id: 'rank-premium-under-budget',
    services: [
      { id: 'hair-35', name: 'Haircut basic', price: 35, durationMinutes: 30 },
      { id: 'hair-75', name: 'Haircut premium', price: 75, durationMinutes: 60 },
      { id: 'hair-95', name: 'Haircut deluxe', price: 95, durationMinutes: 75 },
    ],
    serviceCategory: 'haircut',
    serviceRank: 'highest_price',
    limit: 1,
    maxPrice: 80,
    expectedIds: ['hair-75'],
    expectedNavigateServiceId: 'hair-75',
    expectSingleMatchHeader: true,
  },
  {
    id: 'rank-single-premium-tie-price',
    services: [
      { id: 'cut-a', name: 'Haircut A', price: 80, durationMinutes: 90 },
      { id: 'cut-b', name: 'Haircut B', price: 80, durationMinutes: 60 },
      { id: 'cut-c', name: 'Haircut basic', price: 50, durationMinutes: 30 },
    ],
    serviceCategory: 'haircut',
    serviceRank: 'highest_price',
    limit: 1,
    expectedIds: ['cut-a'],
    expectedNavigateServiceId: 'cut-a',
    expectSingleMatchHeader: true,
  },
  {
    id: 'rank-name-premium-fallback',
    services: [
      { id: 'named-premium', name: 'Premium Cut', price: 45, serviceCategory: 'haircut' },
      { id: 'named-standard', name: 'Standard Cut', price: 60, serviceCategory: 'haircut' },
    ],
    serviceCategory: 'haircut',
    serviceRank: 'highest_price',
    limit: 1,
    expectedIds: ['named-standard'],
    expectedNavigateServiceId: 'named-standard',
    expectSingleMatchHeader: true,
  },
  {
    id: 'rank-most-popular-single',
    services: [
      { id: 'hair-quiet', name: 'Haircut basic', price: 35, serviceCategory: 'haircut', bookingCount: 12 },
      { id: 'hair-popular', name: 'Haircut deluxe', price: 55, serviceCategory: 'haircut', bookingCount: 240 },
    ],
    serviceCategory: 'haircut',
    serviceRank: 'most_popular',
    limit: 1,
    expectedIds: ['hair-popular'],
    expectedNavigateServiceId: 'hair-popular',
    expectSingleMatchHeader: true,
  },
  {
    id: 'rank-all-same-price',
    services: [
      { id: 'm-a', name: 'Massage A', price: 70, durationMinutes: 60, serviceCategory: 'massage' },
      { id: 'm-b', name: 'Massage B', price: 70, durationMinutes: 90, serviceCategory: 'massage' },
      { id: 'm-c', name: 'Massage C', price: 70, durationMinutes: 75, serviceCategory: 'massage' },
      { id: 'm-d', name: 'Massage D', price: 70, durationMinutes: 45, serviceCategory: 'massage' },
    ],
    serviceCategory: 'massage',
    serviceRank: 'highest_price',
    limit: 4,
    expectedIds: ['m-b', 'm-c', 'm-a', 'm-d'],
  },
  {
    id: 'rank-zero-price',
    services: [
      { id: 'free-consult', name: 'Free consultation', price: 0, serviceCategory: 'consultation' },
      { id: 'paid-consult', name: 'Paid consultation', price: 50, serviceCategory: 'consultation' },
    ],
    serviceCategory: 'consultation',
    serviceRank: 'lowest_price',
    limit: 1,
    expectedIds: ['free-consult'],
    expectedNavigateServiceId: 'free-consult',
    expectSingleMatchHeader: true,
  },
  {
    id: 'rank-missing-price',
    services: [
      { id: 'quote-only', name: 'Custom quote', price: null, serviceCategory: 'color' },
      { id: 'priced-color', name: 'Color basic', price: 80, serviceCategory: 'color' },
    ],
    serviceCategory: 'color',
    serviceRank: 'highest_price',
    limit: 1,
    expectedIds: ['priced-color'],
    expectedNavigateServiceId: 'priced-color',
    expectSingleMatchHeader: true,
  },
  {
    id: 'rank-empty-category',
    services: [
      { id: 'hair-35', name: 'Haircut basic', price: 35, serviceCategory: 'haircut' },
      { id: 'massage-60', name: 'Relax massage', price: 60, serviceCategory: 'massage' },
    ],
    serviceCategory: 'facial',
    serviceRank: 'highest_price',
    limit: 1,
    expectedIds: [],
    expectEmptyCategoryHint: true,
    expectedCategorySuggestions: ['haircut', 'massage'],
  },
  {
    id: 'rank-voice-premium-en',
    services: [
      { id: 'hair-35', name: 'Haircut basic', price: 35, durationMinutes: 30, serviceCategory: 'haircut' },
      { id: 'hair-85', name: 'Haircut premium', price: 85, durationMinutes: 60, serviceCategory: 'haircut' },
    ],
    serviceCategory: 'haircut',
    serviceRank: 'highest_price',
    limit: 1,
    expectedIds: ['hair-85'],
    expectedNavigateServiceId: 'hair-85',
    expectSingleMatchHeader: true,
  },
  {
    id: 'rank-voice-cheapest-en',
    services: [
      { id: 'facial-90', name: 'Deluxe facial', price: 90, durationMinutes: 60, serviceCategory: 'facial' },
      { id: 'facial-45', name: 'Express facial', price: 45, durationMinutes: 30, serviceCategory: 'facial' },
    ],
    serviceCategory: 'facial',
    serviceRank: 'lowest_price',
    limit: 1,
    expectedIds: ['facial-45'],
    expectedNavigateServiceId: 'facial-45',
    expectSingleMatchHeader: true,
  },
  {
    id: 'rank-inactive-excluded',
    services: [
      {
        id: 'massage-150',
        name: 'Deluxe massage',
        price: 150,
        durationMinutes: 90,
        serviceCategory: 'massage',
        isActive: false,
      },
      { id: 'massage-90', name: 'Relax massage', price: 90, durationMinutes: 60, serviceCategory: 'massage' },
      { id: 'massage-60', name: 'Basic massage', price: 60, durationMinutes: 45, serviceCategory: 'massage' },
    ],
    serviceCategory: 'massage',
    serviceRank: 'highest_price',
    limit: 1,
    expectedIds: ['massage-90'],
    expectedNavigateServiceId: 'massage-90',
    expectSingleMatchHeader: true,
  },
];

export type RankTierFilterHandlerScenario = {
  id: string;
  services: Array<
    BudgetCatalogService & {
      serviceCategory?: string | null;
      serviceTier?: ServiceTier | null;
    }
  >;
  serviceCategory?: string | null;
  serviceTier: ServiceTier;
  limit: number;
  expectedIds: string[];
};

export const RANK_TIER_FILTER_HANDLER_SCENARIOS: RankTierFilterHandlerScenario[] =
  [
    {
      id: 'rank-tier-metadata-en',
      services: [
        {
          id: 'color-std',
          name: 'Color basic',
          price: 80,
          serviceCategory: 'color',
          serviceTier: 'standard',
        },
        {
          id: 'color-prem-a',
          name: 'Color premium',
          price: 100,
          serviceCategory: 'color',
          serviceTier: 'premium',
        },
        {
          id: 'color-prem-b',
          name: 'Color lite',
          price: 60,
          serviceCategory: 'color',
          serviceTier: 'premium',
        },
        {
          id: 'hair-prem',
          name: 'Hair premium',
          price: 90,
          serviceCategory: 'haircut',
          serviceTier: 'premium',
        },
      ],
      serviceCategory: 'color',
      serviceTier: 'premium',
      limit: 3,
      expectedIds: ['color-prem-a', 'color-prem-b'],
    },
  ];

export type RankNavigateScenario = {
  id: string;
  services: Array<BudgetCatalogService & { serviceCategory?: string | null }>;
  serviceCategory?: string | null;
  serviceRank: ServiceRank;
  limit: number;
  expectedNavigate?: ListServicesNavigateHint;
};

/** Handler navigate hints after rank pick (rank-1.6). */
export const RANK_NAVIGATE_SCENARIOS: RankNavigateScenario[] = [
  {
    id: 'rank-navigate-single',
    services: [
      { id: 'hair-35', name: 'Haircut basic', price: 35, durationMinutes: 30 },
      { id: 'hair-85', name: 'Haircut premium', price: 85, durationMinutes: 60 },
    ],
    serviceCategory: 'haircut',
    serviceRank: 'highest_price',
    limit: 1,
    expectedNavigate: { path: 'services', query: { serviceId: 'hair-85' } },
  },
  {
    id: 'rank-one-in-category',
    services: [
      { id: 'massage-60', name: 'Relax massage', price: 60, durationMinutes: 60 },
    ],
    serviceCategory: 'massage',
    serviceRank: 'highest_price',
    limit: 1,
    expectedNavigate: { path: 'services', query: { serviceId: 'massage-60' } },
  },
  {
    id: 'rank-multi-no-preselect',
    services: [
      { id: 'color-40', name: 'Color basic', price: 40, durationMinutes: 60 },
      { id: 'color-80', name: 'Color deluxe', price: 80, durationMinutes: 90 },
      { id: 'color-120', name: 'Color premium', price: 120, durationMinutes: 120 },
      { id: 'color-100', name: 'Color signature', price: 100, durationMinutes: 105 },
    ],
    serviceCategory: 'color',
    serviceRank: 'highest_price',
    limit: 3,
    expectedNavigate: { path: 'services', query: {} },
  },
  {
    id: 'rank-empty-no-navigate',
    services: [],
    serviceCategory: 'facial',
    serviceRank: 'highest_price',
    limit: 1,
    expectedNavigate: undefined,
  },
];

/** Session pick catalog — top 3 premium massages for rank-session-pick-one-en. */
export const RANK_SESSION_PICK_CATALOG: Array<
  BudgetCatalogService & { serviceCategory?: string | null }
> = [
  {
    id: 'massage-120',
    name: 'Luxury massage',
    price: 120,
    durationMinutes: 90,
    serviceCategory: 'massage',
  },
  {
    id: 'massage-90',
    name: 'Relax massage',
    price: 90,
    durationMinutes: 60,
    serviceCategory: 'massage',
  },
  {
    id: 'massage-60',
    name: 'Basic massage',
    price: 60,
    durationMinutes: 45,
    serviceCategory: 'massage',
  },
  {
    id: 'massage-45',
    name: 'Express massage',
    price: 45,
    durationMinutes: 30,
    serviceCategory: 'massage',
  },
];

export const RANK_LIMIT_FROM_PROMPT_SCENARIOS: Array<{
  id: string;
  prompt: string;
  params?: Record<string, unknown>;
  expectedLimit: number;
}> = [
  {
    id: 'rank-limit-default-premium',
    prompt: 'What is the best and premium haircut service?',
    expectedLimit: 1,
  },
  {
    id: 'rank-limit-show-all-premium',
    prompt: 'Show me all premium massage options',
    expectedLimit: 5,
  },
  {
    id: 'rank-limit-top-tier-services',
    prompt: 'Show me your top-tier hair color services',
    expectedLimit: 3,
  },
  {
    id: 'rank-limit-top-n',
    prompt: 'Top 4 premium facials',
    expectedLimit: 4,
  },
  {
    id: 'rank-limit-param-override',
    prompt: 'Best premium haircut',
    params: { limit: 2 },
    expectedLimit: 2,
  },
  {
    id: 'rank-voice-premium-en',
    prompt: 'Premium cut?',
    expectedLimit: 1,
  },
  {
    id: 'rank-mid-range-en',
    prompt: 'Mid-range color service',
    expectedLimit: 3,
  },
];

export const RANK_MID_RANGE_HANDLER_SCENARIOS: Array<{
  id: string;
  services: Array<
    BudgetCatalogService & { serviceCategory?: string | null }
  >;
  serviceCategory: string;
  limit: number;
  expectedIds: string[];
}> = [
  {
    id: 'rank-mid-range-en',
    services: [
      { id: 'color-120', name: 'Color premium', price: 120, serviceCategory: 'color' },
      { id: 'color-40', name: 'Color basic', price: 40, serviceCategory: 'color' },
      { id: 'color-80', name: 'Color deluxe', price: 80, serviceCategory: 'color' },
      { id: 'hair-55', name: 'Haircut standard', price: 55, serviceCategory: 'haircut' },
    ],
    serviceCategory: 'color',
    limit: 3,
    expectedIds: ['color-40', 'color-80', 'color-120'],
  },
];
