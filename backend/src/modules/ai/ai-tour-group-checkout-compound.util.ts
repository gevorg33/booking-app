import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { isBookTourNearestDepartureCompoundPrompt } from './ai-book-tour-nearest-departure.util.js';
import { extractTourServiceNameFromBookingPrompt } from './ai-book-tour-nearest-departure.util.js';
import { isDiagnoseTourCapacityPrompt } from './ai-tour-capacity.util.js';
import { extractTourPaxCountFromPrompt } from './ai-tour-capacity.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  TOUR_GROUP_CHECKOUT_COMPOUND_PROMPTS,
  type TourGroupCheckoutCompoundFixture,
} from './ai-tour-group-checkout-compound.fixtures.js';
import { TOUR_GROUP_CHECKOUT_MULTILINGUAL_SCENARIOS } from './ai-tour-group-checkout-compound-multilingual.fixtures.js';
import { hasTourGroupCheckoutCapacityGateCue } from './ai-tour-group-checkout-cue.util.js';

export { hasTourGroupCheckoutCapacityGateCue } from './ai-tour-group-checkout-cue.util.js';

export const TOUR_GROUP_CHECKOUT_RECIPE_ID = 'tour_group_checkout';
export const PUBLIC_TOUR_GROUP_CHECKOUT_RECIPE_ID =
  'public_tour_group_checkout';

export type TourGroupCheckoutCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

const TOUR_BOOKING_TOPIC = new RegExp(
  String.raw`\b(?:tours?|treks?|excursions?|hikes?|drives?|wine\s+country|mountain\s+trek|sunset\s+hike|city\s+tour|coastal\s+drive)\b|(?:տուր|էքսկուրս)|(?:тур|экскурс)`,
  'iu',
);

const TOUR_BOOK_MUTATE_CUE = new RegExp(
  String.raw`\b(?:book|reserve|schedule|get|buy|purchase|order)\b|ամրագր|պատվիր|(?:заброн|бронир|запиш)`,
  'iu',
);

/** Named catalog tours often omit the word "tour" (e.g. "Sunset Coastal Drive"). */
const TOUR_GROUP_PAX_CUE = /\b(?:guests?|people|pax|travelers?)\b/i;

function matchTourGroupCheckoutScenario(
  prompt: string,
): TourGroupCheckoutCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of TOUR_GROUP_CHECKOUT_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of TOUR_GROUP_CHECKOUT_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function hasTourGroupCheckoutTopic(prompt: string): boolean {
  if (TOUR_BOOKING_TOPIC.test(prompt) && TOUR_BOOK_MUTATE_CUE.test(prompt)) {
    return true;
  }
  // e2e-bug.133 — capacity-gated group reserve with pax, even without "tour"/"hike".
  return (
    TOUR_BOOK_MUTATE_CUE.test(prompt) &&
    TOUR_GROUP_PAX_CUE.test(prompt) &&
    hasTourGroupCheckoutCapacityGateCue(prompt)
  );
}

export function isTourGroupCheckoutCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (text.length < 16) return false;
  if (matchTourGroupCheckoutScenario(text)) return true;
  if (isDiagnoseTourCapacityPrompt(text)) return false;
  if (!hasTourGroupCheckoutTopic(text)) return false;
  if (!hasTourGroupCheckoutCapacityGateCue(text)) return false;
  if (extractTourPaxCountFromPrompt(text) == null) return false;
  if (isBookTourNearestDepartureCompoundPrompt(text)) return false;
  return true;
}

export function buildTourGroupCheckoutCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const scenario = matchTourGroupCheckoutScenario(prompt);
  const params: Record<string, unknown> = {
    ...buildSharedBookingContextFromPrompt(prompt),
    tourGroupCheckout: true,
    bookIfCapacityOk: true,
  };

  const serviceName =
    scenario?.serviceName ?? extractTourServiceNameFromBookingPrompt(prompt);
  if (serviceName) params.serviceName = serviceName;

  const paxCount = scenario?.paxCount ?? extractTourPaxCountFromPrompt(prompt);
  if (paxCount != null) {
    params.paxCount = paxCount;
    params.requestedPax = paxCount;
  }

  return params;
}

function bookActionForSurface(
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): 'book_appointment' | 'book_nearest_slot' {
  return surface === 'public' ? 'book_appointment' : 'book_nearest_slot';
}

export function decomposeTourGroupCheckoutCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'> = 'customer',
): TourGroupCheckoutCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isTourGroupCheckoutCompoundPrompt(trimmed)) {
    return [];
  }

  const base = buildTourGroupCheckoutCompoundParams(trimmed);
  const bookAction = bookActionForSurface(surface);
  const bookParams = {
    ...base,
    continueAfterCapacityCheck: true,
  };
  enrichBookingTimeHintsFromPrompt(bookAction, bookParams, trimmed);

  const steps: TourGroupCheckoutCompoundStep[] = [
    {
      action: 'explain_tour_booking',
      params: { ...base, aspect: 'groupSize' },
      segment: trimmed,
    },
    {
      action: 'diagnose_tour_capacity',
      params: { ...base, aspect: 'all' },
      segment: trimmed,
    },
    {
      action: bookAction,
      params: bookParams,
      segment: trimmed,
    },
  ];

  return propagateSharedBookingContextAcrossSteps(steps);
}

export function decomposeCustomerTourGroupCheckoutCompoundPrompt(
  prompt: string,
): TourGroupCheckoutCompoundStep[] {
  return decomposeTourGroupCheckoutCompoundPrompt(prompt, 'customer');
}

export function decomposePublicTourGroupCheckoutCompoundPrompt(
  prompt: string,
): TourGroupCheckoutCompoundStep[] {
  return decomposeTourGroupCheckoutCompoundPrompt(prompt, 'public');
}

export function rescueTourGroupCheckoutCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isTourGroupCheckoutCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'tour_group_checkout_compound',
  };
}
