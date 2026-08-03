import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import {
  enrichBookingTimeHintsFromPrompt,
  enrichPublicAssistantParamsFromPrompt,
  isFirstAvailableBookingPrompt,
} from './ai-intent-heuristics.js';
import {
  extractMaxPriceFromBudgetPrompt,
  shouldExtractBudgetMaxPrice,
} from './ai-budget-service-discovery.util.js';
import {
  enrichFlexibleAvailabilityServiceCategoryFromPrompt,
  hasAvailabilityOrPattern,
  resolveAvailabilityServiceFieldsFromKeyword,
} from './ai-flexible-availability.util.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import {
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
} from './ai-payments.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';

export type FlexibleAvailabilityCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

export function isFlexibleAvailabilityBudgetCompoundPrompt(
  prompt: string,
): boolean {
  if (!shouldExtractBudgetMaxPrice(prompt)) return false;
  if (extractMaxPriceFromBudgetPrompt(prompt) == null) return false;
  if (!hasAvailabilityOrPattern(prompt)) return false;
  if (/\bgift\s+card\b/i.test(prompt)) return false;
  return true;
}

/** OR windows + budget + flexible book / check-then-book (avail-1.8). */
export function isFlexibleAvailabilityBudgetBookCompoundPrompt(
  prompt: string,
): boolean {
  if (isFlexibleAvailabilityListBudgetThenOrCompoundPrompt(prompt))
    return false;
  if (!isFlexibleAvailabilityBudgetCompoundPrompt(prompt)) return false;
  if (isBookNearestSlotPrompt(prompt)) return true;
  if (/\b(?:whichever|which ever)\s+is\s+sooner\b/i.test(prompt)) {
    return true;
  }
  return (
    isCheckProvidersForServicePrompt(prompt) && isBookNearestSlotPrompt(prompt)
  );
}

