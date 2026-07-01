import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { isFirstAvailableBookingPrompt } from './booking-first-available.semantic.util.js';
import { isBookNearestSlotPrompt } from './ai-payments.util.js';
import { isBookPackageWithNearestSlotCompoundPrompt } from './ai-book-package-with-nearest-slot.util.js';
import {
  isDiagnoseTourCapacityPrompt,
  extractTourPaxCountFromPrompt,
} from './ai-tour-capacity.util.js';
import { hasTourGroupCheckoutCapacityGateCue } from './ai-tour-group-checkout-cue.util.js';
import { isExplainTourBookingPrompt } from './ai-tour-booking.util.js';
import { isExplainTourDaySlotsPrompt } from './ai-tour-day-slots.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  BOOK_TOUR_NEAREST_DEPARTURE_PROMPTS,
  BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
  BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
  type BookTourNearestDeparturePromptFixture,
} from './ai-book-tour-nearest-departure.fixtures.js';
import { BOOK_TOUR_NEAREST_DEPARTURE_MULTILINGUAL_SCENARIOS } from './ai-book-tour-nearest-departure-multilingual.fixtures.js';

export const BOOK_TOUR_NEAREST_DEPARTURE_RECIPE_ID =
  'book_tour_nearest_departure';

export const PUBLIC_BOOK_TOUR_NEAREST_DEPARTURE_RECIPE_ID =
  'public_book_tour_nearest_departure';

export type BookTourNearestDepartureStepAction =
  | (typeof BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS)[number]
  | (typeof BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS)[number];

export type BookTourNearestDepartureCompoundStep = {
  action: BookTourNearestDepartureStepAction;
  params: Record<string, unknown>;
  segment: string;
};

const HY_RU_NEAREST_TOUR_CUE =
  /(?:amragrel|amragrum|patvir|գնել|зabron|бронир|запиш).{0,50}(?:տուր|էքսկուրս|тур|экскурс).{0,50}(?:amenamot|amenarajin|amenaarajin|slot|ближайш|раньше|скорее|выезд|մեկնում)/iu;

const NEAREST_DEPARTURE_CUE = new RegExp(
  String.raw`\b(?:earliest|soonest|nearest|first\s+available|asap|next\s+available)\b.{0,30}\b(?:date|departure|slot|opening|visit|tour)?\b|\b(?:earliest|soonest|nearest)\s+(?:date|departure|slot|opening)\b|(?:ամենամոտ|ամենաառաջին|скорее|ближайш|раньше|как\s+можно\s+скорее|выезд)`,
  'iu',
);

const TOUR_BOOKING_TOPIC = new RegExp(
  String.raw`\b(?:tours?|treks?|excursions?|hikes?|wine\s+country|mountain\s+trek|sunset\s+hike|city\s+tour)\b|(?:տուր|էքսկուրս)|(?:тур|экскурс)`,
  'iu',
);

const TOUR_BOOK_MUTATE_CUE = new RegExp(
  String.raw`\b(?:book|reserve|schedule|get|buy|purchase|order)\b|ամրագր|պատվիր|(?:заброн|бронир|запиш)`,
  'iu',
);

function matchBookTourNearestDepartureScenario(
  prompt: string,
): BookTourNearestDeparturePromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of BOOK_TOUR_NEAREST_DEPARTURE_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of BOOK_TOUR_NEAREST_DEPARTURE_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function extendTourCatalogServiceName(name: string, prompt: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const catalogTour = prompt.match(
    new RegExp(`\\b${escaped}(?:\\s+[A-Za-z0-9][\\w'&-]+)*\\s+Tour\\b`, 'i'),
  );
  if (catalogTour?.[0]) return catalogTour[0].trim();
  const extended = prompt.match(
    new RegExp(
      `\\b${escaped}(?:\\s+[A-Za-z0-9][\\w'&-]+)*\\s+(?:trek|hike|drive|excursion)\\b`,
      'i',
    ),
  );
  return extended?.[0]?.trim() ?? name;
}

function normalizeTourServiceNameCandidate(
  candidate: string,
  prompt: string,
): string | null {
  let name = candidate.trim();
  for (let i = 0; i < 4; i += 1) {
    const next = name.replace(/^(?:the|a|an|my)\s+/i, '').trim();
    if (next === name) break;
    name = next;
  }
  name = name.replace(/-ը$/i, '').replace(/-ի$/i, '').trim();
  if (/^(?:tour|trek|excursion|hike|group|my)$/i.test(name)) return null;
  if (name.length < 2) return null;
  return extendTourCatalogServiceName(name, prompt);
}

