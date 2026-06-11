import type { ServiceCatalogPriceEntry } from './ai-service-catalog-rank.util.js';
import {
  FILTER_SERVICES_BY_MAX_PRICE_SCENARIOS,
  SHARED_BUDGET_FILTER_SCENARIO_IDS,
} from './ai-service-catalog-rank.fixtures.js';

/** Customer/public classifier rules for budget-constrained service discovery (budget-1.10). */
export const BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES = `- list_services: READ — browse or filter the public service catalog. When the user states a spending limit, set maxPrice (number, inclusive ceiling in tenant default currency). Triggers: under/below/at most/no more than $X, "I have $X", "what can I book with $X", "options under $X", cheapest/affordable within a budget. Optional serviceName, serviceCategory, employeeName. Sort matches by price ascending in the handler. NOT discover_packages (bundles/deals catalog), NOT apply_gift_card_code (gift card balance), NOT explain_checkout_currency (currency display), and NOT explain_checkout_total (deposit vs service price).
- maxTotalPrice + serviceCount: when the user caps a multi-service cart combined total ("two services under $100 total"), set maxTotalPrice (combined ceiling) and serviceCount (default 2). Do NOT set maxPrice for combined-total prompts — per-service ceiling differs from cart total.
- Session budget override: follow-up turns like "actually I have $30" replace stale session maxPrice even when the prior turn listed options under $50.
- Budget + promo code: "haircut under $50 with code SAVE10" → list_services with maxPrice + promoCode for checkout; filter catalog first, promo applied at checkout only — NOT promo_code_help.
- Subscription balance: "can my plan cover a $80 massage?" → discover_subscription_plans (customer) — plan credit READ, NOT list_services maxPrice.
- Price range: "haircut between $40 and $60" → list_services with minPrice=40 and maxPrice=60 (inclusive band).
- Voice ASR: "I have 50 dollars for her cut" → list_services with maxPrice=50; map homophone "her cut" → serviceCategory=haircut.
- Named service + budget: "Is Swedish massage under $90?" → list_services with serviceName=Swedish massage and maxPrice=90 — filter one catalog row, not serviceCategory keyword.
- Any provider + budget: "Any stylist for a cut under $45?" → list_services with allProviders=true and maxPrice=45 — team-wide scope for follow-up booking; NOT recommend_specialists (no best/rated cue).
- Named provider + budget: "Karo — anything under $30?" / "Does Karo have anything under $40?" → list_services with employeeName=Karo and maxPrice; provider-scoped catalog may return empty with closest-options hint when nothing fits.
- Short duration + budget: "Quick haircut under $40" → list_services with serviceCategory=haircut, maxPrice=40, preferShortDuration=true — sort matches by shortest durationMinutes first within the budget band.
- Long duration + budget: "90-minute massage under $100" → list_services with serviceCategory=massage, maxPrice=100, minDurationMinutes=90 — only sessions at least 90 minutes; honest no-match when all long options exceed the ceiling.
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
  durationMinutes?: number | null;
};

export type BudgetHandlerOutcomeScenario = {
  id: string;
  services: CatalogFixtureService[];
  maxPrice?: number;
  minPrice?: number;
  maxTotalPrice?: number;
  serviceCount?: number;
  serviceCategory?: string;
  serviceName?: string;
  employeeName?: string;
  preferShortDuration?: boolean;
  minDurationMinutes?: number;
  expectedIds?: string[];
  expectedComboIds?: string[][];
  expectedNavigateServiceId?: string | null;
  expectNoMatchHint?: boolean;
};

export type BudgetMaxPriceExtractionScenario = {
  id: string;
  prompt: string;
  maxPrice: number | null;
  skipMaxPrice?: boolean;
};

export type BudgetCartTotalExtractionScenario = {
  id: string;
  prompt: string;
  maxTotalPrice: number;
  serviceCount: number;
};

export type BudgetPromoExtractionScenario = {
  id: string;
  prompt: string;
  maxPrice: number;
  promoCode: string;
};

export type BudgetRangeExtractionScenario = {
  id: string;
  prompt: string;
  minPrice: number;
  maxPrice: number;
};

export type BudgetVoiceAsrExtractionScenario = {
  id: string;
  prompt: string;
  maxPrice: number;
  serviceCategory: string;
};

export type BudgetNamedServiceExtractionScenario = {
  id: string;
  prompt: string;
  maxPrice: number;
  serviceName: string;
};

export type BudgetAnyProviderExtractionScenario = {
  id: string;
  prompt: string;
  maxPrice: number;
  allProviders: boolean;
};

export type BudgetProviderEmployeeExtractionScenario = {
  id: string;
  prompt: string;
  maxPrice: number;
  employeeName: string;
};

export type BudgetShortDurationExtractionScenario = {
  id: string;
  prompt: string;
  maxPrice: number;
  serviceCategory: string;
  preferShortDuration: boolean;
};

export type BudgetLongDurationExtractionScenario = {
  id: string;
  prompt: string;
  maxPrice: number;
  serviceCategory: string;
  minDurationMinutes: number;
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
      expectedAction: 'check_availability',
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
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
      id: 'budget-not-gift-card-or-en',
      prompt: '$50 gift card, haircut tomorrow or Friday',
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
      id: 'budget-not-currency-explain-en',
      prompt: 'Why is premium $120 in dram?',
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
    // G — Multi-service cart total
    {
      id: 'budget-cart-total-en',
      prompt: 'Two services under $100 total',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { maxTotalPrice: 100, serviceCount: 2 },
    },
    {
      id: 'discover-not-multi-cart-en',
      prompt: 'Two services under $100 total tomorrow',
      surface: 'both',
      phase2: true,
      expectedAction: 'list_services',
      expectedParams: { maxTotalPrice: 100, serviceCount: 2 },
    },
    {
      id: 'budget-with-promo-en',
      prompt: 'Haircut under $50 with code SAVE10',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        promoCode: 'SAVE10',
      },
    },
    {
      id: 'budget-subscription-en',
      prompt: 'Can my plan cover a $80 massage?',
      surface: 'customer',
      expectedAction: 'discover_subscription_plans',
      skipMaxPrice: true,
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
      expectedParams: {
        serviceCategory: 'haircut',
        minPrice: 40,
        maxPrice: 60,
      },
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
    // L — Duration + budget
    {
      id: 'budget-short-service-en',
      prompt: 'Quick haircut under $40',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 40,
        preferShortDuration: true,
      },
    },
    {
      id: 'budget-long-massage-en',
      prompt: '90-minute massage under $100',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'massage',
        maxPrice: 100,
        minDurationMinutes: 90,
      },
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
    id: 'budget-named-service-en',
    services: [
      { id: 'sw85', name: 'Swedish massage', price: 85 },
      { id: 'sw95', name: 'Swedish massage (90 min)', price: 95 },
      { id: 'dt70', name: 'Deep tissue massage', price: 70 },
    ],
    maxPrice: 90,
    serviceName: 'Swedish massage',
    expectedIds: ['sw85'],
    expectedNavigateServiceId: 'sw85',
  },
  {
    id: 'budget-any-provider-en',
    services: [
      { id: 'h35', name: 'Haircut basic', price: 35, serviceCategory: 'haircut' },
      { id: 'h45', name: 'Haircut standard', price: 45, serviceCategory: 'haircut' },
      { id: 'h55', name: 'Haircut premium', price: 55, serviceCategory: 'haircut' },
      { id: 'm40', name: 'Express massage', price: 40, serviceCategory: 'massage' },
    ],
    maxPrice: 45,
    expectedIds: ['h35', 'm40', 'h45'],
  },
  {
    id: 'budget-provider-no-match-en',
    services: [
      { id: 'k35', name: 'Karo cut basic', price: 35, serviceCategory: 'haircut' },
      { id: 'k45', name: 'Karo cut standard', price: 45, serviceCategory: 'haircut' },
    ],
    maxPrice: 30,
    employeeName: 'Karo',
    expectedIds: [],
    expectNoMatchHint: true,
  },
  {
    id: 'budget-short-service-en',
    services: [
      { id: 'h20', name: 'Quick cut', price: 35, durationMinutes: 20, serviceCategory: 'haircut' },
      { id: 'h30', name: 'Haircut standard', price: 38, durationMinutes: 30, serviceCategory: 'haircut' },
      { id: 'h45', name: 'Haircut premium', price: 40, durationMinutes: 45, serviceCategory: 'haircut' },
      { id: 'h55', name: 'Haircut deluxe', price: 55, durationMinutes: 60, serviceCategory: 'haircut' },
    ],
    maxPrice: 40,
    serviceCategory: 'haircut',
    preferShortDuration: true,
    expectedIds: ['h20', 'h30', 'h45'],
  },
  {
    id: 'budget-long-massage-en',
    services: [
      { id: 'm90-95', name: 'Deep massage 90m', price: 95, durationMinutes: 90, serviceCategory: 'massage' },
      { id: 'm60-70', name: 'Relax massage 60m', price: 70, durationMinutes: 60, serviceCategory: 'massage' },
      { id: 'm90-110', name: 'Luxury massage 90m', price: 110, durationMinutes: 90, serviceCategory: 'massage' },
    ],
    maxPrice: 100,
    minDurationMinutes: 90,
    serviceCategory: 'massage',
    expectedIds: ['m90-95'],
    expectedNavigateServiceId: 'm90-95',
  },
  {
    id: 'budget-long-massage-no-match-en',
    services: [
      { id: 'm90-105', name: 'Deep massage 90m', price: 105, durationMinutes: 90, serviceCategory: 'massage' },
      { id: 'm90-120', name: 'Luxury massage 90m', price: 120, durationMinutes: 90, serviceCategory: 'massage' },
    ],
    maxPrice: 100,
    minDurationMinutes: 90,
    serviceCategory: 'massage',
    expectedIds: [],
    expectNoMatchHint: true,
  },
  {
    id: 'budget-range-en',
    services: [
      { id: 'h35', name: 'Haircut basic', price: 35, serviceCategory: 'haircut' },
      { id: 'h45', name: 'Haircut standard', price: 45, serviceCategory: 'haircut' },
      { id: 'h55', name: 'Haircut premium', price: 55, serviceCategory: 'haircut' },
      { id: 'h65', name: 'Haircut deluxe', price: 65, serviceCategory: 'haircut' },
    ],
    minPrice: 40,
    maxPrice: 60,
    serviceCategory: 'haircut',
    expectedIds: ['h45', 'h55'],
  },
  {
    id: 'budget-cart-total-en',
    services: [
      { id: 'h1', name: 'Haircut basic', price: 35, serviceCategory: 'haircut' },
      { id: 'f1', name: 'Express facial', price: 45, serviceCategory: 'facial' },
      { id: 'm1', name: 'Deep massage', price: 70, serviceCategory: 'massage' },
    ],
    maxTotalPrice: 100,
    serviceCount: 2,
    expectedComboIds: [['h1', 'f1']],
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
    {
      id: 'budget-not-currency-explain-en',
      prompt: 'Why is premium $120 in dram?',
      maxPrice: null,
      skipMaxPrice: true,
    },
    {
      id: 'discover-hy-budget-or-en',
      prompt:
        'Ցանկանում եմ մազակրտում վաղը երեկոյան կամ ուրբաթ, 5000 դրամ ունեմ',
      maxPrice: 5000,
    },
    {
      id: 'discover-ru-premium-en',
      prompt: 'Люксовый массаж до 8000 рублей завтра вечером',
      maxPrice: 8000,
    },
    {
      id: 'discover-hy-cheapest-en',
      prompt: 'Ամենաէժան մանիկյուր $30-ից ցածր',
      maxPrice: 30,
    },
    {
      id: 'budget-cart-total-en',
      prompt: 'Two services under $100 total',
      maxPrice: null,
      skipMaxPrice: true,
    },
    {
      id: 'budget-subscription-en',
      prompt: 'Can my plan cover a $80 massage?',
      maxPrice: null,
      skipMaxPrice: true,
    },
  ];

export const BUDGET_CART_TOTAL_EXTRACTION_SCENARIOS: BudgetCartTotalExtractionScenario[] =
  [
    {
      id: 'budget-cart-total-en',
      prompt: 'Two services under $100 total',
      maxTotalPrice: 100,
      serviceCount: 2,
    },
    {
      id: 'discover-not-multi-cart-en',
      prompt: 'Two services under $100 total tomorrow',
      maxTotalPrice: 100,
      serviceCount: 2,
    },
  ];

export const BUDGET_PROMO_EXTRACTION_SCENARIOS: BudgetPromoExtractionScenario[] =
  [
    {
      id: 'budget-with-promo-en',
      prompt: 'Haircut under $50 with code SAVE10',
      maxPrice: 50,
      promoCode: 'SAVE10',
    },
  ];

export const BUDGET_RANGE_EXTRACTION_SCENARIOS: BudgetRangeExtractionScenario[] =
  [
    {
      id: 'budget-range-en',
      prompt: 'Haircut between $40 and $60',
      minPrice: 40,
      maxPrice: 60,
    },
  ];

export const BUDGET_VOICE_ASR_EXTRACTION_SCENARIOS: BudgetVoiceAsrExtractionScenario[] =
  [
    {
      id: 'budget-voice-asr-en',
      prompt: 'I have 50 dollars for her cut',
      maxPrice: 50,
      serviceCategory: 'haircut',
    },
  ];

export const BUDGET_NAMED_SERVICE_EXTRACTION_SCENARIOS: BudgetNamedServiceExtractionScenario[] =
  [
    {
      id: 'budget-named-service-en',
      prompt: 'Is Swedish massage under $90?',
      maxPrice: 90,
      serviceName: 'Swedish massage',
    },
  ];

export const BUDGET_ANY_PROVIDER_EXTRACTION_SCENARIOS: BudgetAnyProviderExtractionScenario[] =
  [
    {
      id: 'budget-any-provider-en',
      prompt: 'Any stylist for a cut under $45?',
      maxPrice: 45,
      allProviders: true,
    },
  ];

export const BUDGET_PROVIDER_EMPLOYEE_EXTRACTION_SCENARIOS: BudgetProviderEmployeeExtractionScenario[] =
  [
    {
      id: 'budget-provider-karo-en',
      prompt: 'Does Karo have anything under $40?',
      maxPrice: 40,
      employeeName: 'Karo',
    },
    {
      id: 'budget-provider-no-match-en',
      prompt: 'Karo — anything under $30?',
      maxPrice: 30,
      employeeName: 'Karo',
    },
  ];

export const BUDGET_SHORT_DURATION_EXTRACTION_SCENARIOS: BudgetShortDurationExtractionScenario[] =
  [
    {
      id: 'budget-short-service-en',
      prompt: 'Quick haircut under $40',
      maxPrice: 40,
      serviceCategory: 'haircut',
      preferShortDuration: true,
    },
  ];

export const BUDGET_LONG_DURATION_EXTRACTION_SCENARIOS: BudgetLongDurationExtractionScenario[] =
  [
    {
      id: 'budget-long-massage-en',
      prompt: '90-minute massage under $100',
      maxPrice: 100,
      serviceCategory: 'massage',
      minDurationMinutes: 90,
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
  {
    id: 'budget-session-stale-budget-en',
    surface: 'both',
    turns: [
      {
        prompt: 'Haircut under $50',
        expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
      },
      {
        prompt: 'actually I have $30',
        expectedParams: { maxPrice: 30 },
      },
    ],
  },
  {
    id: 'budget-session-list-then-pick-en',
    surface: 'both',
    turns: [
      {
        prompt: "Show options under $40 then I'll pick",
        expectedParams: { maxPrice: 40 },
      },
      {
        prompt: 'Haircut basic tomorrow — who is free?',
        expectedParams: {
          maxPrice: 40,
          serviceName: 'Haircut basic',
        },
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
