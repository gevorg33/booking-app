import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichListServicesParamsFromPrompt } from './ai-orchestration.helpers.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import {
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
} from './ai-payments.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  enrichBudgetFromPrompt,
  extractMaxPriceFromBudgetPrompt,
  shouldExtractBudgetMaxPrice,
} from './ai-budget-service-discovery.util.js';
import { isServiceCatalogRankPrompt } from './ai-service-rank-discovery.util.js';
import { hasAvailabilityOrPattern } from './ai-flexible-availability.util.js';

export type BudgetCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

export function isBudgetServiceDiscoveryCompoundPrompt(prompt: string): boolean {
  if (isServiceCatalogRankPrompt(prompt)) return false;
  if (hasAvailabilityOrPattern(prompt)) return false;
  if (!shouldExtractBudgetMaxPrice(prompt)) return false;
  if (extractMaxPriceFromBudgetPrompt(prompt) == null) return false;
  if (
    isCheckProvidersForServicePrompt(prompt) &&
    isBookNearestSlotPrompt(prompt)
  ) {
    return true;
  }
  return isBookNearestSlotPrompt(prompt);
}

export function buildBudgetCompoundSharedParams(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): Record<string, unknown> {
  const bookAction =
    surface === 'public' ? 'book_appointment' : 'book_nearest_slot';
  const shared = {
    ...buildSharedBookingContextFromPrompt(prompt),
    ...enrichBudgetFromPrompt({}, prompt),
    bookingFirstAvailable: true,
  };
  enrichBookingTimeHintsFromPrompt(bookAction, shared, prompt);
  const enriched = enrichListServicesParamsFromPrompt(prompt, shared);
  if (!enriched.serviceCategory && !enriched.serviceName) {
    const bookMatch = prompt.match(
      /\bbook(?:\s+a|\s+an|\s+the)?\s+([a-z][\w\s-]{2,30}?)(?=\s*(?:under|below|for|with|tomorrow|today|nearest|soonest|,|$))/i,
    );
    const keyword = bookMatch?.[1]?.trim().replace(/[,.]$/, '');
    if (keyword && keyword.length >= 3) {
      enriched.serviceCategory = keyword.split(/\s+/)[0] ?? keyword;
    }
  }
  return enriched;
}

export function decomposePublicBudgetServiceDiscoveryCompoundPrompt(
  prompt: string,
): BudgetCompoundStep[] {
  return decomposeBudgetServiceDiscoveryCompoundPrompt(prompt, 'public');
}

export function decomposeCustomerBudgetServiceDiscoveryCompoundPrompt(
  prompt: string,
): BudgetCompoundStep[] {
  return decomposeBudgetServiceDiscoveryCompoundPrompt(prompt, 'customer');
}

export function decomposeBudgetServiceDiscoveryCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): BudgetCompoundStep[] {
  if (!isBudgetServiceDiscoveryCompoundPrompt(prompt)) return [];

  const shared = buildBudgetCompoundSharedParams(prompt, surface);
  const bookAction =
    surface === 'public' ? 'book_appointment' : 'book_nearest_slot';

  if (
    isCheckProvidersForServicePrompt(prompt) &&
    isBookNearestSlotPrompt(prompt)
  ) {
    const checkAction =
      surface === 'public' ? 'check_availability' : 'check_providers_for_service';
    return propagateSharedBookingContextAcrossSteps([
      { action: checkAction, params: shared, segment: prompt },
      {
        action: bookAction,
        params: { ...shared, bookingFirstAvailable: true },
        segment: prompt,
      },
    ]);
  }

  if (surface === 'public') {
    return propagateSharedBookingContextAcrossSteps([
      { action: 'list_services', params: shared, segment: prompt },
      {
        action: 'book_appointment',
        params: { ...shared, bookingFirstAvailable: true },
        segment: prompt,
      },
    ]);
  }

  return propagateSharedBookingContextAcrossSteps([
    { action: 'list_services', params: shared, segment: prompt },
    {
      action: 'book_nearest_slot',
      params: { ...shared, bookingFirstAvailable: true },
      segment: prompt,
    },
  ]);
}
