import type { ServiceCatalogPriceEntry } from './ai-service-catalog-rank.util.js';
import {
  FILTER_SERVICES_BY_MAX_PRICE_SCENARIOS,
  SHARED_BUDGET_FILTER_SCENARIO_IDS,
} from './ai-service-catalog-rank.fixtures.js';

/** Customer/public classifier rules for budget-constrained service discovery (budget-1.10). */
export const BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES = `- list_services: READ — browse or filter the public service catalog. When the user states a spending limit, set maxPrice (number, inclusive ceiling in tenant default currency). Triggers: under/below/at most/no more than $X, "I have $X", "what can I book with $X", "options under $X", cheapest/affordable within a budget. Optional serviceName, serviceCategory, employeeName. Sort matches by price ascending in the handler. NOT discover_packages (bundles/deals catalog), NOT apply_gift_card_code (gift card balance), NOT explain_checkout_currency (currency display), and NOT explain_checkout_total (deposit vs service price).
- recommend_specialists: READ — best/top/highest-rated specialists for a service when the user also names a budget ceiling. Set maxPrice, serviceCategory/serviceName, date/dateFrom/dateTo when mentioned. Restrict to services at or below maxPrice before ranking providers. NOT plain team-wide availability (check_availability / check_providers_for_service).
- maxPrice: number — inclusive catalog display-price ceiling (service.price). Extract from $X, €X, X dollars/bucks/dram/rubles, "under X", "below X", "at most X", "less than X", "I have X", "I only have X". Do NOT set maxPrice when the user mentions a gift card, package/bundle/deal catalog, subscription plan balance, or booking deposit amount.
- Budget + book compounds (one message): filter catalog by maxPrice first, then book the nearest/soonest slot. Public: book_appointment with bookingFirstAvailable=true, timeSlot=null. Customer checkout path: book_nearest_slot with bookingFirstAvailable=true. Multi-step execution is automatic.
- Budget + check-then-book: filter by maxPrice → who is free → book nearest. Public: check_availability then book_appointment. Customer: check_providers_for_service then book_nearest_slot.
- Disambiguation:
  - "I have a $50 gift card for a haircut" → gift card / checkout — NO maxPrice
  - "Any spa packages under $100?" → discover_packages — NOT list_services maxPrice
  - "Is the $50 deposit enough for highlights?" → explain_checkout_currency or booking help — deposit ≠ maxPrice
  - "What's the cheapest haircut?" → list_services with lowest-price sort — maxPrice only when user also states a ceiling ("cheapest under $50")
- Examples:
  - "I need a haircut, I have $50" → list_services, serviceCategory=haircut, maxPrice=50
  - "What massages can I get for under 80 dollars?" → list_services, serviceCategory=massage, maxPrice=80
  - "Best rated massage under $100 this week" → recommend_specialists, serviceCategory=massage, maxPrice=100
  - "Does Karo have anything under $40?" → list_services, employeeName=Karo, maxPrice=40
  - "Book a haircut under $50 tomorrow, nearest slot" → compound: list filter + book_appointment/book_nearest_slot, maxPrice=50, bookingFirstAvailable=true
  - "Facials under €40 please" → list_services, serviceCategory=facial, maxPrice=40`;

export type BudgetDiscoverySurface = 'public' | 'customer' | 'both';

export type BudgetServiceDiscoveryPromptFixture = {
  id: string;
  prompt: string;
  surface: BudgetDiscoverySurface;
  expectedAction: string;
  expectedParams?: Record<string, unknown>;
  /** When true, budget maxPrice must not be extracted from the prompt. */
  skipMaxPrice?: boolean;
  publicCompoundSteps?: readonly string[];
  customerCompoundSteps?: readonly string[];
  phase2?: boolean;
};

type CatalogFixtureService = ServiceCatalogPriceEntry & {
  id: string;
  name: string;
  serviceCategory?: string;
  durationMinutes?: number;
};

export type BudgetHandlerOutcomeScenario = {
  id: string;
  services: CatalogFixtureService[];
  maxPrice: number;
  serviceCategory?: string;
  expectedIds: string[];
  expectedNavigateServiceId?: string | null;
  expectNoMatchHint?: boolean;
};

export type BudgetMaxPriceExtractionScenario = {
  id: string;
  prompt: string;
  maxPrice: number | null;
  skipMaxPrice?: boolean;
};

export type BudgetSessionTurn = {
  prompt: string;
  expectedParams?: Record<string, unknown>;
};

