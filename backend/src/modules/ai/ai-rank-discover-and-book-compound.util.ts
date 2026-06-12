import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { enrichListServicesParamsFromPrompt } from './ai-orchestration.helpers.js';
import { enrichBudgetFromPrompt } from './ai-budget-service-discovery.util.js';
import { hasAvailabilityOrPattern } from './ai-flexible-availability.util.js';
import {
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
} from './ai-payments.util.js';
import {
  enrichServiceRankFromPrompt,
  isServiceCatalogRankPrompt,
} from './ai-service-rank-discovery.util.js';

export const RANK_DISCOVER_AND_BOOK_STEP_ACTIONS = [
  'list_services',
  'check_providers_for_service',
  'create_booking',
] as const;

export type RankDiscoverAndBookStepAction =
  (typeof RANK_DISCOVER_AND_BOOK_STEP_ACTIONS)[number];

export const RANK_DISCOVER_AND_BOOK_RECIPE_ID = 'rank_discover_and_book';

export const RANK_DISCOVER_AND_BOOK_CLASSIFIER_RULES = `- rank_discover_and_book (compound): dashboard multi-step rank discovery + booking — decomposes to list_services (serviceRank filter) → check_providers_for_service → create_booking with bookingFirstAvailable=true. Use for "show premium facial options, check who's free tomorrow, book nearest", "list cheapest massage, check providers, create booking for soonest slot", "rank discover and book luxury haircut". NOT list_services alone when user also asks to check availability and book; NOT budget_discover_and_book when prompt is budget-only (maxPrice without catalog rank cues); NOT public/customer rank compounds (book_appointment/book_nearest_slot).`;

const SERVICE_CATEGORY_BLOCKLIST = new Set([
  'filter',
  'catalog',
  'show',
  'list',
  'options',
  'services',
  'premium',
  'luxury',
  'deluxe',
  'cheapest',
  'popular',
  'client',
  'reception',
  'full',
  'end',
  'rank',
  'discover',
  'book',
  'check',
  'create',
  'nearest',
  'booking',
  'top',
  'tier',
  'most',
  'best',
]);

const RANK_BOOK_SERVICE_CATEGORY_PATTERN =
  /\bbook(?:\s+(?:a|an|the|your))?\s+(?:(?:most|your)\s+)?(?:premium|luxury|deluxe|top[\s-]?tier|cheapest|most\s+affordable|best(?:[\s-]?selling)?)\s+([a-z][\w-]{2,30})(?=\s*(?:under|below|for|with|tomorrow|today|nearest|soonest|,|$))/i;

const RANK_CUE_SERVICE_CATEGORY_PATTERN =
  /\b(?:best\s+)?(?:premium|luxury|deluxe|top[\s-]?tier|cheapest|most\s+affordable|best(?:[\s-]?selling)?)\s+([a-z][\w-]{2,30})(?=\s*(?:I can|under|below|for|with|tomorrow|today|nearest|soonest|,|$))/i;

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

function extractRankDiscoverServiceCategory(
  prompt: string,
): string | undefined {
  const fromList = enrichListServicesParamsFromPrompt(prompt, {});
  if (fromList.serviceCategory) return fromList.serviceCategory;

  const bookMatch = prompt.match(RANK_BOOK_SERVICE_CATEGORY_PATTERN);
  const rankMatch = prompt.match(RANK_CUE_SERVICE_CATEGORY_PATTERN);
  const fromRankCue = (bookMatch?.[1] ?? rankMatch?.[1])?.trim().replace(/[,.]$/, '');
  if (fromRankCue && fromRankCue.length >= 3) {
    const normalized = fromRankCue.toLowerCase();
    if (!SERVICE_CATEGORY_BLOCKLIST.has(normalized)) return fromRankCue;
  }

  const patterns = [
    /\bshow\s+(?:premium|luxury|top[\s-]?tier|cheapest|most\s+popular|best(?:[\s-]?selling)?)\s+([a-z][\w]+)\s+(?:options|services)\b/i,
    /\bfor\s+(?:premium|luxury|cheapest|most\s+popular)\s+([a-z][\w]+)\b/i,
    /\b(?:premium|luxury|top[\s-]?tier|cheapest|most\s+popular|best(?:[\s-]?selling)?)\s+([a-z][\w]+)\s+(?:options|services)\b/i,
    /\b(?:wants|want)\s+(?:deluxe|premium|luxury)\s+([a-z][\w]+)\b/i,
    /\bdeluxe\s+([a-z][\w]+)\b/i,
    /\bcheapest\s+([a-z][\w]+)\b/i,
    /\boptions?\s+for\s+([a-z][\w]+)\b/i,
    /:\s*options?\s+for\s+([a-z][\w]+)\b/i,
    /\bfor\s+([a-z][\w]+)\s+tomorrow\b/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const raw = match?.[1]?.trim();
    if (!raw) continue;
    const normalized = raw.toLowerCase();
    if (SERVICE_CATEGORY_BLOCKLIST.has(normalized)) continue;
    return raw;
  }

  return undefined;
}

export function isRankDiscoverAndBookCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (text.length < 28) return false;
  if (hasAvailabilityOrPattern(text)) return false;
  if (!isServiceCatalogRankPrompt(text)) return false;
  if (!hasCheckStepCue(text)) return false;
  if (!hasBookStepCue(text)) return false;
  return true;
}

export type RankDiscoverAndBookCompoundStep = {
  action: RankDiscoverAndBookStepAction;
  params: Record<string, unknown>;
  segment: string;
};

export function buildRankDiscoverAndBookCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const params = {
    ...buildSharedBookingContextFromPrompt(prompt),
    ...enrichBudgetFromPrompt({}, prompt),
    ...enrichServiceRankFromPrompt({}, prompt),
  };
  enrichListServicesParamsFromPrompt(prompt, params);
  enrichBookingTimeHintsFromPrompt('create_booking', params, prompt);

  if (hasCheckStepCue(prompt)) {
    params.allProviders = true;
  }

  const serviceCategory = extractRankDiscoverServiceCategory(prompt);
  if (serviceCategory) {
    params.serviceCategory = serviceCategory;
    params.serviceName = null;
  }

  return params;
}

export function decomposeRankDiscoverAndBookCompoundPrompt(
  prompt: string,
): RankDiscoverAndBookCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isRankDiscoverAndBookCompoundPrompt(trimmed)) return [];

  const base = buildRankDiscoverAndBookCompoundParams(trimmed);
  const steps: RankDiscoverAndBookCompoundStep[] = [
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

export function rescueRankDiscoverAndBookCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isRankDiscoverAndBookCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'rank_discover_and_book_compound',
  };
}
