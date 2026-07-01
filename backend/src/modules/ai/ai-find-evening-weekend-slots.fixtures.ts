import { CONSUMER_DISCOVERY_CHIP_FIXTURES } from './ai-consumer-discovery-chips.fixtures.js';

export type FindEveningWeekendSlotsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'find_evening_weekend_slots';
  expectedParams?: Record<string, unknown>;
  rescueReason: 'evening_weekend_discover_chip';
};

export const CUSTOMER_PUBLIC_FIND_EVENING_WEEKEND_SLOTS_CLASSIFIER_RULES = `- find_evening_weekend_slots: READ — customer app or public booking web: one-tap evening/weekend discover chip and focused OR availability scan. Triggers: assistant discover chip "Evening or weekend slots for {service}" (assistantDiscoverChipEveningWeekend), "Evening or weekend only", "After 6pm Saturday", "Weekend or evening openings for massage". Set availabilityWindows with evening timeOfDay OR saturday/sunday weekdays (OR scan). Optional serviceCategory/serviceName when they name a service type. Handler runs the same OR-window availability scan as check_availability. NOT check_availability alone when prompt is generic who-is-free without evening/weekend focus, NOT find_services_under_budget, NOT book_appointment|book_nearest_slot (mutate book), NOT recommend_specialists (rated specialists).`;

/** Golden chip prompt from avail-voice-chip-en / consumer copy catalog. */
export const EVENING_WEEKEND_CHIP_PROMPT =
  'Evening or weekend slots for a facial';

const AVAILABILITY_CHIP_PROMPT = CONSUMER_DISCOVERY_CHIP_FIXTURES.find(
  (chip) => chip.domain === 'availability',
)!.prompt;

const EVENING_WEEKEND_OR_WINDOWS = [
  { timeOfDay: 'evening' },
  { weekdays: ['saturday', 'sunday'] },
];

const WEEKEND_EVENING_OR_WINDOWS = [
  { weekdays: ['saturday', 'sunday'] },
  { timeOfDay: 'evening' },
];

const FIND_EVENING_WEEKEND_EN_PROMPTS = [
  {
    id: 'discover-chip-evening-weekend',
    prompt: EVENING_WEEKEND_CHIP_PROMPT,
    expectedParams: {
      serviceCategory: 'facial',
      availabilityWindows: EVENING_WEEKEND_OR_WINDOWS,
    },
  },
  {
    id: 'evening-weekend-only',
    prompt: 'Evening or weekend only',
    expectedParams: {
      availabilityWindows: EVENING_WEEKEND_OR_WINDOWS,
    },
  },
  {
    id: 'after-6pm-saturday',
    prompt: 'After 6pm Saturday',
    expectedParams: {
      weekdays: ['saturday'],
    },
  },
  {
    id: 'weekend-or-evening-massage',
    prompt: 'Weekend or evening openings for massage',
    expectedParams: {
      serviceCategory: 'massage',
      availabilityWindows: WEEKEND_EVENING_OR_WINDOWS,
    },
  },
  {
    id: 'evening-weekend-facial',
    prompt: 'Evening or weekend slots for a facial',
    expectedParams: {
      serviceCategory: 'facial',
      availabilityWindows: EVENING_WEEKEND_OR_WINDOWS,
    },
  },
  {
    id: 'sat-evening-or-sunday',
    prompt: 'Saturday evening or Sunday afternoon for haircut',
    expectedParams: {
      serviceCategory: 'haircut',
    },
  },
  {
    id: 'weekend-evening-openings',
    prompt: 'Any weekend or evening openings?',
    expectedParams: {
      availabilityWindows: WEEKEND_EVENING_OR_WINDOWS,
    },
  },
  {
    id: 'evening-or-weekend-avail',
    prompt: 'Do you have evening or weekend availability?',
    expectedParams: {
      availabilityWindows: EVENING_WEEKEND_OR_WINDOWS,
    },
  },
  {
    id: 'weekend-slots-only',
    prompt: 'Weekend slots only please',
    expectedParams: {
      availabilityWindows: [{ weekdays: ['saturday', 'sunday'] }],
    },
  },
  {
    id: 'chip-template-massage',
    prompt: 'Evening or weekend slots for a massage',
    expectedParams: {
      serviceCategory: 'massage',
      availabilityWindows: EVENING_WEEKEND_OR_WINDOWS,
    },
  },
] as const;

function buildFindEveningWeekendSlotsPrompts(): FindEveningWeekendSlotsPromptFixture[] {
  const rows: FindEveningWeekendSlotsPromptFixture[] = [];
  for (const entry of FIND_EVENING_WEEKEND_EN_PROMPTS) {
    for (const surface of ['customer', 'public'] as const) {
      rows.push({
        id: `${entry.id}-${surface}`,
        prompt: entry.prompt,
        surface,
        expectedAction: 'find_evening_weekend_slots',
        expectedParams: entry.expectedParams,
        rescueReason: 'evening_weekend_discover_chip',
      });
    }
  }
  return rows;
}

export const FIND_EVENING_WEEKEND_SLOTS_PROMPTS: readonly FindEveningWeekendSlotsPromptFixture[] =
  buildFindEveningWeekendSlotsPrompts();

export const FIND_EVENING_WEEKEND_SLOTS_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-evening-weekend-chip',
    prompt: EVENING_WEEKEND_CHIP_PROMPT,
    misclassifiedAction: 'unknown',
    expectedAction: 'find_evening_weekend_slots' as const,
  },
  {
    id: 'check-avail-to-evening-weekend-chip',
    prompt: EVENING_WEEKEND_CHIP_PROMPT,
    misclassifiedAction: 'check_availability',
    expectedAction: 'find_evening_weekend_slots' as const,
  },
  {
    id: 'booking-help-to-evening-weekend',
    prompt: 'Evening or weekend only',
    misclassifiedAction: 'booking_help',
    expectedAction: 'find_evening_weekend_slots' as const,
  },
  {
    id: 'recommend-to-evening-weekend',
    prompt: 'Weekend or evening openings for massage',
    misclassifiedAction: 'recommend_specialists',
    expectedAction: 'find_evening_weekend_slots' as const,
  },
] as const;

/** Runtime chip uses tenant service interpolation; fixture id for wiring tests. */
export const EVENING_WEEKEND_DISCOVER_CHIP_FIXTURE_ID =
  'discover-chip-evening-weekend-en';
export const EVENING_WEEKEND_DISCOVER_CHIP_TEMPLATE = AVAILABILITY_CHIP_PROMPT;