export type BudgetSessionScenario = {
  id: string;
  surface: BudgetDiscoverySurface;
  turns: readonly BudgetSessionTurn[];
};

/** NL prompts for classifier, rescue, and eval (sections A–L). */
export const SIMILAR_BUDGET_SERVICE_PROMPTS: BudgetServiceDiscoveryPromptFixture[] =
  [
    // A — Happy path
    {
      id: 'budget-hair-50-en',
      prompt: 'I need a haircut, I have $50',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
    },
    {
      id: 'budget-massage-under-80-en',
      prompt: 'What massages can I get for under 80 dollars?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'massage', maxPrice: 80 },
    },
    {
      id: 'budget-facial-budget-only-en',
      prompt: 'What can I book with $30?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { maxPrice: 30 },
    },
    {
      id: 'budget-cheapest-hair-en',
      prompt: "What's the cheapest haircut you offer?",
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut' },
    },
    {
      id: 'budget-provider-karo-en',
      prompt: 'Does Karo have anything under $40?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { employeeName: 'Karo', maxPrice: 40 },
    },
    {
      id: 'budget-recommend-rated-en',
      prompt: 'Best rated massage under $100 this week',
      surface: 'both',
      expectedAction: 'recommend_specialists',
      expectedParams: { serviceCategory: 'massage', maxPrice: 100 },
    },
    // C — Compounds
    {
      id: 'budget-book-nearest-en',
      prompt: 'Book a haircut under $50 tomorrow, nearest slot',
      surface: 'both',
      expectedAction: 'book_appointment',
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        bookingFirstAvailable: true,
      },
      publicCompoundSteps: ['list_services', 'book_appointment'],
      customerCompoundSteps: ['list_services', 'book_nearest_slot'],
    },
    {
      id: 'budget-check-then-book-en',
      prompt:
        "Who's free for a facial under $60 tomorrow evening, book the soonest",
      surface: 'both',
      expectedAction: 'book_appointment',
      expectedParams: {
        serviceCategory: 'facial',
        maxPrice: 60,
        timeOfDay: 'evening',
        bookingFirstAvailable: true,
      },
      publicCompoundSteps: ['check_availability', 'book_appointment'],
      customerCompoundSteps: [
        'check_providers_for_service',
        'book_nearest_slot',
      ],
    },
    {
      id: 'budget-list-then-pick-en',
      prompt: "Show options under $40 then I'll pick",
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { maxPrice: 40 },
    },
    {
      id: 'budget-or-windows-en',
      prompt:
        'Haircut tomorrow evening or Friday afternoon, I have $50',
      surface: 'both',
      expectedAction: 'book_appointment',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
      phase2: true,
    },
    // D — Amount extraction variants
    {
      id: 'budget-dollar-sign-en',
      prompt: 'I have $50 for a haircut',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
    },
    {
      id: 'budget-word-amount-en',
      prompt: 'I have fifty dollars for massage',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'massage', maxPrice: 50 },
    },
    {
      id: 'budget-under-phrase-en',
      prompt: 'Haircut below 50 bucks',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
    },
    {
      id: 'budget-decimal-en',
      prompt: 'Anything under $49.99',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { maxPrice: 49.99 },
    },
    {
      id: 'budget-no-currency-word-en',
      prompt: 'I only have 50 for styling',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'styling', maxPrice: 50 },
    },
    // E — Multilingual
    {
      id: 'budget-hy-dram',
      prompt: 'Ես 5000 դրամ ունեմ մազակտման համար',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 5000 },
    },
    {
      id: 'budget-ru-ruble',
      prompt: 'У меня 3000 рублей на стрижку',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 3000 },
    },
    {
      id: 'budget-translit-under-50',
      prompt: 'U menya est 50 dollars na strizhku',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
    },
    {
      id: 'budget-euro-symbol-en',
      prompt: 'Facials under €40 please',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'facial', maxPrice: 40 },
    },
    // F — Negative / rescue
    {
      id: 'budget-not-gift-card-en',
      prompt: 'I have a $50 gift card for a haircut',
      surface: 'both',
      expectedAction: 'apply_gift_card_code',
      skipMaxPrice: true,
    },
    {
      id: 'budget-not-package-en',
      prompt: 'Any spa packages under $100?',
      surface: 'both',
      expectedAction: 'discover_packages',
      skipMaxPrice: true,
    },
    {
      id: 'budget-not-deposit-en',
      prompt: 'Is the $50 deposit enough for highlights?',
      surface: 'both',
      expectedAction: 'explain_checkout_currency',
      skipMaxPrice: true,
    },
    {
      id: 'budget-stale-session-en',
      prompt: 'actually I have $30',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { maxPrice: 30 },
    },
    // G — Phase 2 (documented)
    {
      id: 'budget-cart-total-en',
      prompt: 'Two services under $100 total',
      surface: 'both',
      expectedAction: 'list_services',
      phase2: true,
    },
    {
      id: 'budget-with-promo-en',
      prompt: 'Haircut under $50 with code SAVE10',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
      phase2: true,
    },
    {
      id: 'budget-subscription-en',
      prompt: 'Can my plan cover a $80 massage?',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      skipMaxPrice: true,
      phase2: true,
    },
    // H — Voice / mobile phrasing
    {
      id: 'budget-voice-short-en',
      prompt: 'Haircut fifty bucks max',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
    },
    {
      id: 'budget-voice-no-verb-en',
      prompt: 'Massage under 80',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'massage', maxPrice: 80 },
    },
    {
      id: 'budget-voice-asr-en',
      prompt: 'I have 50 dollars for her cut',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
    },
    {
      id: 'budget-voice-chip-en',
      prompt: 'Services under $50',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: { maxPrice: 50 },
    },
    {
      id: 'budget-question-en',
      prompt: 'Can I get a facial for less than 40?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'facial', maxPrice: 40 },
    },
    // J — Currency & amount edge cases
    {
      id: 'budget-range-en',
      prompt: 'Haircut between $40 and $60',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 60 },
      phase2: true,
    },
    {
      id: 'budget-round-number-en',
      prompt: 'About 50 dollars for styling',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'styling', maxPrice: 50 },
    },
    {
      id: 'budget-tenant-amd-en',
      prompt: 'Haircut under 15000 dram',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 15000 },
    },
    {
      id: 'budget-zero-en',
      prompt: 'Free consultation options?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { maxPrice: 0 },
    },
    {
      id: 'budget-large-en',
      prompt: 'Nothing over 500000 dram',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { maxPrice: 500000 },
    },
    {
      id: 'budget-voice-whisper-en',
      prompt: 'under fifty for a trim',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'trim', maxPrice: 50 },
    },
    {
      id: 'budget-currency-comma-en',
      prompt: 'Styles under $1,200 please',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'styling', maxPrice: 1200 },
    },
    // K — Provider / named service + budget
    {
      id: 'budget-named-service-en',
      prompt: 'Is Swedish massage under $90?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceName: 'Swedish massage', maxPrice: 90 },
    },
    {
      id: 'budget-any-provider-en',
      prompt: 'Any stylist for a cut under $45?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { allProviders: true, maxPrice: 45 },
    },
    {
      id: 'budget-provider-no-match-en',
      prompt: 'Karo — anything under $30?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { employeeName: 'Karo', maxPrice: 30 },
    },
    // L — Duration + budget (phase 2 hook)
    {
      id: 'budget-short-service-en',
      prompt: 'Quick haircut under $40',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 40 },
      phase2: true,
    },
    {
      id: 'budget-long-massage-en',
      prompt: '90-minute massage under $100',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'massage', maxPrice: 100 },
      phase2: true,
    },
  ];

