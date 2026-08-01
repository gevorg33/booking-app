/**
 * Post-classify booking param hints — structural time windows + semantic scope (acc-3.14).
 */
import {
  hasExplicitTimeWindow,
  matchServicesByQuery,
  parseEarliestBookingTimeFromPrompt,
  parseTimeWindow,
} from './ai-orchestration.helpers.js';
import {
  isMultilingualCheckProvidersPrompt,
  parseMultilingualTimeOfDayWindow,
} from './ai-check-and-book-multilingual.util.js';
import { parseTimeOfDayWindow } from './ai-operations.util.js';
import {
  extractServiceNameFromPrompt,
  stripTrailingTimeWindowFromServiceName,
} from './ai-payments.util.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import { enrichRankSessionPickFromPrompt } from './ai-rank-session-pick.util.js';
import { isFirstAvailableBookingPrompt } from './booking-first-available.semantic.util.js';
import { isTeamWideProviderAvailabilityQuery } from './team-wide-availability.semantic.util.js';
import { isAnyProviderBookingPrompt } from './any-provider-booking.semantic.util.js';
import { isRecommendSpecialistsPrompt } from './recommend-specialists.semantic.util.js';
import { extractServiceFromPrompt } from './ai-structural-extractors.js';
import { normalizeAvailabilityServiceCategory } from './ai-flexible-availability.util.js';
import { stripLeadingServiceRankAdjectives } from './ai-service-rank-discovery.util.js';
import { findServiceLookupSynonymTokenInPrompt } from './ai-service-lookup-synonyms.util.js';

export { isAnyProviderBookingPrompt, isRecommendSpecialistsPrompt };

const PUBLIC_ASSISTANT_SERVICE_ACTIONS = new Set([
  'check_availability',
  'recommend_specialists',
  'book_appointment',
  'list_services',
]);

/** e2e-bug.260 — scrub LLM-polluted serviceName time windows when extract misses. */
function scrubPollutedServiceNameParams(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const current =
    typeof params.serviceName === 'string' ? params.serviceName : null;
  const scrubbed = stripTrailingTimeWindowFromServiceName(current);
  if (!scrubbed || !current || scrubbed === current.trim()) {
    return params;
  }
  return { ...params, serviceName: scrubbed };
}

/** Current prompt service overrides stale session / classifier inheritance (public assistant). */
export function applyPromptMentionedServiceOverrideToParams(
  prompt: string,
  params: Record<string, unknown>,
  services: Array<{ id: string; name: string }> = [],
): Record<string, unknown> {
  const base = scrubPollutedServiceNameParams(params);

  // e2e-bug.297 — synonym-family browse ("show me facials") must keep a category
  // filter when many catalog rows match. Fuzzy extractServiceFromPrompt otherwise
  // pins the first hit (Face Pilling) and wipes the family list.
  const synonymToken = findServiceLookupSynonymTokenInPrompt(prompt);
  if (synonymToken && services.length > 0) {
    const familyMatches = matchServicesByQuery(services, synonymToken);
    if (familyMatches.length > 1) {
      const next: Record<string, unknown> = {
        ...base,
        serviceNames: null,
        serviceName: null,
        serviceCategory: normalizeAvailabilityServiceCategory(synonymToken),
      };
      delete next.serviceId;
      delete next.serviceRank;
      delete next.rankedServiceIds;
      return next;
    }
  }

  const catalogMatch = services.length
    ? extractServiceFromPrompt(prompt, services)
    : undefined;
  const rawName = catalogMatch?.name ?? extractServiceNameFromPrompt(prompt);
  if (!rawName) return base;

  const strippedName =
    stripLeadingServiceRankAdjectives(
      stripTrailingTimeWindowFromServiceName(rawName) ?? rawName,
    ) || rawName;
  const categoryFromPrompt = normalizeAvailabilityServiceCategory(
    strippedName.split(/\s+/)[0] ?? strippedName,
  );
  const existingServiceId =
    typeof base.serviceId === 'string' && base.serviceId.trim()
      ? base.serviceId.trim()
      : undefined;

  const next: Record<string, unknown> = {
    ...base,
    serviceNames: null,
  };
  if (catalogMatch) {
    next.serviceName = catalogMatch.name;
    next.serviceId = catalogMatch.id;
    next.serviceCategory = null;
  } else if (strippedName.split(/\s+/).filter(Boolean).length === 1) {
    next.serviceName = null;
    next.serviceCategory = categoryFromPrompt;
    // e2e-bug.229 — never wipe a checkout/session serviceId without a catalog
    // replacement; named pay_online prompts must keep the selected slot service.
    if (!existingServiceId) {
      delete next.serviceId;
    }
  } else {
    next.serviceName = strippedName;
    next.serviceCategory = null;
    // e2e-bug.229 — keep existing serviceId when the prompt only re-states the
    // service name (no catalog match to swap to a different id).
    if (!existingServiceId) {
      delete next.serviceId;
    }
  }
  delete next.serviceRank;
  delete next.rankedServiceIds;
  return next;
}

