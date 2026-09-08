import type { CatalogFixtureService } from './ai-service-catalog-rank.fixtures.js';
import { DISCOVER_INTERSECTION_CATALOG } from './ai-service-catalog-rank.fixtures.js';

/** Extended catalog for cross-sprint discover integration (discover-1.6). */
export const SERVICE_DISCOVERY_INTEGRATION_CATALOG: CatalogFixtureService[] = [
  ...DISCOVER_INTERSECTION_CATALOG,
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
];

export type ServiceDiscoveryPublicIntegrationScenario = {
  id: string;
  section: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'H';
  prompt: string;
  action: string;
  /** Simulated public classifier params before post-LLM rescue. */
  classifierParams?: Record<string, unknown>;
  /** Params added or changed by enrichDiscoveryParamsFromPrompt (discover-1.3). */
  expectedDiscovery?: Record<string, unknown>;
  forbiddenDiscoveryKeys?: string[];
  expectedCatalogIds?: string[];
  catalogParams?: Record<string, unknown>;
  expectSingleWindow?: boolean;
  expectOrWindowCount?: number;
  publicCompoundSteps?: string[];
  rescuedFromAction?: string;
  rescuedAction?: string;
  rescueReason?: string;
  /** Customer surface misroute target when it differs from public (section H). */
  customerRescuedAction?: string;
  /** Dashboard admin negative — stays on list_services READ (discover-not-admin-en). */
  surface?: 'public' | 'customer' | 'dashboard';
  /** Phase 2 multi-service cart — excluded from consumer eval (discover-not-multi-cart-en). */
  phase2?: boolean;
  /** Cart-total handler golden combo ids (phase 2). */
  expectedCartComboIds?: string[][];
};

export type ServiceDiscoveryJourneyTurn = {
  prompt: string;
  action: string;
  expectedDiscovery: Record<string, unknown>;
  forbiddenDiscoveryKeys?: string[];
  /** Use public assistant service-name enrichment (clarify follow-up turns). */
  usePublicAssistantEnrichment?: boolean;
};

export type ServiceDiscoveryJourneyScenario = {
  id: string;
  section: 'F';
  /** Classifier / prior session context before turn 1. */
  initialSession?: Record<string, unknown>;
  turns: ServiceDiscoveryJourneyTurn[];
  expectedListCatalogIds?: string[];
  listCatalogTurnIndex?: number;
  expectedBudgetRankCatalogIds?: string[];
  budgetRankCatalogParams?: Record<string, unknown>;
  budgetRankTurnIndex?: number;
  expectedClarifyServiceId?: string;
  clarifyTurnIndex?: number;
  expectedBookServiceId?: string;
  listCatalogParams?: Record<string, unknown>;
};

