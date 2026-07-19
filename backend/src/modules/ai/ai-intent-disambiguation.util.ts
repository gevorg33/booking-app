import { isMultilingualBookNearestPrompt } from './ai-check-and-book-multilingual.util.js';
import { buildSharedBookingContextFromPrompt } from './ai-compound-booking-context.util.js';
import { isFindSoonestAppointmentPrompt } from './ai-find-soonest-appointment.util.js';
import { isExplainProviderAvailabilityPrompt } from './ai-explain-provider-availability.util.js';
import { isExplainAnyProviderOptionPrompt } from './ai-explain-any-provider-option.util.js';
import {
  isCheckProvidersForServicePrompt,
  isBookNearestSlotPrompt,
} from './ai-payments.util.js';
import { isFirstAvailableBookingPrompt } from './booking-first-available.semantic.util.js';
import { isTeamWideProviderAvailabilityQuery } from './team-wide-availability.semantic.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';

export type AvailabilityDisambiguationSurface = Extract<
  CommandSurface,
  'dashboard' | 'customer' | 'public'
>;

export interface AvailabilityDisambiguationResult {
  action: string;
  rescueReason: string;
  params?: Record<string, unknown>;
}

const BOOK_VERB = /\b(book|schedule|reserve|create appointment)\b/i;

function hasBookVerb(prompt: string): boolean {
  return (
    BOOK_VERB.test(prompt) ||
    isBookNearestSlotPrompt(prompt) ||
    isMultilingualBookNearestPrompt(prompt)
  );
}

/** e2e-bug.92 — "can I book a haircut tomorrow at 3pm?" (concrete time, not nearest). */
export function isConcreteTimedBookAppointmentPrompt(prompt: string): boolean {
  if (!BOOK_VERB.test(prompt) && !/\bcan\s+i\s+book\b/i.test(prompt)) {
    return false;
  }
  if (isBookNearestSlotPrompt(prompt) || isFirstAvailableBookingPrompt(prompt)) {
    return false;
  }
  if (isFindSoonestAppointmentPrompt(prompt)) return false;
  return /\b(?:tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\s*(?::\d{2})?\s*(?:am|pm))\b/i.test(
    prompt,
  );
}

function isNamedProviderAvailabilityPrompt(prompt: string): boolean {
  if (isTeamWideProviderAvailabilityQuery(prompt)) return false;
  return (
    /\b(?:check\s+)?availability\b/i.test(prompt) ||
    /\b(?:is|are)\s+[A-Za-z][\w\s.'-]{1,40}\s+(?:available|free|open)\b/i.test(
      prompt,
    ) ||
    /\b(?:available|free|open)\s+(?:at|on)\b/i.test(prompt) ||
    /\b(?:slots?|schedule)\s+(?:for|does)\s+[A-Za-z]/i.test(prompt)
  );
}

/** Staff-ops assignment lookup — not customer "who is free" wording. */
export function isLookupServiceAssignmentPrompt(prompt: string): boolean {
  if (isCheckProvidersForServicePrompt(prompt)) return false;
  if (hasBookVerb(prompt)) return false;
  return (
    (isTeamWideProviderAvailabilityQuery(prompt) &&
      /\b(doing|performing|giving|working|assigned|scheduled)\b/i.test(
        prompt,
      )) ||
    /\bwho\s+can\s+perform\b/i.test(prompt) ||
    /\bwhich\s+providers?\s+(?:are\s+)?assigned\b/i.test(prompt)
  );
}

