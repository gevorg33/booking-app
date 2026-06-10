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
  enrichListServicesParamsFromPrompt,
} from './ai-orchestration.helpers.js';
import {
  extractMaxPriceFromBudgetPrompt,
  shouldExtractBudgetMaxPrice,
} from './ai-budget-service-discovery.util.js';
import { hasAvailabilityOrPattern } from './ai-flexible-availability.util.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import {
  extractServiceNameFromPrompt,
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
} from './ai-payments.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';

const FLEXIBLE_AVAILABILITY_BOOK_SERVICE_PATTERN =
  /\bbook(?:\s+(?:a|an|the|your))?\s+([a-z][\w\s-]{2,30}?)(?=\s*(?:under|below|for|with|tomorrow|today|nearest|soonest|whichever|,|$))/i;

const FLEXIBLE_AVAILABILITY_WANT_SERVICE_PATTERN =
  /\bI want(?:\s+(?:a|an|the))?\s+([a-z][\w\s-]{2,30}?)(?=\s*(?:tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|,|$))/i;

const FLEXIBLE_AVAILABILITY_LEADING_SERVICE_PATTERN =
  /^([a-z][\w\s-]{2,30}?)\s+(?:tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/i;

function normalizeAvailabilityServiceCategory(keyword: string): string {
  const first = keyword.trim().replace(/[,.]$/, '').split(/\s+/)[0] ?? keyword;
  const lower = first.toLowerCase();
  if (lower === 'lashes') return 'lash';
  return lower;
}

function extractFlexibleAvailabilityServiceCategory(
  prompt: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  if (params.serviceCategory) return params;

  const fromList = enrichListServicesParamsFromPrompt(prompt, params);
  if (fromList.serviceCategory) {
    return { ...params, serviceCategory: fromList.serviceCategory, serviceName: null };
  }

  const rawName =
    (typeof params.serviceName === 'string' ? params.serviceName : null) ??
    extractServiceNameFromPrompt(prompt);
  if (rawName) {
    return {
      ...params,
      serviceCategory: normalizeAvailabilityServiceCategory(rawName),
      serviceName: null,
    };
  }

  const bookMatch = prompt.match(FLEXIBLE_AVAILABILITY_BOOK_SERVICE_PATTERN);
  const wantMatch = prompt.match(FLEXIBLE_AVAILABILITY_WANT_SERVICE_PATTERN);
  const leadingMatch = prompt.match(FLEXIBLE_AVAILABILITY_LEADING_SERVICE_PATTERN);
  const keyword = (bookMatch?.[1] ?? wantMatch?.[1] ?? leadingMatch?.[1])
    ?.trim()
    .replace(/[,.]$/, '');
  if (keyword && keyword.length >= 3) {
    return {
      ...params,
      serviceCategory: normalizeAvailabilityServiceCategory(keyword),
      serviceName: null,
    };
  }

  return params;
}

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
  if (!isFlexibleAvailabilityBudgetCompoundPrompt(prompt)) return false;
  if (isBookNearestSlotPrompt(prompt)) return true;
  if (/\b(?:whichever|which ever)\s+is\s+sooner\b/i.test(prompt)) {
    return true;
  }
  return (
    isCheckProvidersForServicePrompt(prompt) &&
    isBookNearestSlotPrompt(prompt)
  );
}

export function buildFlexibleAvailabilityCompoundSharedParams(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): Record<string, unknown> {
  const bookAction =
    surface === 'public' ? 'book_appointment' : 'book_nearest_slot';
  const shared: Record<string, unknown> = extractFlexibleAvailabilityServiceCategory(
    prompt,
    enrichDiscoveryParamsFromPrompt(
      buildSharedBookingContextFromPrompt(prompt),
      prompt,
    ),
  );
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
    const params = enrichPublicAssistantParamsFromPrompt(
      prompt,
      {},
      [],
      action,
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

export function decomposeFlexibleAvailabilityBudgetCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): FlexibleAvailabilityCompoundStep[] {
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
