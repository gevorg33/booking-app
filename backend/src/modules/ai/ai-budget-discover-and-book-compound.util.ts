import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { enrichListServicesParamsFromPrompt } from './ai-orchestration.helpers.js';
import {
  enrichBudgetFromPrompt,
  extractMaxPriceFromBudgetPrompt,
  shouldExtractBudgetMaxPrice,
} from './ai-budget-service-discovery.util.js';
import { hasAvailabilityOrPattern } from './ai-flexible-availability.util.js';
import {
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
} from './ai-payments.util.js';
import { isServiceCatalogRankPrompt } from './ai-service-rank-discovery.util.js';

export const BUDGET_DISCOVER_AND_BOOK_STEP_ACTIONS = [
  'list_services',
  'check_providers_for_service',
  'create_booking',
] as const;

export type BudgetDiscoverAndBookStepAction =
  (typeof BUDGET_DISCOVER_AND_BOOK_STEP_ACTIONS)[number];

export const BUDGET_DISCOVER_AND_BOOK_RECIPE_ID = 'budget_discover_and_book';

const COMPOUND_MARKERS =
  /\band\s+then\b|\bthen\b|;\s*|\s+and\s+(?=(?:list|show|filter|check|book|create|who)\b)/i;

export const BUDGET_DISCOVER_AND_BOOK_CLASSIFIER_RULES = `- budget_discover_and_book (compound): dashboard multi-step budget discovery + booking — decomposes to list_services (maxPrice filter) → check_providers_for_service → create_booking with bookingFirstAvailable=true. Use for "filter catalog under $50, check who's free tomorrow, book nearest", "show options under $60, check providers, create booking for soonest slot", "budget discover and book haircut under $45". NOT list_services alone when user also asks to check availability and book; NOT dashboard_payments check+book without budget filter; NOT public/customer budget compounds (book_appointment/book_nearest_slot).`;

const FULL_DISCOVER_CUE =
  /\b(?:budget\s+discover\s+and\s+book|discover\s+and\s+book|filter[\s-]check[\s-]book|filter\s+catalog|end[\s-]to[\s-]end\s+budget\s+book|full\s+filter[\s-]check[\s-]book)\b/i;

const SERVICE_CATEGORY_BLOCKLIST = new Set([
  'filter',
  'catalog',
  'show',
  'list',
  'options',
  'services',
  'affordable',
  'client',
  'reception',
  'full',
  'end',
  'budget',
  'discover',
  'book',
  'check',
  'create',
  'nearest',
  'booking',
]);

const BUDGET_SERVICE_CATEGORY_SINGULAR: Record<string, string> = {
  facials: 'facial',
};

function normalizeBudgetServiceCategory(raw: string): string {
  const key = raw.toLowerCase();
  return BUDGET_SERVICE_CATEGORY_SINGULAR[key] ?? raw;
}

function hasCheckStepCue(prompt: string): boolean {
  return (
    isCheckProvidersForServicePrompt(prompt) ||
    (/\bcheck\b/i.test(prompt) &&
      /\b(?:providers?|availability|who|free|available)\b/i.test(prompt))
  );
}

function hasBookStepCue(prompt: string): boolean {
  if (isBookNearestSlotPrompt(prompt)) return true;
  return (
    /\b(?:book|create)\b/i.test(prompt) &&
    /\b(?:soonest|nearest|first\s+available|asap|earliest|opening|slot|appointment|booking)\b/i.test(
      prompt,
    )
  );
}

function extractBudgetDiscoverServiceCategory(
  prompt: string,
): string | undefined {
  const fromList = enrichListServicesParamsFromPrompt(prompt, {});
  if (fromList.serviceCategory) return fromList.serviceCategory;

  const patterns = [
    /\bshow\s+([a-z][\w]+)\s+(?:options|services)\b/i,
    /\bfor\s+([a-z][\w]+)\s+under\b/i,
    /\b([a-z][\w]+)\s+under\s+\$[\d.]+/i,
    /\$[\d.]+\s+for\s+([a-z][\w]+)\b/i,
    /\bunder\s+\$[\d.]+\s+for\s+([a-z][\w]+)\b/i,
    /\bservices?\s+under\s+\$[\d.]+\s+for\s+([a-z][\w]+)\b/i,
    /\boptions?\s+for\s+([a-z][\w]+)\b/i,
    /\bfor\s+([a-z][\w]+)\s+tomorrow\b/i,
    /\boptions?\s+under\s+\$[\d.]+\s+for\s+([a-z][\w]+)\b/i,
    /:\s*options?\s+for\s+([a-z][\w]+)\b/i,
    /\bfor\s+([a-z][\w]+)\s+under\s+\$/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const raw = match?.[1]?.trim();
    if (!raw) continue;
    const normalized = raw.toLowerCase();
    if (SERVICE_CATEGORY_BLOCKLIST.has(normalized)) continue;
    return normalizeBudgetServiceCategory(raw);
  }

  return undefined;
}

export function isBudgetDiscoverAndBookCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (text.length < 28) return false;
  if (isServiceCatalogRankPrompt(text)) return false;
  if (hasAvailabilityOrPattern(text)) return false;
  if (!shouldExtractBudgetMaxPrice(text)) return false;
  if (extractMaxPriceFromBudgetPrompt(text) == null) return false;
  if (!hasCheckStepCue(text)) return false;
  if (!hasBookStepCue(text)) return false;
  return true;
}

export type BudgetDiscoverAndBookCompoundStep = {
  action: BudgetDiscoverAndBookStepAction;
  params: Record<string, unknown>;
  segment: string;
};

export function buildBudgetDiscoverAndBookCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const params = {
    ...buildSharedBookingContextFromPrompt(prompt),
    ...enrichBudgetFromPrompt({}, prompt),
  };
  enrichListServicesParamsFromPrompt(prompt, params);
  enrichBookingTimeHintsFromPrompt('create_booking', params, prompt);

  if (hasCheckStepCue(prompt)) {
    params.allProviders = true;
  }

  const serviceCategory = extractBudgetDiscoverServiceCategory(prompt);
  if (serviceCategory) {
    params.serviceCategory = serviceCategory;
    params.serviceName = null;
  }

  return params;
}

export function decomposeBudgetDiscoverAndBookCompoundPrompt(
  prompt: string,
): BudgetDiscoverAndBookCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isBudgetDiscoverAndBookCompoundPrompt(trimmed)) return [];

  const base = buildBudgetDiscoverAndBookCompoundParams(trimmed);
  const steps: BudgetDiscoverAndBookCompoundStep[] = [
    {
      action: 'list_services',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'check_providers_for_service',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'create_booking',
      params: { ...base, bookingFirstAvailable: true },
      segment: trimmed,
    },
  ];

  return propagateSharedBookingContextAcrossSteps(steps);
}

export function rescueBudgetDiscoverAndBookCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isBudgetDiscoverAndBookCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'budget_discover_and_book_compound',
  };
}