export function extractTourServiceNameFromBookingPrompt(
  prompt: string,
): string | undefined {
  const scenario = matchBookTourNearestDepartureScenario(prompt);
  if (scenario?.serviceName) return scenario.serviceName;

  const patterns = [
    /\b(?:book|reserve|schedule|get|buy|purchase|order)\s+(?:the\s+|a\s+|my\s+)?["']([^"']+?)["']\s+tour\b/i,
    /\b(?:book|reserve|schedule|get|buy|purchase|order)\s+(?:the\s+|a\s+|my\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+tour\b/i,
    /\b(?:book|reserve|schedule|get|buy|purchase|order)\s+(?:the\s+|a\s+|my\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+(?:trek|hike|excursion)\b/i,
    /\b(?:book|reserve|schedule|get|buy|purchase|order)\s+(?:the\s+|a\s+|my\s+)?(\d[\w-]*(?:\s+[A-Za-z0-9][\w&'-]+)*)\s+(?:trek|tour)\b/i,
    /\b(?:book|reserve|schedule|get|buy|purchase|order)\s+(?:the\s+|a\s+|my\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+(?:tour\s+)?(?:earliest|nearest|soonest|asap|first\s+available)\b/i,
    /(?:amragrel|amragrum|patvir).{0,20}(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+(?:tour|trek|տուր)/iu,
    /(?:зabron|бронир|запиш).{0,20}([A-Za-z0-9][\w\s&'-]+?)\s+(?:tour|trek|тур)/iu,
    /([A-Za-z0-9][\w\s&'-]+?)\s+տուր/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = normalizeTourServiceNameCandidate(
      match?.[1] ?? '',
      prompt,
    );
    if (candidate) return candidate;
  }

  return undefined;
}

export function hasTourNearestDepartureCue(prompt: string): boolean {
  if (isFirstAvailableBookingPrompt(prompt)) return true;
  if (HY_RU_NEAREST_TOUR_CUE.test(prompt)) return true;
  return NEAREST_DEPARTURE_CUE.test(prompt);
}

export function hasTourBookingMutateTopic(prompt: string): boolean {
  return TOUR_BOOKING_TOPIC.test(prompt) && TOUR_BOOK_MUTATE_CUE.test(prompt);
}

export function isBookTourNearestDepartureCompoundPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (text.length < 16) return false;
  if (matchBookTourNearestDepartureScenario(text)) return true;
  if (
    hasTourGroupCheckoutCapacityGateCue(text) &&
    extractTourPaxCountFromPrompt(text) != null
  ) {
    return false;
  }
  if (isBookPackageWithNearestSlotCompoundPrompt(text)) return false;
  if (isDiagnoseTourCapacityPrompt(text)) return false;
  if (isExplainTourBookingPrompt(text)) return false;
  if (isExplainTourDaySlotsPrompt(text)) return false;
  if (!hasTourBookingMutateTopic(text)) return false;
  if (!hasTourNearestDepartureCue(text)) return false;
  if (isBookNearestSlotPrompt(text) && !TOUR_BOOKING_TOPIC.test(text)) {
    return false;
  }
  return true;
}

export function buildBookTourNearestDepartureCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const scenario = matchBookTourNearestDepartureScenario(prompt);
  const params: Record<string, unknown> = {
    ...buildSharedBookingContextFromPrompt(prompt),
    bookingFirstAvailable: true,
    timeSlot: null,
  };

  const serviceName =
    scenario?.serviceName ?? extractTourServiceNameFromBookingPrompt(prompt);
  if (serviceName) params.serviceName = serviceName;

  const paxCount = scenario?.paxCount ?? extractTourPaxCountFromPrompt(prompt);
  if (paxCount != null) params.paxCount = paxCount;

  enrichBookingTimeHintsFromPrompt('book_nearest_slot', params, prompt);
  return params;
}

function bookActionForSurface(
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): 'book_appointment' | 'book_nearest_slot' {
  return surface === 'public' ? 'book_appointment' : 'book_nearest_slot';
}

export function decomposeBookTourNearestDepartureCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'> = 'customer',
): BookTourNearestDepartureCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isBookTourNearestDepartureCompoundPrompt(trimmed)) {
    return [];
  }

  const base = buildBookTourNearestDepartureCompoundParams(trimmed);
  const bookAction = bookActionForSurface(surface);
  const steps: BookTourNearestDepartureCompoundStep[] = [
    {
      action: 'explain_tour_booking',
      params: { ...base, aspect: 'all' },
      segment: trimmed,
    },
    {
      action: 'explain_tour_day_slots',
      params: { ...base, aspect: 'remainingSpots' },
      segment: trimmed,
    },
    {
      action: bookAction,
      params: { ...base, bookingFirstAvailable: true, timeSlot: null },
      segment: trimmed,
    },
  ];

  return propagateSharedBookingContextAcrossSteps(steps);
}

export function decomposeCustomerBookTourNearestDepartureCompoundPrompt(
  prompt: string,
): BookTourNearestDepartureCompoundStep[] {
  return decomposeBookTourNearestDepartureCompoundPrompt(prompt, 'customer');
}

export function decomposePublicBookTourNearestDepartureCompoundPrompt(
  prompt: string,
): BookTourNearestDepartureCompoundStep[] {
  return decomposeBookTourNearestDepartureCompoundPrompt(prompt, 'public');
}

export function rescueBookTourNearestDepartureCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isBookTourNearestDepartureCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'book_tour_nearest_departure_compound',
  };
}