/** Cross-sprint canonical public assistant rows (TODO ai-cmd-discover sections A–F + H). */
export const SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS: ServiceDiscoveryPublicIntegrationScenario[] =
  [
    // A — Budget + rank (what to book)
    {
      id: 'discover-cheapest-under-en',
      section: 'A',
      prompt: 'Cheapest haircut under $50',
      action: 'list_services',
      classifierParams: { serviceCategory: 'haircut' },
      expectedDiscovery: {
        maxPrice: 50,
        serviceRank: 'lowest_price',
      },
      catalogParams: {
        maxPrice: 50,
        serviceRank: 'lowest_price',
        serviceCategory: 'haircut',
        limit: 1,
      },
      expectedCatalogIds: ['hair-35'],
    },
    {
      id: 'discover-premium-under-en',
      section: 'A',
      prompt: 'Best premium facial under $120',
      action: 'list_services',
      classifierParams: { serviceCategory: 'facial' },
      expectedDiscovery: {
        maxPrice: 120,
        serviceRank: 'highest_price',
      },
      catalogParams: {
        maxPrice: 120,
        serviceRank: 'highest_price',
        serviceCategory: 'facial',
        limit: 1,
      },
      expectedCatalogIds: ['facial-120'],
    },
    {
      id: 'discover-value-or-premium-en',
      section: 'A',
      prompt: 'Affordable or premium massage — what fits $80?',
      action: 'list_services',
      classifierParams: { serviceCategory: 'massage' },
      expectedDiscovery: {
        maxPrice: 80,
      },
      catalogParams: {
        maxPrice: 80,
        serviceCategory: 'massage',
      },
      expectedCatalogIds: ['massage-55', 'massage-65'],
    },
    {
      id: 'discover-no-premium-in-budget-en',
      section: 'A',
      prompt: 'Premium haircut under $30 (none exist)',
      action: 'list_services',
      classifierParams: { serviceCategory: 'haircut' },
      expectedDiscovery: {
        maxPrice: 30,
        serviceRank: 'highest_price',
      },
      catalogParams: {
        maxPrice: 30,
        serviceRank: 'highest_price',
        serviceCategory: 'haircut',
        limit: 1,
      },
      expectedCatalogIds: [],
    },
    // B — Budget + availability (single window)
    {
      id: 'discover-budget-tomorrow-eve-en',
      section: 'B',
      prompt: 'Haircut under $50 tomorrow evening',
      action: 'check_availability',
      classifierParams: {
        serviceCategory: 'haircut',
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
      expectedDiscovery: {
        maxPrice: 50,
      },
      expectSingleWindow: true,
    },
    {
      id: 'discover-budget-asap-en',
      section: 'B',
      prompt: 'Anything under $40 ASAP',
      action: 'book_appointment',
      classifierParams: {
        bookingFirstAvailable: true,
      },
      expectedDiscovery: {
        maxPrice: 40,
        bookingFirstAvailable: true,
      },
      catalogParams: {
        maxPrice: 40,
        limit: 1,
      },
      expectedCatalogIds: ['manicure-25'],
    },
    {
      id: 'discover-budget-weekend-en',
      section: 'B',
      prompt: 'Massage under $70 this Saturday afternoon',
      action: 'check_availability',
      classifierParams: {
        serviceCategory: 'massage',
        weekdays: ['saturday'],
        timeOfDay: 'afternoon',
      },
      expectedDiscovery: {
        maxPrice: 70,
      },
      catalogParams: {
        maxPrice: 70,
        serviceCategory: 'massage',
      },
      expectedCatalogIds: ['massage-55', 'massage-65'],
      expectSingleWindow: true,
    },
    // C — Rank + availability
    {
      id: 'discover-premium-tomorrow-en',
      section: 'C',
      prompt: 'Book your most premium facial tomorrow nearest slot',
      action: 'book_appointment',
      classifierParams: {
        serviceCategory: 'facial',
        date: 'tomorrow',
        bookingFirstAvailable: true,
      },
      expectedDiscovery: {
        serviceRank: 'highest_price',
      },
      catalogParams: {
        serviceRank: 'highest_price',
        serviceCategory: 'facial',
        limit: 1,
      },
      expectedCatalogIds: ['facial-120'],
      publicCompoundSteps: ['list_services', 'book_appointment'],
    },
    {
      id: 'discover-cheapest-friday-en',
      section: 'C',
      prompt: 'Cheapest manicure Friday afternoon if available',
      action: 'check_availability',
      classifierParams: {
        serviceCategory: 'manicure',
        weekdays: ['friday'],
        timeOfDay: 'afternoon',
      },
      expectedDiscovery: {
        serviceRank: 'lowest_price',
      },
      catalogParams: {
        serviceRank: 'lowest_price',
        serviceCategory: 'manicure',
        limit: 1,
      },
      expectedCatalogIds: ['manicure-25'],
      expectSingleWindow: true,
    },
    // D — Triple intersection (budget + rank + OR windows)
    {
      id: 'discover-flagship-en',
      section: 'D',
      prompt:
        'I want a haircut tomorrow evening or Friday afternoon, I have $50',
      action: 'check_availability',
      classifierParams: {
        serviceCategory: 'haircut',
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
      expectedDiscovery: {
        maxPrice: 50,
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
      forbiddenDiscoveryKeys: ['date', 'timeOfDay'],
      expectOrWindowCount: 2,
    },
    {
      id: 'discover-flagship-book-en',
      section: 'D',
      prompt:
        'Book cheapest massage tomorrow or Thursday evening under $80, whichever is sooner',
      action: 'book_appointment',
      classifierParams: {
        serviceCategory: 'massage',
        bookingFirstAvailable: true,
      },
      expectedDiscovery: {
        maxPrice: 80,
        serviceRank: 'lowest_price',
        bookingFirstAvailable: true,
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['thursday'], timeOfDay: 'evening' },
        ],
      },
      catalogParams: {
        maxPrice: 80,
        serviceRank: 'lowest_price',
        serviceCategory: 'massage',
        limit: 1,
      },
      expectedCatalogIds: ['massage-55'],
      expectOrWindowCount: 2,
      publicCompoundSteps: ['check_availability', 'book_appointment'],
    },
    {
      id: 'discover-flagship-premium-en',
      section: 'D',
      prompt:
        'Best premium styling tomorrow or Saturday under $150, whichever is sooner',
      action: 'book_appointment',
      classifierParams: {
        serviceCategory: 'styling',
        bookingFirstAvailable: true,
      },
      expectedDiscovery: {
        maxPrice: 150,
        serviceRank: 'highest_price',
        bookingFirstAvailable: true,
        availabilityWindows: [{ date: 'tomorrow' }, { weekdays: ['saturday'] }],
      },
      catalogParams: {
        maxPrice: 150,
        serviceRank: 'highest_price',
        serviceCategory: 'styling',
        limit: 1,
      },
      expectedCatalogIds: ['style-140'],
      expectOrWindowCount: 2,
      publicCompoundSteps: ['check_availability', 'book_appointment'],
    },
    {
      id: 'discover-flagship-question-en',
      section: 'D',
      prompt: 'Can I afford a deluxe facial tomorrow or Sunday under $100?',
      action: 'list_services',
      classifierParams: {
        serviceCategory: 'facial',
      },
      expectedDiscovery: {
        maxPrice: 100,
        availabilityWindows: [{ date: 'tomorrow' }, { weekdays: ['sunday'] }],
      },
      forbiddenDiscoveryKeys: ['serviceRank'],
      catalogParams: {
        maxPrice: 100,
        serviceCategory: 'facial',
      },
      expectedCatalogIds: ['facial-55', 'facial-95'],
      expectOrWindowCount: 2,
    },
    // E — Triple + provider
    {
      id: 'discover-provider-budget-or-en',
      section: 'E',
      prompt: 'Karo or anyone — haircut under $50 tomorrow eve or Fri PM',
      action: 'check_availability',
      classifierParams: {
        serviceCategory: 'haircut',
      },
      expectedDiscovery: {
        maxPrice: 50,
        availabilityWindows: [
          { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
      forbiddenDiscoveryKeys: ['date', 'timeOfDay', 'weekdays', 'employeeName'],
      catalogParams: {
        maxPrice: 50,
        serviceCategory: 'haircut',
      },
      expectedCatalogIds: ['hair-35', 'hair-45'],
      expectOrWindowCount: 2,
    },
    {
      id: 'discover-best-provider-budget-en',
      section: 'E',
      prompt: 'Best rated stylist for a cut under $60 this week',
      action: 'recommend_specialists',
      classifierParams: {
        serviceCategory: 'haircut',
      },
      expectedDiscovery: {
        maxPrice: 60,
        // e2e-bug.323 / §231 — the enrichment deliberately keeps the *raw*
        // token: pre-aliasing `cut` to `haircut` discards it before
        // matchServicesByQuery runs, so catalogs with literal "Men's cut" rows
        // lose to an unrelated `hairstyle` match. `expandServiceLookupQueries('cut')`
        // still returns the whole haircut family, so nothing is lost downstream —
        // which is why `classifierParams` and `catalogParams` below stay
        // 'haircut' while the enrichment's own output is 'cut'.
        serviceCategory: 'cut',
      },
      forbiddenDiscoveryKeys: ['serviceRank'],
      catalogParams: {
        maxPrice: 60,
        serviceCategory: 'haircut',
      },
      expectedCatalogIds: ['hair-35', 'hair-45'],
      rescuedFromAction: 'list_services',
      rescuedAction: 'recommend_specialists',
      rescueReason: 'budget_recommend_specialists',
    },
    // H — Negative / must-not-break
    {
      id: 'discover-not-gift-en',
      section: 'H',
      prompt: '$50 gift card, premium cut tomorrow',
      action: 'list_services',
      classifierParams: {
        serviceCategory: 'haircut',
        date: 'tomorrow',
        maxPrice: 50,
      },
      expectedDiscovery: {
        // §231 — same as above: "premium cut tomorrow" carries the raw `cut`.
        serviceCategory: 'cut',
        date: 'tomorrow',
      },
      forbiddenDiscoveryKeys: [
        'maxPrice',
        'serviceRank',
        'availabilityWindows',
      ],
      rescuedFromAction: 'list_services',
      rescuedAction: 'booking_help',
      rescueReason: 'apply_gift_card_code',
      customerRescuedAction: 'apply_gift_card_code',
    },
    {
      id: 'discover-not-package-en',
      section: 'H',
      prompt: 'Premium package under $200',
      action: 'list_services',
      expectedDiscovery: {},
      forbiddenDiscoveryKeys: ['maxPrice'],
      rescuedFromAction: 'list_services',
      rescuedAction: 'booking_help',
      rescueReason: 'discover_packages',
    },
    {
      id: 'discover-not-admin-en',
      section: 'H',
      surface: 'dashboard',
      prompt: 'services under $50',
      action: 'list_services',
      expectedDiscovery: {
        maxPrice: 50,
      },
      forbiddenDiscoveryKeys: [
        'availabilityWindows',
        'serviceRank',
        'maxTotalPrice',
        'serviceCount',
        'bookingFirstAvailable',
      ],
      catalogParams: {
        maxPrice: 50,
      },
      expectedCatalogIds: ['manicure-25', 'hair-35', 'manicure-40', 'hair-45'],
    },
    {
      id: 'discover-not-currency-explain-en',
      section: 'H',
      prompt: 'Why is premium $120 in dram?',
      action: 'list_services',
      classifierParams: {
        serviceCategory: 'haircut',
        maxPrice: 120,
        serviceRank: 'highest_price',
      },
      expectedDiscovery: {},
      forbiddenDiscoveryKeys: [
        'maxPrice',
        'serviceRank',
        'availabilityWindows',
        'serviceCategory',
      ],
      rescuedFromAction: 'list_services',
      rescuedAction: 'explain_checkout_currency',
      rescueReason: 'explain_checkout_currency',
      customerRescuedAction: 'explain_checkout_currency',
    },
    {
      id: 'discover-not-multi-cart-en',
      section: 'H',
      phase2: true,
      prompt: 'Two services under $100 total tomorrow',
      action: 'list_services',
      expectedDiscovery: {
        maxTotalPrice: 100,
        serviceCount: 2,
        date: 'tomorrow',
      },
      forbiddenDiscoveryKeys: [
        'maxPrice',
        'availabilityWindows',
        'serviceRank',
      ],
      catalogParams: {
        maxTotalPrice: 100,
        serviceCount: 2,
      },
      expectedCartComboIds: [['hair-35', 'facial-55']],
    },
  ];

/** Multi-turn discover journeys (TODO section F). */
export const SERVICE_DISCOVERY_JOURNEY_SCENARIOS: ServiceDiscoveryJourneyScenario[] =
  [
    {
      id: 'discover-journey-budget-list-book-en',
      section: 'F',
      turns: [
        {
          prompt: "what's under $50 for hair",
          action: 'list_services',
          expectedDiscovery: {
            maxPrice: 50,
            serviceCategory: 'hair',
          },
          forbiddenDiscoveryKeys: ['serviceRank'],
        },
        {
          prompt: 'tomorrow evening or Friday afternoon',
          action: 'check_availability',
          expectedDiscovery: {
            maxPrice: 50,
            serviceCategory: 'hair',
            availabilityWindows: [
              { date: 'tomorrow', timeOfDay: 'evening' },
              { weekdays: ['friday'], timeOfDay: 'afternoon' },
            ],
          },
          forbiddenDiscoveryKeys: ['date', 'timeOfDay', 'weekdays'],
        },
        {
          prompt: 'book cheapest',
          action: 'book_appointment',
          expectedDiscovery: {
            maxPrice: 50,
            serviceCategory: 'hair',
            serviceRank: 'lowest_price',
            availabilityWindows: [
              { date: 'tomorrow', timeOfDay: 'evening' },
              { weekdays: ['friday'], timeOfDay: 'afternoon' },
            ],
          },
        },
      ],
      listCatalogParams: {
        maxPrice: 50,
        serviceCategory: 'hair',
      },
      expectedListCatalogIds: ['hair-35', 'hair-45'],
      expectedBookServiceId: 'hair-35',
    },
    {
      id: 'discover-journey-premium-en',
      section: 'F',
      initialSession: { serviceCategory: 'massage' },
      turns: [
        {
          prompt: 'premium options',
          action: 'list_services',
          expectedDiscovery: {
            serviceRank: 'highest_price',
            serviceCategory: 'massage',
          },
        },
        {
          prompt: 'too much — under $90?',
          action: 'list_services',
          expectedDiscovery: {
            serviceRank: 'highest_price',
            serviceCategory: 'massage',
            maxPrice: 90,
          },
        },
        {
          prompt: 'Saturday afternoon',
          action: 'check_availability',
          expectedDiscovery: {
            serviceRank: 'highest_price',
            serviceCategory: 'massage',
            maxPrice: 90,
            weekdays: ['saturday'],
            timeOfDay: 'afternoon',
          },
          forbiddenDiscoveryKeys: ['date', 'availabilityWindows'],
        },
      ],
      listCatalogParams: {
        serviceRank: 'highest_price',
        serviceCategory: 'massage',
        limit: 3,
      },
      expectedListCatalogIds: ['massage-95', 'massage-65', 'massage-55'],
      budgetRankCatalogParams: {
        serviceRank: 'highest_price',
        serviceCategory: 'massage',
        maxPrice: 90,
        limit: 1,
      },
      expectedBudgetRankCatalogIds: ['massage-65'],
    },
    {
      id: 'discover-journey-clarify-en',
      section: 'F',
      turns: [
        {
          prompt: 'haircut under $50 tomorrow or Friday afternoon',
          action: 'check_availability',
          expectedDiscovery: {
            maxPrice: 50,
            serviceCategory: 'haircut',
            availabilityWindows: [
              { date: 'tomorrow' },
              { weekdays: ['friday'], timeOfDay: 'afternoon' },
            ],
          },
          forbiddenDiscoveryKeys: ['date', 'timeOfDay', 'weekdays'],
        },
        {
          prompt: 'basic cut',
          action: 'check_availability',
          usePublicAssistantEnrichment: true,
          expectedDiscovery: {
            maxPrice: 50,
            serviceName: 'Haircut basic',
            availabilityWindows: [
              { date: 'tomorrow' },
              { weekdays: ['friday'], timeOfDay: 'afternoon' },
            ],
          },
        },
      ],
      listCatalogParams: {
        maxPrice: 50,
        serviceCategory: 'haircut',
      },
      expectedListCatalogIds: ['hair-35', 'hair-45'],
      expectedClarifyServiceId: 'hair-35',
      clarifyTurnIndex: 1,
    },
  ];

/** Public vs customer surface parity rows (TODO section G). */
export type ServiceDiscoveryParityScenario = {
  id: string;
  section: 'G';
  surface: 'public' | 'customer';
  /** Groups public/customer rows that must produce identical handler output. */
  pairId: string;
  prompt: string;
  action: string;
  classifierParams?: Record<string, unknown>;
  expectedDiscovery: Record<string, unknown>;
  forbiddenDiscoveryKeys?: string[];
  /** Budget parity — filtered catalog ids. */
  expectedCatalogIds?: string[];
  catalogParams?: Record<string, unknown>;
  /** OR availability parity — resolved scan window count. */
  expectOrWindowCount?: number;
  /** Voice/ASR customer row — assert identical enrich vs public check_availability. */
  voiceParity?: boolean;
};

export const SERVICE_DISCOVERY_PARITY_SCENARIOS: ServiceDiscoveryParityScenario[] =
  [
    {
      id: 'discover-parity-budget-public',
      section: 'G',
      surface: 'public',
      pairId: 'discover-parity-budget',
      prompt: 'Facials under €50?',
      action: 'list_services',
      expectedDiscovery: {
        maxPrice: 50,
        serviceCategory: 'facial',
      },
      catalogParams: {
        maxPrice: 50,
        serviceCategory: 'facial',
      },
      expectedCatalogIds: [],
    },
    {
      id: 'discover-parity-budget-customer',
      section: 'G',
      surface: 'customer',
      pairId: 'discover-parity-budget',
      prompt: 'Facials under €50?',
      action: 'list_services',
      expectedDiscovery: {
        maxPrice: 50,
        serviceCategory: 'facial',
      },
      catalogParams: {
        maxPrice: 50,
        serviceCategory: 'facial',
      },
      expectedCatalogIds: [],
    },
    {
      id: 'discover-parity-or-public',
      section: 'G',
      surface: 'public',
      pairId: 'discover-parity-or',
      prompt: 'Massage tomorrow AM or Sat PM',
      action: 'check_availability',
      expectedDiscovery: {
        serviceCategory: 'massage',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'morning' },
          { weekdays: ['saturday'], timeOfDay: 'afternoon' },
        ],
      },
      forbiddenDiscoveryKeys: ['date', 'timeOfDay', 'weekdays'],
      expectOrWindowCount: 2,
    },
    {
      id: 'discover-parity-or-customer',
      section: 'G',
      surface: 'customer',
      pairId: 'discover-parity-or',
      prompt: 'Massage tomorrow AM or Sat PM',
      action: 'check_providers_for_service',
      expectedDiscovery: {
        serviceCategory: 'massage',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'morning' },
          { weekdays: ['saturday'], timeOfDay: 'afternoon' },
        ],
      },
      forbiddenDiscoveryKeys: ['date', 'timeOfDay', 'weekdays'],
      expectOrWindowCount: 2,
    },
    {
      id: 'discover-parity-voice-customer',
      section: 'G',
      surface: 'customer',
      pairId: 'discover-parity-voice',
      prompt: 'Haircut fifty bucks tomorrow or Friday',
      action: 'check_providers_for_service',
      expectedDiscovery: {
        maxPrice: 50,
        serviceCategory: 'haircut',
        availabilityWindows: [{ date: 'tomorrow' }, { weekdays: ['friday'] }],
      },
      forbiddenDiscoveryKeys: ['date', 'timeOfDay', 'weekdays'],
      expectOrWindowCount: 2,
      voiceParity: true,
    },
  ];

export const SERVICE_DISCOVERY_PARITY_IDS =
  SERVICE_DISCOVERY_PARITY_SCENARIOS.map((scenario) => scenario.id);

export function serviceDiscoveryParityByPairId(
  pairId: string,
): ServiceDiscoveryParityScenario[] {
  return SERVICE_DISCOVERY_PARITY_SCENARIOS.filter(
    (scenario) => scenario.pairId === pairId,
  );
}

export const SERVICE_DISCOVERY_PUBLIC_INTEGRATION_IDS =
  SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.map((scenario) => scenario.id);

export function serviceDiscoveryPublicIntegrationBySection(
  section: ServiceDiscoveryPublicIntegrationScenario['section'],
): ServiceDiscoveryPublicIntegrationScenario[] {
  return SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.filter(
    (scenario) => scenario.section === section,
  );
}

export function serviceDiscoveryJourneyById(
  id: string,
): ServiceDiscoveryJourneyScenario | undefined {
  return SERVICE_DISCOVERY_JOURNEY_SCENARIOS.find(
    (scenario) => scenario.id === id,
  );
}
