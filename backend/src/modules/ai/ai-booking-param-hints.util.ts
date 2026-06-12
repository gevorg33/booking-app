/**
 * Post-classify booking param hints — structural time windows + semantic scope (acc-3.14).
 */
import {
  hasExplicitTimeWindow,
  parseEarliestBookingTimeFromPrompt,
  parseTimeWindow,
} from './ai-orchestration.helpers.js';
import {
  isMultilingualCheckProvidersPrompt,
  parseMultilingualTimeOfDayWindow,
} from './ai-check-and-book-multilingual.util.js';
import { parseTimeOfDayWindow } from './ai-operations.util.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import { enrichRankSessionPickFromPrompt } from './ai-rank-session-pick.util.js';
import { isFirstAvailableBookingPrompt } from './booking-first-available.semantic.util.js';
import { isTeamWideProviderAvailabilityQuery } from './team-wide-availability.semantic.util.js';
import { isAnyProviderBookingPrompt } from './any-provider-booking.semantic.util.js';
import { isRecommendSpecialistsPrompt } from './recommend-specialists.semantic.util.js';
import { extractServiceFromPrompt } from './ai-structural-extractors.js';

export { isAnyProviderBookingPrompt, isRecommendSpecialistsPrompt };

const PUBLIC_ASSISTANT_SERVICE_ACTIONS = new Set([
  'check_availability',
  'recommend_specialists',
  'book_appointment',
  'list_services',
]);

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

  const promptService = extractServiceFromPrompt(prompt, services);
  if (promptService) {
    next = {
      ...next,
      serviceName: promptService.name,
      serviceCategory: null,
      serviceNames: null,
    };
  } else {
    const rawName = extractServiceNameFromPrompt(prompt);
    if (rawName) {
      next = {
        ...next,
        serviceName: rawName,
        serviceCategory: null,
        serviceNames: null,
      };
    }
  }

  let enriched = enrichDiscoveryParamsFromPrompt(next, prompt);
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
