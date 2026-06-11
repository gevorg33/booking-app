import type { RankDiscoverAndBookStepAction } from './ai-rank-discover-and-book-compound.util.js';

export type RankDiscoverAndBookCompoundFixture = {
  id: string;
  prompt: string;
  orderedActions: RankDiscoverAndBookStepAction[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS = [
  {
    id: 'rank-discover-book-premium-facial-e2e-en',
    prompt:
      "Rank discover and book end-to-end: show premium facial options, check who's free tomorrow evening, book the nearest slot",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'facial',
      serviceRank: 'highest_price',
      timeOfDay: 'evening',
      bookingFirstAvailable: true,
    },
    misclassifiedAction: 'create_booking',
  },
  {
    id: 'filter-catalog-cheapest-massage-en',
    prompt:
      "Filter catalog for cheapest massage, check who is free tomorrow, and book the soonest appointment",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'massage',
      serviceRank: 'lowest_price',
      bookingFirstAvailable: true,
    },
    misclassifiedAction: 'check_providers_for_service',
  },
  {
    id: 'list-popular-manicure-friday-en',
    prompt:
      'List most popular manicure services, check providers available Friday, book nearest slot',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'manicure',
      serviceRank: 'most_popular',
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'show-luxury-color-saturday-en',
    prompt:
      "Show top-tier color options, who's free Saturday morning, book the earliest slot",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'color',
      serviceRank: 'highest_price',
      timeOfDay: 'morning',
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'semicolon-premium-haircut-en',
    prompt:
      "Filter premium haircut services; check who's free tomorrow; book nearest slot",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'haircut',
      serviceRank: 'highest_price',
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'client-deluxe-styling-en',
    prompt:
      'Client wants deluxe styling — list premium options, check availability tomorrow, book soonest',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'styling',
      serviceRank: 'highest_price',
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'what-book-cheapest-facial-en',
    prompt:
      "What can we book — cheapest facial tomorrow — check who's free and book nearest",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'facial',
      serviceRank: 'lowest_price',
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'discover-luxury-massage-en',
    prompt:
      'Discover and book premium: options for massage, who is free Thursday, book ASAP',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'massage',
      serviceRank: 'highest_price',
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'e2e-cheapest-haircut-afternoon-en',
    prompt:
      'End-to-end rank booking: cheapest haircut, check providers tomorrow afternoon, book first available',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'haircut',
      serviceRank: 'lowest_price',
      timeOfDay: 'afternoon',
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'full-rank-check-book-massage-en',
    prompt:
      'Full rank-check-book for luxury massage — list options, check who is free, create booking for nearest slot',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'massage',
      serviceRank: 'highest_price',
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'reception-premium-haircut-en',
    prompt:
      "Reception: show premium haircut services, check who's available tomorrow, create booking for nearest opening",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'haircut',
      serviceRank: 'highest_price',
      bookingFirstAvailable: true,
    },
  },
] as const satisfies readonly RankDiscoverAndBookCompoundFixture[];

export const RANK_DISCOVER_AND_BOOK_EN_SCENARIO_IDS =
  RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS.map((row) => row.id);

export const RANK_DISCOVER_AND_BOOK_RESCUE_SCENARIOS =
  RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS.filter(
    (scenario) => 'misclassifiedAction' in scenario && !!scenario.misclassifiedAction,
  ) as Array<
    RankDiscoverAndBookCompoundFixture & { misclassifiedAction: string }
  >;