/** Current prompt service overrides stale session / classifier inheritance (public assistant). */
export function enrichPublicAssistantParamsFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
  services: Array<{ id: string; name: string }>,
  action?: string,
): Record<string, unknown> {
  if (!action || !PUBLIC_ASSISTANT_SERVICE_ACTIONS.has(action)) {
    return params;
  }

  let next = params;
  const rankPick = enrichRankSessionPickFromPrompt(prompt, params, services);
  if (rankPick) {
    return rankPick;
  }

  next = applyPromptMentionedServiceOverrideToParams(prompt, next, services);

  let enriched = enrichDiscoveryParamsFromPrompt(next, prompt);
  // e2e-bug.260 — discovery rank extract can re-pollute with "rated"/"specialists";
  // re-assert the prompt-mentioned service after discovery enrichment.
  if (
    action === 'recommend_specialists' ||
    action === 'check_availability' ||
    action === 'book_appointment' ||
    action === 'list_services'
  ) {
    enriched = applyPromptMentionedServiceOverrideToParams(
      prompt,
      enriched,
      services,
    );
  }
  if (action === 'book_appointment' && isFirstAvailableBookingPrompt(prompt)) {
    enriched = { ...enriched, bookingFirstAvailable: true };
    delete enriched.timeSlot;
  }
  return enriched;
}

/** Infer first-available / evening-window hints for booking intents (compound + rescue paths). */
export function enrichBookingTimeHintsFromPrompt(
  action: string,
  params: Record<string, any>,
  prompt: string,
): void {
  const isBookingHintAction =
    action === 'create_booking' ||
    action === 'reschedule_booking' ||
    action === 'check_providers_for_service' ||
    action === 'check_availability' ||
    action === 'book_nearest_slot';
  if (!isBookingHintAction) return;

  const wantsFirstAvailable =
    action === 'book_nearest_slot' ||
    ((action === 'create_booking' || action === 'reschedule_booking') &&
      isFirstAvailableBookingPrompt(prompt));
  if (wantsFirstAvailable) {
    params.bookingFirstAvailable = true;
    delete params.timeSlot;
  }

  const timeOfDay =
    parseTimeOfDayWindow(prompt, params) ??
    parseMultilingualTimeOfDayWindow(prompt, params);
  if (timeOfDay && !params.timeOfDay) params.timeOfDay = timeOfDay;

  const earliestTime = parseEarliestBookingTimeFromPrompt(prompt);
  if (earliestTime && !hasExplicitTimeWindow(params, prompt)) {
    params.timeFrom = earliestTime;
  }

  if (hasExplicitTimeWindow(params, prompt)) {
    const window = parseTimeWindow(params, prompt);
    params.timeFrom = window.timeFrom;
    params.timeTo = window.timeTo;
    delete params.timeSlot;
    delete params.timeOfDay;
  }

  if (
    action === 'check_providers_for_service' ||
    action === 'check_availability' ||
    action === 'book_nearest_slot' ||
    action === 'create_booking'
  ) {
    if (
      isAnyProviderBookingPrompt(prompt) ||
      /\bany\s+slots?\b/i.test(prompt) ||
      isTeamWideProviderAvailabilityQuery(prompt) ||
      isMultilingualCheckProvidersPrompt(prompt)
    ) {
      params.allProviders = true;
    }
  }
}

/** User wants every appointment on the day — structural bulk shape (not paraphrase meaning). */
export function isBulkAllAppointmentsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(all|any|every)\b.*\b(appointment|booking)s?\b/i.test(lower) ||
    /\b(cancel|mark|update|set)\b.*\b(all|any|every)\b/i.test(lower) ||
    /\bentire\s+(day|schedule)\b/i.test(lower) ||
    /\bwhole\s+day\b/i.test(lower)
  );
}
