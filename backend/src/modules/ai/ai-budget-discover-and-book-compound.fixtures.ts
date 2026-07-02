import type { BudgetDiscoverAndBookStepAction } from './ai-budget-discover-and-book-compound.util.js';

export type BudgetDiscoverAndBookCompoundFixture = {
  id: string;
  prompt: string;
  orderedActions: BudgetDiscoverAndBookStepAction[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS = [
  {
    id: 'budget-discover-book-haircut-50-e2e-en',
    prompt:
      "Budget discover and book end-to-end: show haircut options under $50, check who's free tomorrow evening, book the nearest slot",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'haircut',
      maxPrice: 50,
      timeOfDay: 'evening',
      bookingFirstAvailable: true,
    },
    misclassifiedAction: 'create_booking',
  },
  {
    id: 'filter-catalog-facial-60-en',
    prompt:
      'Filter catalog for facials under $60, check who is free tomorrow, and book the soonest appointment',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'facial',
      maxPrice: 60,
      bookingFirstAvailable: true,
    },
    misclassifiedAction: 'check_providers_for_service',
  },
  {
    id: 'list-massage-under-40-friday-en',
    prompt:
      'List services under $40 for massage, check providers available Friday, book nearest slot',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'massage',
      maxPrice: 40,
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'show-color-under-80-saturday-en',
    prompt:
      "Show options under $80 for color, who's free Saturday morning, book the earliest slot",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'color',
      maxPrice: 80,
      timeOfDay: 'morning',
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'semicolon-haircut-50-en',
    prompt:
      "Filter services under $50 for haircut; check who's free tomorrow; book nearest slot",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'haircut',
      maxPrice: 50,
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'client-styling-70-en',
    prompt:
      'Client has $70 for styling — list affordable options, check availability tomorrow, book soonest',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'styling',
      maxPrice: 70,
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'what-book-facial-55-en',
    prompt:
      "What can we book under $55 for facial tomorrow — check who's free and book nearest",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'facial',
      maxPrice: 55,
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'discover-manicure-65-en',
    prompt:
      'Discover and book under $65: options for manicure, who is free Thursday, book ASAP',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'manicure',
      maxPrice: 65,
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'e2e-haircut-45-afternoon-en',
    prompt:
      'End-to-end budget booking: haircut under $45, check providers tomorrow afternoon, book first available',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'haircut',
      maxPrice: 45,
      timeOfDay: 'afternoon',
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'full-filter-check-book-90-en',
    prompt:
      'Full filter-check-book for massage under $90 — list options, check who is free, create booking for nearest slot',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'massage',
      maxPrice: 90,
      bookingFirstAvailable: true,
    },
  },
  {
    id: 'reception-haircut-50-en',
    prompt:
      "Reception: show haircut services under $50, check who's available tomorrow, create booking for nearest opening",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ] as const,
    expectedParams: {
      serviceCategory: 'haircut',
      maxPrice: 50,
      bookingFirstAvailable: true,
    },
  },
] as const satisfies readonly BudgetDiscoverAndBookCompoundFixture[];

export const BUDGET_DISCOVER_AND_BOOK_EN_SCENARIO_IDS =
  BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS.map((row) => row.id);

export const BUDGET_DISCOVER_AND_BOOK_RESCUE_SCENARIOS =
  BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS.filter(
    (scenario) =>
      'misclassifiedAction' in scenario && !!scenario.misclassifiedAction,
  ) as Array<
    BudgetDiscoverAndBookCompoundFixture & { misclassifiedAction: string }
  >;
