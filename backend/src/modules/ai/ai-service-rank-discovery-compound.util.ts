import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichListServicesParamsFromPrompt } from './ai-orchestration.helpers.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { isBookNearestSlotPrompt } from './ai-payments.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import { enrichBudgetFromPrompt } from './ai-budget-service-discovery.util.js';
import {
  enrichServiceRankFromPrompt,
  isServiceCatalogRankPrompt,
} from './ai-service-rank-discovery.util.js';

export type RankCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

const RANK_BOOK_SERVICE_CATEGORY_PATTERN =
  /\bbook(?:\s+(?:a|an|the|your))?\s+(?:(?:most|your)\s+)?(?:premium|luxury|deluxe|top[\s-]?tier|cheapest|most\s+affordable|best(?:[\s-]?selling)?)\s+([a-z][\w-]{2,30})(?=\s*(?:under|below|for|with|tomorrow|today|nearest|soonest|,|$))/i;

const RANK_CUE_SERVICE_CATEGORY_PATTERN =
  /\b(?:best\s+)?(?:premium|luxury|deluxe|top[\s-]?tier|cheapest|most\s+affordable|best(?:[\s-]?selling)?)\s+([a-z][\w-]{2,30})(?=\s*(?:I can|under|below|for|with|tomorrow|today|nearest|soonest|,|$))/i;

function extractRankCompoundServiceCategory(
  prompt: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  if (params.serviceCategory || params.serviceName) return params;

  const bookMatch = prompt.match(RANK_BOOK_SERVICE_CATEGORY_PATTERN);
  const rankMatch = prompt.match(RANK_CUE_SERVICE_CATEGORY_PATTERN);
  const keyword = (bookMatch?.[1] ?? rankMatch?.[1])?.trim().replace(/[,.]$/, '');
  if (keyword && keyword.length >= 3) {
    return { ...params, serviceCategory: keyword };
  }
  return params;
}

export function isServiceRankDiscoveryCompoundPrompt(prompt: string): boolean {
  if (!isBookNearestSlotPrompt(prompt)) return false;
  return isServiceCatalogRankPrompt(prompt);
}

export function buildRankCompoundSharedParams(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): Record<string, unknown> {
  const bookAction =
    surface === 'public' ? 'book_appointment' : 'book_nearest_slot';
  const shared = {
    ...buildSharedBookingContextFromPrompt(prompt),
    ...enrichBudgetFromPrompt({}, prompt),
    ...enrichServiceRankFromPrompt({}, prompt),
    bookingFirstAvailable: true,
  };
  enrichBookingTimeHintsFromPrompt(bookAction, shared, prompt);
  const enriched = extractRankCompoundServiceCategory(
    prompt,
    enrichListServicesParamsFromPrompt(prompt, shared),
  );
  return enriched;
}

export function decomposePublicServiceRankDiscoveryCompoundPrompt(
  prompt: string,
): RankCompoundStep[] {
  return decomposeServiceRankDiscoveryCompoundPrompt(prompt, 'public');
}

export function decomposeCustomerServiceRankDiscoveryCompoundPrompt(
  prompt: string,
): RankCompoundStep[] {
  return decomposeServiceRankDiscoveryCompoundPrompt(prompt, 'customer');
}

export function decomposeServiceRankDiscoveryCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): RankCompoundStep[] {
  if (!isServiceRankDiscoveryCompoundPrompt(prompt)) return [];

  const shared = buildRankCompoundSharedParams(prompt, surface);
  const bookAction =
    surface === 'public' ? 'book_appointment' : 'book_nearest_slot';

  return propagateSharedBookingContextAcrossSteps([
    { action: 'list_services', params: shared, segment: prompt },
    {
      action: bookAction,
      params: { ...shared, bookingFirstAvailable: true },
      segment: prompt,
    },
  ]);
}