/** Handler outcome matrix (section B) — catalog filter + navigate hints. */
function budgetHandlerFromSharedFilter(
  id: (typeof SHARED_BUDGET_FILTER_SCENARIO_IDS)[number],
  extras: Partial<BudgetHandlerOutcomeScenario> = {},
): BudgetHandlerOutcomeScenario {
  const base = FILTER_SERVICES_BY_MAX_PRICE_SCENARIOS.find(
    (scenario) => scenario.id === id,
  )!;
  return {
    id: base.id,
    services: base.services,
    maxPrice: base.maxPrice,
    expectedIds: base.expectedIds,
    ...extras,
  };
}

export const BUDGET_HANDLER_OUTCOME_SCENARIOS: BudgetHandlerOutcomeScenario[] = [
  budgetHandlerFromSharedFilter('budget-multiple-matches', {
    services: [
      { id: 'hair-55', name: 'Haircut premium', price: 55, serviceCategory: 'hair' },
      { id: 'hair-35', name: 'Haircut basic', price: 35, serviceCategory: 'hair' },
      { id: 'hair-45', name: 'Haircut standard', price: 45, serviceCategory: 'hair' },
    ],
  }),
  budgetHandlerFromSharedFilter('budget-exact-at-ceiling', {
    services: [
      { id: 'massage-50', name: 'Massage', price: 50, serviceCategory: 'massage' },
    ],
    expectedNavigateServiceId: 'massage-50',
  }),
  {
    id: 'budget-no-match-cheapest-hint',
    services: [
      { id: 'hair-55', name: 'Haircut standard', price: 55, serviceCategory: 'hair', durationMinutes: 30 },
      { id: 'hair-60', name: 'Haircut deluxe', price: 60, serviceCategory: 'hair', durationMinutes: 45 },
    ],
    maxPrice: 50,
    expectedIds: [],
    expectNoMatchHint: true,
  },
  {
    id: 'budget-single-match-navigate',
    services: [
      { id: 'massage-40', name: 'Relax massage', price: 40, serviceCategory: 'massage' },
      { id: 'massage-70', name: 'Deep tissue', price: 70, serviceCategory: 'massage' },
    ],
    maxPrice: 50,
    expectedIds: ['massage-40'],
    expectedNavigateServiceId: 'massage-40',
  },
  {
    id: 'budget-filter-after-category',
    services: [
      { id: 'hair-35', name: 'Cut basic', price: 35, serviceCategory: 'hair' },
      { id: 'hair-45', name: 'Cut standard', price: 45, serviceCategory: 'hair' },
      { id: 'hair-55', name: 'Cut premium', price: 55, serviceCategory: 'hair' },
      { id: 'hair-65', name: 'Cut deluxe', price: 65, serviceCategory: 'hair' },
      { id: 'hair-75', name: 'Cut vip', price: 75, serviceCategory: 'hair' },
      { id: 'nails-25', name: 'Manicure', price: 25, serviceCategory: 'nails' },
    ],
    maxPrice: 50,
    serviceCategory: 'hair',
    expectedIds: ['hair-35', 'hair-45'],
  },
];

