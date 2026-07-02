import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type FindEveningWeekendSlotsMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'find_evening_weekend_slots';
  expectedParams?: Record<string, unknown>;
  rescueReason: 'evening_weekend_discover_chip';
};

export const FIND_EVENING_WEEKEND_SLOTS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian evening/weekend discover chip (customer + public booking):
  - find_evening_weekend_slots: hy «երեկոյան կամ հանգստյան օր», «երեկոյան կամ շաբաթ-կիրակի»; ru «вечер или выходные», «слоты на выходные или вечером». READ OR evening/weekend availability — NOT generic check_availability, NOT book_appointment.`;

const EVENING_WEEKEND_OR_WINDOWS = [
  { timeOfDay: 'evening' as const },
  { weekdays: ['saturday', 'sunday'] as const },
];

export const FIND_EVENING_WEEKEND_SLOTS_MULTILINGUAL_SCENARIOS: readonly FindEveningWeekendSlotsMultilingualScenario[] =
  [
    {
      id: 'evening-weekend-hy-customer',
      locale: 'hy',
      prompt: 'Երեկոյան կամ հանգստյան օր slots for facial',
      surface: 'customer',
      expectedAction: 'find_evening_weekend_slots',
      expectedParams: {
        availabilityWindows: EVENING_WEEKEND_OR_WINDOWS,
      },
      rescueReason: 'evening_weekend_discover_chip',
    },
    {
      id: 'evening-weekend-hy-public',
      locale: 'hy',
      prompt: 'Երեկոյան կամ հանգստյան օր slots for facial',
      surface: 'public',
      expectedAction: 'find_evening_weekend_slots',
      expectedParams: {
        availabilityWindows: EVENING_WEEKEND_OR_WINDOWS,
      },
      rescueReason: 'evening_weekend_discover_chip',
    },
    {
      id: 'evening-weekend-ru-customer',
      locale: 'ru',
      prompt: 'Вечер или выходные для массажа',
      surface: 'customer',
      expectedAction: 'find_evening_weekend_slots',
      expectedParams: {
        serviceCategory: 'massage',
      },
      rescueReason: 'evening_weekend_discover_chip',
    },
    {
      id: 'evening-weekend-ru-public',
      locale: 'ru',
      prompt: 'Вечер или выходные для массажа',
      surface: 'public',
      expectedAction: 'find_evening_weekend_slots',
      expectedParams: {
        serviceCategory: 'massage',
      },
      rescueReason: 'evening_weekend_discover_chip',
    },
    {
      id: 'weekend-evening-ru-customer',
      locale: 'ru',
      prompt: 'Слоты на выходные или вечером',
      surface: 'customer',
      expectedAction: 'find_evening_weekend_slots',
      expectedParams: {
        availabilityWindows: EVENING_WEEKEND_OR_WINDOWS,
      },
      rescueReason: 'evening_weekend_discover_chip',
    },
    {
      id: 'weekend-evening-ru-public',
      locale: 'ru',
      prompt: 'Слоты на выходные или вечером',
      surface: 'public',
      expectedAction: 'find_evening_weekend_slots',
      expectedParams: {
        availabilityWindows: EVENING_WEEKEND_OR_WINDOWS,
      },
      rescueReason: 'evening_weekend_discover_chip',
    },
  ];