/** Turn 1 list_services + budget; turn 2 OR availability scan (avail-list-budget-then-or-en). */
export function isFlexibleAvailabilityListBudgetThenOrCompoundPrompt(
  prompt: string,
): boolean {
  if (!shouldExtractBudgetMaxPrice(prompt)) return false;
  if (extractMaxPriceFromBudgetPrompt(prompt) == null) return false;
  if (!hasAvailabilityOrPattern(prompt)) return false;
  if (/\bgift\s+card\b/i.test(prompt)) return false;
  if (!/\bthen\b/i.test(prompt)) return false;
  return (
    /\b(?:show|list)\b/i.test(prompt) &&
    /\b(?:check|who'?s?\s+free|availability|slots?)\b/i.test(prompt)
  );
}

export function buildFlexibleAvailabilityCompoundSharedParams(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): Record<string, unknown> {
  const bookAction =
    surface === 'public' ? 'book_appointment' : 'book_nearest_slot';
  let shared: Record<string, unknown> =
    enrichFlexibleAvailabilityServiceCategoryFromPrompt(
      prompt,
      enrichDiscoveryParamsFromPrompt(
        buildSharedBookingContextFromPrompt(prompt),
        prompt,
      ),
    );
  if (typeof shared.serviceName === 'string' && !shared.serviceCategory) {
    // e2e-bug.200 — keep multi-word catalog names on serviceName; only collapse
    // single-token categories (massage, haircut) into serviceCategory.
    const fields = resolveAvailabilityServiceFieldsFromKeyword(
      shared.serviceName,
    );
    shared = {
      ...shared,
      serviceName: fields.serviceName,
      serviceCategory: fields.serviceCategory,
    };
  }
  enrichBookingTimeHintsFromPrompt(bookAction, shared, prompt);

  if (
    isCheckProvidersForServicePrompt(prompt) ||
    /\b(?:who'?s?|who is)\s+free\b/i.test(prompt)
  ) {
    shared.allProviders = true;
  }

  return shared;
}

function applyFlexibleAvailabilityBookHints(
  action: string,
  params: Record<string, unknown>,
  prompt: string,
): void {
  if (action !== 'book_appointment' && action !== 'book_nearest_slot') return;
  if (
    /\b(?:whichever|which ever)\s+is\s+sooner\b/i.test(prompt) ||
    /\basap\b/i.test(prompt) ||
    isFirstAvailableBookingPrompt(prompt)
  ) {
    params.bookingFirstAvailable = true;
    delete params.timeSlot;
  }
}

/** Mirror public/customer post-classifier enrichment for deterministic eval (avail-1.11). */
export function buildFlexibleAvailabilityEvalParams(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
  action: string,
): Record<string, unknown> {
  if (surface === 'public') {
    let params = enrichPublicAssistantParamsFromPrompt(prompt, {}, [], action);
    if (typeof params.serviceName === 'string' && !params.serviceCategory) {
      const fields = resolveAvailabilityServiceFieldsFromKeyword(
        params.serviceName,
      );
      params = {
        ...params,
        serviceName: fields.serviceName,
        serviceCategory: fields.serviceCategory,
      };
    }
    params = enrichFlexibleAvailabilityServiceCategoryFromPrompt(
      prompt,
      params,
    );
    applyFlexibleAvailabilityBookHints(action, params, prompt);
    return params;
  }

  const params = buildFlexibleAvailabilityCompoundSharedParams(prompt, surface);
  applyFlexibleAvailabilityBookHints(action, params, prompt);
  if (action !== 'book_nearest_slot') {
    delete params.bookingFirstAvailable;
  }
  return params;
}

export function decomposePublicFlexibleAvailabilityBudgetCompoundPrompt(
  prompt: string,
): FlexibleAvailabilityCompoundStep[] {
  return decomposeFlexibleAvailabilityBudgetCompoundPrompt(prompt, 'public');
}

export function decomposeCustomerFlexibleAvailabilityBudgetCompoundPrompt(
  prompt: string,
): FlexibleAvailabilityCompoundStep[] {
  return decomposeFlexibleAvailabilityBudgetCompoundPrompt(prompt, 'customer');
}

function buildFlexibleAvailabilityListStepParams(
  shared: Record<string, unknown>,
): Record<string, unknown> {
  const listParams = { ...shared };
  delete listParams.availabilityWindows;
  delete listParams.date;
  delete listParams.weekdays;
  delete listParams.timeOfDay;
  delete listParams.bookingFirstAvailable;
  delete listParams.allProviders;
  return listParams;
}

export function decomposeFlexibleAvailabilityListBudgetThenOrCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): FlexibleAvailabilityCompoundStep[] {
  if (!isFlexibleAvailabilityListBudgetThenOrCompoundPrompt(prompt)) return [];

  const shared = buildFlexibleAvailabilityCompoundSharedParams(prompt, surface);
  const checkAction =
    surface === 'public' ? 'check_availability' : 'check_providers_for_service';

  return propagateSharedBookingContextAcrossSteps([
    {
      action: 'list_services',
      params: buildFlexibleAvailabilityListStepParams(shared),
      segment: prompt,
    },
    { action: checkAction, params: shared, segment: prompt },
  ]);
}

export function decomposeFlexibleAvailabilityBudgetCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): FlexibleAvailabilityCompoundStep[] {
  const listThenOr =
    decomposeFlexibleAvailabilityListBudgetThenOrCompoundPrompt(
      prompt,
      surface,
    );
  if (listThenOr.length > 0) return listThenOr;

  if (!isFlexibleAvailabilityBudgetBookCompoundPrompt(prompt)) return [];

  const shared = buildFlexibleAvailabilityCompoundSharedParams(prompt, surface);
  const checkAction =
    surface === 'public' ? 'check_availability' : 'check_providers_for_service';
  const bookAction =
    surface === 'public' ? 'book_appointment' : 'book_nearest_slot';

  return propagateSharedBookingContextAcrossSteps([
    { action: checkAction, params: shared, segment: prompt },
    {
      action: bookAction,
      params: { ...shared, bookingFirstAvailable: true },
      segment: prompt,
    },
  ]);
}
