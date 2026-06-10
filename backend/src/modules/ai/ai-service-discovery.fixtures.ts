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
  section: 'A' | 'B' | 'C' | 'D' | 'H';
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
};

/** Cross-sprint canonical public assistant rows (TODO ai-cmd-discover sections A–D + H). */
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
      },
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
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['thursday'], timeOfDay: 'evening' },
        ],
      },
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
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['saturday'] },
        ],
      },
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
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['sunday'] },
        ],
      },
      catalogParams: {
        maxPrice: 100,
        serviceCategory: 'facial',
      },
      expectedCatalogIds: ['facial-55', 'facial-95'],
      expectOrWindowCount: 2,
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
      },
      expectedDiscovery: {},
      forbiddenDiscoveryKeys: ['maxPrice'],
      rescuedFromAction: 'list_services',
      rescuedAction: 'booking_help',
      rescueReason: 'apply_gift_card_code',
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
  ];

export const SERVICE_DISCOVERY_PUBLIC_INTEGRATION_IDS =
  SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.map((scenario) => scenario.id);

export function serviceDiscoveryPublicIntegrationBySection(
  section: ServiceDiscoveryPublicIntegrationScenario['section'],
): ServiceDiscoveryPublicIntegrationScenario[] {
  return SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.filter(
    (scenario) => scenario.section === section,
  );
}