/** Amount extraction golden rows (sections D, E, J). */
export const BUDGET_MAX_PRICE_EXTRACTION_SCENARIOS: BudgetMaxPriceExtractionScenario[] =
  [
    { id: 'budget-dollar-sign-en', prompt: 'I have $50 for a haircut', maxPrice: 50 },
    { id: 'budget-word-amount-en', prompt: 'I have fifty dollars for massage', maxPrice: 50 },
    { id: 'budget-under-phrase-en', prompt: 'Haircut below 50 bucks', maxPrice: 50 },
    { id: 'budget-decimal-en', prompt: 'Anything under $49.99', maxPrice: 49.99 },
    { id: 'budget-no-currency-word-en', prompt: 'I only have 50 for styling', maxPrice: 50 },
    { id: 'budget-hy-dram', prompt: 'Ես 5000 դրամ ունեմ մազակտման համար', maxPrice: 5000 },
    { id: 'budget-ru-ruble', prompt: 'У меня 3000 рублей на стрижку', maxPrice: 3000 },
    { id: 'budget-euro-symbol-en', prompt: 'Facials under €40 please', maxPrice: 40 },
    { id: 'budget-voice-short-en', prompt: 'Haircut fifty bucks max', maxPrice: 50 },
    { id: 'budget-voice-no-verb-en', prompt: 'Massage under 80', maxPrice: 80 },
    { id: 'budget-question-en', prompt: 'Can I get a facial for less than 40?', maxPrice: 40 },
    { id: 'budget-range-en', prompt: 'Haircut between $40 and $60', maxPrice: 60 },
    { id: 'budget-round-number-en', prompt: 'About 50 dollars for styling', maxPrice: 50 },
    { id: 'budget-tenant-amd-en', prompt: 'Haircut under 15000 dram', maxPrice: 15000 },
    { id: 'budget-zero-en', prompt: 'Free consultation options?', maxPrice: 0 },
    { id: 'budget-large-en', prompt: 'Nothing over 500000 dram', maxPrice: 500000 },
    {
      id: 'budget-voice-asr-en',
      prompt: 'I have 50 dollars for her cut',
      maxPrice: 50,
    },
    {
      id: 'budget-voice-chip-en',
      prompt: 'Services under $50',
      maxPrice: 50,
    },
    {
      id: 'budget-voice-whisper-en',
      prompt: 'under fifty for a trim',
      maxPrice: 50,
    },
    {
      id: 'budget-currency-comma-en',
      prompt: 'Styles under $1,200 please',
      maxPrice: 1200,
    },
    {
      id: 'budget-stale-session-en',
      prompt: 'actually I have $30',
      maxPrice: 30,
    },
    {
      id: 'budget-long-massage-en',
      prompt: '90-minute massage under $100',
      maxPrice: 100,
    },
    {
      id: 'budget-not-gift-card-en',
      prompt: 'I have a $50 gift card for a haircut',
      maxPrice: null,
      skipMaxPrice: true,
    },
    {
      id: 'budget-not-package-en',
      prompt: 'Any spa packages under $100?',
      maxPrice: null,
      skipMaxPrice: true,
    },
    {
      id: 'budget-not-deposit-en',
      prompt: 'Is the $50 deposit enough for highlights?',
      maxPrice: null,
      skipMaxPrice: true,
    },
  ];

