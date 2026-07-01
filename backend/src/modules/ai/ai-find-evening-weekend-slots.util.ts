import { isBudgetServiceDiscoveryCompoundPrompt } from './ai-budget-service-discovery-compound.util.js';
import { isFindServicesUnderBudgetPrompt } from './ai-find-services-under-budget.util.js';
import {
  enrichAvailabilityWindowsFromPrompt,
  enrichFlexibleAvailabilityServiceCategoryFromPrompt,
  parseAvailabilityWindowsFromPrompt,
} from './ai-flexible-availability.util.js';
import { isFlexibleAvailabilityBudgetBookCompoundPrompt } from './ai-flexible-availability-compound.util.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import {
  FIND_EVENING_WEEKEND_SLOTS_MULTILINGUAL_SCENARIOS,
  type FindEveningWeekendSlotsMultilingualScenario,
} from './ai-find-evening-weekend-slots-multilingual.fixtures.js';
import {
  EVENING_WEEKEND_CHIP_PROMPT,
  FIND_EVENING_WEEKEND_SLOTS_PROMPTS,
  type FindEveningWeekendSlotsPromptFixture,
} from './ai-find-evening-weekend-slots.fixtures.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';

export const FIND_EVENING_WEEKEND_SLOTS_INTENTS = [
  'find_evening_weekend_slots',
] as const;

export type FindEveningWeekendSlotsIntent =
  (typeof FIND_EVENING_WEEKEND_SLOTS_INTENTS)[number];

export { CUSTOMER_PUBLIC_FIND_EVENING_WEEKEND_SLOTS_CLASSIFIER_RULES } from './ai-find-evening-weekend-slots.fixtures.js';

const EVENING_WEEKEND_CHIP_TEMPLATE = /^evening or weekend slots for /i;

const EVENING_WEEKEND_FOCUS_CUE = new RegExp(
  String.raw`\b(?:evening|weekend|weekends?|saturday|sunday|sat|sun)\b|(?:երեկոյան|հանգստ|շաբաթ|կիրակի|выходн|вечер|суббот|воскрес)`,
  'iu',
);

const BOOK_COMPOUND_CUE = new RegExp(
  String.raw`\b(?:book|reserve|schedule|nearest|soonest|asap)\b.*\b(?:slot|appointment|booking)\b|\b(?:book|reserve)\b.*\b(?:evening|weekend|saturday|sunday)\b`,
  'iu',
);

function matchFindEveningWeekendSlotsFixture(
  prompt: string,
): FindEveningWeekendSlotsPromptFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of FIND_EVENING_WEEKEND_SLOTS_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  if (normalized === EVENING_WEEKEND_CHIP_PROMPT.trim().toLowerCase()) {
    return (
      FIND_EVENING_WEEKEND_SLOTS_PROMPTS.find(
        (row) => row.id === 'discover-chip-evening-weekend-customer',
      ) ?? null
    );
  }
  return null;
}

function matchFindEveningWeekendSlotsMultilingualScenario(
  prompt: string,
): FindEveningWeekendSlotsMultilingualScenario | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of FIND_EVENING_WEEKEND_SLOTS_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function hasEveningWeekendOrWindows(prompt: string): boolean {
  const windows = parseAvailabilityWindowsFromPrompt(prompt);
  if (!windows || windows.length < 2) return false;
  const hasEvening = windows.some((window) => window.timeOfDay === 'evening');
  const hasWeekend = windows.some(
    (window) =>
      window.weekdays?.includes('saturday') ||
      window.weekdays?.includes('sunday'),
  );
  return hasEvening && hasWeekend;
}

function isEveningWeekendOnlyPrompt(prompt: string): boolean {
  return (
    /\bevening\s+or\s+weekend\b/i.test(prompt) ||
    /\bweekend\s+or\s+evening\b/i.test(prompt) ||
    /(?:երեկոյան\s+կամ\s+հանգստ|вечер\s+или\s+выходн|выходн.*или\s+вечер)/iu.test(
      prompt,
    )
  );
}

const DEFAULT_EVENING_WEEKEND_OR_WINDOWS = [
  { timeOfDay: 'evening' as const },
  { weekdays: ['saturday', 'sunday'] as const },
];

function isAfterEveningOnWeekendPrompt(prompt: string): boolean {
  return (
    /\bafter\s+(?:work|\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?|\d{1,2}\s*pm)\b/i.test(
      prompt,
    ) && /\b(?:sat(?:urday)?|sun(?:day)?|weekend)\b/i.test(prompt)
  );
}

function isWeekendOnlyPrompt(prompt: string): boolean {
  return /\bweekend(?:\s+slots?)?\s+only\b/i.test(prompt);
}

export function isFindEveningWeekendSlotsPrompt(prompt: string): boolean {
  if (matchFindEveningWeekendSlotsFixture(prompt)) return true;
  if (matchFindEveningWeekendSlotsMultilingualScenario(prompt)) return true;

  if (isFindServicesUnderBudgetPrompt(prompt)) return false;
  if (isBudgetServiceDiscoveryCompoundPrompt(prompt)) return false;
  if (isFlexibleAvailabilityBudgetBookCompoundPrompt(prompt)) return false;
  if (isCompoundPrompt(prompt) && BOOK_COMPOUND_CUE.test(prompt)) return false;
  if (BOOK_COMPOUND_CUE.test(prompt)) return false;

  if (!EVENING_WEEKEND_FOCUS_CUE.test(prompt)) return false;

  if (EVENING_WEEKEND_CHIP_TEMPLATE.test(prompt)) return true;
  if (isEveningWeekendOnlyPrompt(prompt)) return true;
  if (isWeekendOnlyPrompt(prompt)) return true;
  if (hasEveningWeekendOrWindows(prompt)) return true;
  if (isAfterEveningOnWeekendPrompt(prompt)) return true;

  return false;
}

export function isFindEveningWeekendSlotsIntent(
  action: string,
): action is FindEveningWeekendSlotsIntent {
  return (FIND_EVENING_WEEKEND_SLOTS_INTENTS as readonly string[]).includes(
    action,
  );
}

export function enrichFindEveningWeekendSlotsParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const enriched = enrichDiscoveryParamsFromPrompt(params, prompt);
  const withCategory = enrichFlexibleAvailabilityServiceCategoryFromPrompt(
    prompt,
    enriched,
  );
  const withWindows = enrichAvailabilityWindowsFromPrompt(withCategory, prompt);
  if (
    !withWindows.availabilityWindows &&
    (isEveningWeekendOnlyPrompt(prompt) ||
      EVENING_WEEKEND_CHIP_TEMPLATE.test(prompt))
  ) {
    return {
      ...withWindows,
      availabilityWindows: DEFAULT_EVENING_WEEKEND_OR_WINDOWS,
    };
  }
  return withWindows;
}

export function parseFindEveningWeekendSlotsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): Record<string, unknown> | null {
  if (!isFindEveningWeekendSlotsPrompt(prompt)) return null;
  return enrichFindEveningWeekendSlotsParamsFromPrompt(params, prompt);
}

export function rescueFindEveningWeekendSlotsIntent(
  prompt: string,
  action: string,
): { action: FindEveningWeekendSlotsIntent; rescueReason: string } | null {
  if (isFindEveningWeekendSlotsIntent(action)) return null;
  if (!parseFindEveningWeekendSlotsFromPrompt(prompt)) return null;
  return {
    action: 'find_evening_weekend_slots',
    rescueReason: 'evening_weekend_discover_chip',
  };
}
