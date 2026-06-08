import { isMultilingualBookNearestPrompt } from './ai-check-and-book-multilingual.util.js';
import {
  isCheckProvidersForServicePrompt,
  isBookNearestSlotPrompt,
} from './ai-payments.util.js';
import {
  isFirstAvailableBookingPrompt,
  isTeamWideProviderAvailabilityQuery,
} from './ai-intent-heuristics.js';
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
  if (hasBookVerb(prompt)) {
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

/** Booking-page prompts that should run through PublicBookingAssistantService. */
export function shouldDelegatePublicBookingAssistant(prompt: string): boolean {
  return resolveAvailabilityIntentFromPrompt('public', prompt) != null;
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
  const resolved = resolveAvailabilityIntentFromPrompt(surface, prompt);

  if (action === 'unknown') {
    if (resolved) {
      return {
        action: resolved.action,
        rescueReason: resolved.rescueReason,
        params: { ...params, ...resolved.params },
      };
    }
    if (
      surface === 'public' &&
      hasBookVerb(prompt) &&
      !isCheckProvidersForServicePrompt(prompt)
    ) {
      return {
        action: 'book_appointment',
        rescueReason: 'public_book_request_unknown',
      };
    }
    return null;
  }

  if (hasBookVerb(prompt) && !isCheckProvidersForServicePrompt(prompt)) {
    return null;
  }

  if (!resolved || resolved.action === action) return null;

  const confusedActions = new Set([
    'create_booking',
    'lookup_service_assignment',
    'check_availability',
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

export interface AvailabilityIntentRescueTarget {
  action: string;
  params?: Record<string, unknown>;
  confidence?: number;
}

/** Deterministic availability/booking rescue — run before no-clarify guardrails. */
export function applyAvailabilityIntentRescue(
  target: AvailabilityIntentRescueTarget,
  surface: AvailabilityDisambiguationSurface,
  prompt: string,
): { rescueReason: string } | null {
  const fix = disambiguateMisclassifiedAvailabilityIntent(
    surface,
    prompt,
    target.action,
    target.params ?? {},
  );
  if (!fix) return null;

  target.action = fix.action;
  target.params = fix.params;
  if (typeof target.confidence !== 'number' || target.confidence < 0.75) {
    target.confidence = 0.88;
  }
  return { rescueReason: fix.rescueReason };
}