/** Multi-turn session flows (section I). */
export const BUDGET_SESSION_SCENARIOS: BudgetSessionScenario[] = [
  {
    id: 'budget-session-raise-en',
    surface: 'both',
    turns: [
      { prompt: 'Show me haircuts under $40', expectedParams: { maxPrice: 40 } },
      { prompt: 'ok what about $60?', expectedParams: { maxPrice: 60 } },
    ],
  },
  {
    id: 'budget-session-service-switch-en',
    surface: 'both',
    turns: [
      {
        prompt: 'Haircut options under $50',
        expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
      },
      {
        prompt: 'any massage in that budget?',
        expectedParams: { serviceCategory: 'massage', maxPrice: 50 },
      },
    ],
  },
  {
    id: 'budget-session-after-list-en',
    surface: 'both',
    turns: [
      { prompt: 'What can I book under $50?', expectedParams: { maxPrice: 50 } },
      {
        prompt: 'book the cheapest tomorrow',
        expectedParams: { maxPrice: 50, bookingFirstAvailable: true },
      },
    ],
  },
  {
    id: 'budget-session-stale-service-en',
    surface: 'both',
    turns: [
      {
        prompt: 'Haircut under $50',
        expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
      },
      {
        prompt: 'actually nails',
        expectedParams: { serviceCategory: 'nails', maxPrice: 50 },
      },
    ],
  },
];

export const BUDGET_DISAMBIGUATION_SCENARIOS = SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
  (scenario) => scenario.skipMaxPrice,
);

/** Section H — voice / mobile phrasing (budget-1.12). */
export const BUDGET_VOICE_SCENARIOS = SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
  (scenario) =>
    scenario.id.startsWith('budget-voice-') ||
    scenario.id === 'budget-question-en',
);

/** Section I — multi-turn session flows (budget-1.12). */
export { BUDGET_SESSION_SCENARIOS as BUDGET_SESSION_FIXTURES };

/** Section J — currency & amount edge cases (budget-1.12). */
export const BUDGET_CURRENCY_EDGE_SCENARIOS = SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
  (scenario) =>
    scenario.id.startsWith('budget-range-') ||
    scenario.id.startsWith('budget-round-') ||
    scenario.id.startsWith('budget-tenant-') ||
    scenario.id.startsWith('budget-zero-') ||
    scenario.id.startsWith('budget-large-') ||
    scenario.id.startsWith('budget-currency-'),
);

/** Section K — provider / named service + budget (budget-1.12). */
export const BUDGET_PROVIDER_NAMED_SCENARIOS = SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
  (scenario) =>
    scenario.id.startsWith('budget-named-') ||
    scenario.id.startsWith('budget-any-provider-') ||
    scenario.id === 'budget-provider-no-match-en',
);

/** Section L — duration + budget hooks (budget-1.12). */
export const BUDGET_DURATION_SCENARIOS = SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
  (scenario) =>
    scenario.id.startsWith('budget-short-service-') ||
    scenario.id.startsWith('budget-long-massage-'),
);

/** Unique fixture ids across NL prompts, session flows, and handler outcomes. */
export const BUDGET_DOMAIN_FIXTURE_IDS: readonly string[] = [
  ...new Set([
    ...SIMILAR_BUDGET_SERVICE_PROMPTS.map((scenario) => scenario.id),
    ...BUDGET_SESSION_SCENARIOS.map((scenario) => scenario.id),
    ...BUDGET_HANDLER_OUTCOME_SCENARIOS.map((scenario) => scenario.id),
  ]),
];

export const BUDGET_SERVICE_DISCOVERY_PUBLIC_PROMPTS =
  SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
    (scenario) =>
      scenario.surface === 'public' || scenario.surface === 'both',
  );

export const BUDGET_SERVICE_DISCOVERY_CUSTOMER_PROMPTS =
  SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
    (scenario) =>
      scenario.surface === 'customer' || scenario.surface === 'both',
  );
