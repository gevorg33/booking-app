import { TOUR_BOOKING_CLASSIFIER_RULES } from './ai-tour-booking.fixtures.js';
import { TOUR_CAPACITY_CLASSIFIER_RULES } from './ai-tour-capacity.fixtures.js';
import { TOUR_DAY_SLOTS_CLASSIFIER_RULES } from './ai-tour-day-slots.fixtures.js';
import { EXPLAIN_TOUR_BOOKING_PROMPTS } from './ai-tour-booking.fixtures.js';
import { EXPLAIN_TOUR_DAY_SLOTS_PROMPTS } from './ai-tour-day-slots.fixtures.js';
import { DIAGNOSE_TOUR_CAPACITY_PROMPTS } from './ai-tour-capacity.fixtures.js';
import {
  isDiagnoseTourCapacityPrompt,
  parseDiagnoseTourCapacityFromPrompt,
  rescueDiagnoseTourCapacityIntent,
} from './ai-tour-capacity.util.js';
import {
  isExplainTourBookingPrompt,
  parseExplainTourBookingFromPrompt,
  rescueTourBookingIntent,
} from './ai-tour-booking.util.js';
import {
  isExplainTourDaySlotsPrompt,
  parseExplainTourDaySlotsFromPrompt,
  rescueTourDaySlotsIntent,
} from './ai-tour-day-slots.util.js';

export const CUSTOMER_PUBLIC_TOUR_CLASSIFIER_RULES = `${TOUR_BOOKING_CLASSIFIER_RULES}
${TOUR_DAY_SLOTS_CLASSIFIER_RULES}
${TOUR_CAPACITY_CLASSIFIER_RULES}`;

export type TourCustomerPublicAction =
  | 'explain_tour_booking'
  | 'explain_tour_day_slots'
  | 'diagnose_tour_capacity';

export type TourCustomerPublicPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: TourCustomerPublicAction;
  rescueReason: TourCustomerPublicAction;
  serviceName?: string;
  date?: string;
  requestedPax?: number;
  aspect?: string;
};

function mapBookingFixture(
  entry: (typeof EXPLAIN_TOUR_BOOKING_PROMPTS)[number],
): TourCustomerPublicPromptFixture {
  return {
    id: entry.id,
    prompt: entry.prompt,
    surface: entry.surface,
    expectedAction: 'explain_tour_booking',
    rescueReason: 'explain_tour_booking',
    ...('serviceName' in entry && entry.serviceName
      ? { serviceName: entry.serviceName }
      : {}),
    ...('aspect' in entry && entry.aspect ? { aspect: entry.aspect } : {}),
  };
}

function mapDaySlotsFixture(
  entry: (typeof EXPLAIN_TOUR_DAY_SLOTS_PROMPTS)[number],
): TourCustomerPublicPromptFixture {
  return {
    id: entry.id,
    prompt: entry.prompt,
    surface: entry.surface,
    expectedAction: 'explain_tour_day_slots',
    rescueReason: 'explain_tour_day_slots',
    ...('serviceName' in entry && entry.serviceName
      ? { serviceName: entry.serviceName }
      : {}),
    ...('date' in entry && entry.date ? { date: entry.date } : {}),
    ...('aspect' in entry && entry.aspect ? { aspect: entry.aspect } : {}),
  };
}

function mapCapacityFixture(
  entry: (typeof DIAGNOSE_TOUR_CAPACITY_PROMPTS)[number],
): TourCustomerPublicPromptFixture {
  return {
    id: entry.id,
    prompt: entry.prompt,
    surface: entry.surface,
    expectedAction: 'diagnose_tour_capacity',
    rescueReason: 'diagnose_tour_capacity',
    ...('serviceName' in entry && entry.serviceName
      ? { serviceName: entry.serviceName }
      : {}),
    ...('date' in entry && entry.date ? { date: entry.date } : {}),
    ...('requestedPax' in entry && entry.requestedPax != null
      ? { requestedPax: entry.requestedPax }
      : {}),
    ...('aspect' in entry && entry.aspect ? { aspect: entry.aspect } : {}),
  };
}

export const TOUR_CUSTOMER_PUBLIC_PROMPTS: readonly TourCustomerPublicPromptFixture[] =
  [
    ...EXPLAIN_TOUR_BOOKING_PROMPTS.map(mapBookingFixture),
    ...EXPLAIN_TOUR_DAY_SLOTS_PROMPTS.map(mapDaySlotsFixture),
    ...DIAGNOSE_TOUR_CAPACITY_PROMPTS.map(mapCapacityFixture),
  ];

export function rescueTourCustomerPublicIntent(
  prompt: string,
  action: string,
): { action: TourCustomerPublicAction; rescueReason: string } | null {
  const diagnose = rescueDiagnoseTourCapacityIntent(prompt, action);
  if (diagnose) {
    return {
      action: 'diagnose_tour_capacity',
      rescueReason: diagnose.rescueReason,
    };
  }

  const daySlots = rescueTourDaySlotsIntent(prompt, action);
  if (daySlots) {
    return {
      action: 'explain_tour_day_slots',
      rescueReason: daySlots.rescueReason,
    };
  }

  const booking = rescueTourBookingIntent(prompt, action);
  if (booking) {
    return {
      action: 'explain_tour_booking',
      rescueReason: booking.rescueReason,
    };
  }

  return null;
}

export function detectTourCustomerPublicAction(
  prompt: string,
): TourCustomerPublicAction | null {
  return rescueTourCustomerPublicIntent(prompt, 'unknown')?.action ?? null;
}

export function enrichTourCustomerPublicParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  action: TourCustomerPublicAction,
): Record<string, unknown> {
  const next = { ...params };

  if (action === 'diagnose_tour_capacity') {
    const parsed = parseDiagnoseTourCapacityFromPrompt(prompt, next);
    if (parsed?.serviceName && !next.serviceName) {
      next.serviceName = parsed.serviceName;
    }
    if (parsed?.serviceId && !next.serviceId) {
      next.serviceId = parsed.serviceId;
    }
    if (parsed?.dateKey && !next.date) next.date = parsed.dateKey;
    if (parsed?.requestedPax != null && next.requestedPax == null) {
      next.requestedPax = parsed.requestedPax;
    }
    if (parsed?.aspect && !next.aspect) next.aspect = parsed.aspect;
    return next;
  }

  if (action === 'explain_tour_day_slots') {
    const parsed = parseExplainTourDaySlotsFromPrompt(prompt, next);
    if (parsed?.serviceName && !next.serviceName) {
      next.serviceName = parsed.serviceName;
    }
    if (parsed?.serviceId && !next.serviceId) {
      next.serviceId = parsed.serviceId;
    }
    if (parsed?.dateKey && !next.date) next.date = parsed.dateKey;
    if (parsed?.aspect && !next.aspect) next.aspect = parsed.aspect;
    return next;
  }

  const parsed = parseExplainTourBookingFromPrompt(prompt, next);
  if (parsed?.serviceName && !next.serviceName) {
    next.serviceName = parsed.serviceName;
  }
  if (parsed?.serviceId && !next.serviceId) {
    next.serviceId = parsed.serviceId;
  }
  if (parsed?.aspect && !next.aspect) next.aspect = parsed.aspect;
  return next;
}

export {
  isDiagnoseTourCapacityPrompt,
  isExplainTourBookingPrompt,
  isExplainTourDaySlotsPrompt,
};