function publicAvailabilityAction(
  prompt: string,
): AvailabilityDisambiguationResult | null {
  if (isExplainProviderAvailabilityPrompt(prompt)) return null;
  // e2e-bug.92 — do not remap any-provider explain into check_availability.
  if (isExplainAnyProviderOptionPrompt(prompt)) return null;
  if (/\breviews?\b/i.test(prompt)) return null;
  if (
    /\b(?:best|top|highest)\s+rated\b/i.test(prompt) ||
    /\brecommend(?:\s+me)?\s+(?:a\s+)?(?:specialist|stylist|provider)/i.test(
      prompt,
    )
  ) {
    return null;
  }
  if (isFindSoonestAppointmentPrompt(prompt)) {
    return {
      action: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
      params: { bookingFirstAvailable: true, allProviders: true },
    };
  }
  if (hasBookVerb(prompt) || /\bcan\s+i\s+book\b/i.test(prompt)) {
    if (
      isBookNearestSlotPrompt(prompt) ||
      isFirstAvailableBookingPrompt(prompt)
    ) {
      return {
        action: 'book_appointment',
        rescueReason: 'public_flexible_book',
        params: { bookingFirstAvailable: true },
      };
    }
    // e2e-bug.92 — concrete service + date/time book (not nearest-slot).
    if (isConcreteTimedBookAppointmentPrompt(prompt)) {
      return {
        action: 'book_appointment',
        rescueReason: 'public_timed_book',
        params: buildSharedBookingContextFromPrompt(prompt),
      };
    }
    return null;
  }
  if (
    isCheckProvidersForServicePrompt(prompt) ||
    isTeamWideProviderAvailabilityQuery(prompt) ||
    isNamedProviderAvailabilityPrompt(prompt)
  ) {
    return {
      action: 'check_availability',
      rescueReason: 'public_availability',
      params: isTeamWideProviderAvailabilityQuery(prompt)
        ? { allProviders: true, employeeName: null }
        : undefined,
    };
  }
  return null;
}

function dashboardOrCustomerAvailabilityAction(
  surface: 'dashboard' | 'customer',
  prompt: string,
): AvailabilityDisambiguationResult | null {
  if (isExplainProviderAvailabilityPrompt(prompt)) return null;
  if (isFindSoonestAppointmentPrompt(prompt) && !hasBookVerb(prompt)) {
    return {
      action: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
      params: { bookingFirstAvailable: true, allProviders: true },
    };
  }
  if (isCheckProvidersForServicePrompt(prompt) && !hasBookVerb(prompt)) {
    return {
      action: 'check_providers_for_service',
      rescueReason: 'providers_for_service',
      params: { allProviders: true, employeeName: null },
    };
  }
  if (surface === 'dashboard' && isLookupServiceAssignmentPrompt(prompt)) {
    return {
      action: 'lookup_service_assignment',
      rescueReason: 'availability_query',
      params: { assignmentLookup: 'providers_for_service' },
    };
  }
  if (isNamedProviderAvailabilityPrompt(prompt)) {
    return {
      action: 'check_availability',
      rescueReason: 'check_availability_pattern',
    };
  }
  return null;
}

/** Deterministic availability intent from prompt (ai-cmd-h1.4). */
export function resolveAvailabilityIntentFromPrompt(
  surface: AvailabilityDisambiguationSurface,
  prompt: string,
): AvailabilityDisambiguationResult | null {
  if (surface === 'public') {
    return publicAvailabilityAction(prompt);
  }
  return dashboardOrCustomerAvailabilityAction(surface, prompt);
}

/** Post-LLM disambiguation when classifier picked the wrong availability/booking action. */
export function disambiguateMisclassifiedAvailabilityIntent(
  surface: AvailabilityDisambiguationSurface,
  prompt: string,
  action: string,
  params: Record<string, unknown>,
): AvailabilityDisambiguationResult | null {
  // e2e-bug.92 — allow escaping check_providers_for_service when book/timed cues win.
  if (
    hasBookVerb(prompt) &&
    !isCheckProvidersForServicePrompt(prompt) &&
    action !== 'check_providers_for_service'
  ) {
    return null;
  }

  const resolved = resolveAvailabilityIntentFromPrompt(surface, prompt);
  if (!resolved || resolved.action === action) return null;

  const confusedActions = new Set([
    'create_booking',
    'lookup_service_assignment',
    'check_availability',
    'check_providers_for_service',
    'book_appointment',
    'unknown',
  ]);
  if (!confusedActions.has(action)) return null;

  let rescueReason = resolved.rescueReason;
  if (
    action === 'create_booking' &&
    resolved.action === 'check_providers_for_service'
  ) {
    rescueReason = 'create_booking_to_check_providers';
  } else if (
    action === 'create_booking' &&
    resolved.action === 'check_availability'
  ) {
    rescueReason = 'create_booking_to_check_availability';
  } else if (
    action === 'lookup_service_assignment' &&
    resolved.action === 'check_providers_for_service'
  ) {
    rescueReason = 'lookup_to_check_providers';
  }

  return {
    action: resolved.action,
    rescueReason,
    params: { ...params, ...resolved.params },
  };
}
