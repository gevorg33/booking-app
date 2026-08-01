/**
 * e2e-bug.284 — dashboard "Move …; then book a second …" must stay a true
 * compound: reschedule_booking → create_booking (not a lone create/reschedule).
 */
import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichParamsWithSharedEntities } from './ai-command-entity-params.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import {
  isRescheduleExistingAppointmentPrompt,
  isSingleRescheduleNearestContinuationPrompt,
} from './ai-find-soonest-appointment.util.js';

export const RESCHEDULE_THEN_CREATE_BOOKING_RECIPE_ID =
  'dashboard_operational_compound';

export const RESCHEDULE_THEN_CREATE_BOOKING_STEP_ACTIONS = [
  'reschedule_booking',
  'create_booking',
] as const;

export const RESCHEDULE_THEN_CREATE_BOOKING_CLASSIFIER_RULES = `- reschedule_then_create_booking (compound): dashboard multi-step — move/reschedule an existing appointment, then create a separate new booking for another client/service. Decomposes to reschedule_booking → create_booking. Triggers: "Move Gevorg's appointment to Friday; then book a second massage for Anna", "Reschedule Sam to Monday then book a facial for Maria", "Shift Anna's visit to tomorrow; also book a haircut for Bob". NOT reschedule_booking alone (put-it / nearest continuation — e2e-bug.267); NOT create_booking alone; NOT cancel+waitlist; NOT reschedule_and_notify (provider text).`;

export type RescheduleThenCreateBookingCompoundStep = {
  action: (typeof RESCHEDULE_THEN_CREATE_BOOKING_STEP_ACTIONS)[number];
  params: Record<string, unknown>;
  segment: string;
};

const BOOK_JOIN =
  /(?:\s*;\s*|\s+\bthen\b\s+|\s+\band\b\s+(?:then\s+)?|\s+[—–]\s*)(?=\b(?:also\s+)?(?:book|schedule|create|reserve)\b)/i;

const SECOND_BOOK_CUE =
  /\b(?:a\s+second|another|second|also)\b|\bfor\s+[A-Z][\p{L}'-]{1,40}\b|\bbook\s+(?:a|an)\s+[a-z]/iu;

function hasThenBookSecondCue(prompt: string): boolean {
  if (!BOOK_JOIN.test(prompt) && !/\bthen\s+book\b|\band\s+book\b|;\s*book\b/i.test(prompt)) {
    return false;
  }
  // "put it / move it" restates the same reschedule — not a new booking.
  if (/\b(?:put|move)\s+(?:it|that|them)\b/i.test(prompt) && !SECOND_BOOK_CUE.test(prompt)) {
    return false;
  }
  if (/\b(?:book|schedule|create|reserve)\b/i.test(prompt) === false) {
    return false;
  }
  // Prefer explicit second-booking / other-client cues; bare "then book" after move still counts.
  return (
    SECOND_BOOK_CUE.test(prompt) ||
    /\b(?:then|and)\s+book\b/i.test(prompt) ||
    /;\s*(?:also\s+)?book\b/i.test(prompt)
  );
}

export function extractRescheduleSegmentFromCompoundPrompt(
  prompt: string,
): string {
  const split = prompt.match(
    /^(.*?)(?:\s*;\s*|\s+\band\b\s+(?:then\s+)?|\s+\bthen\b\s+|\s*[—–]\s*)(?=\b(?:also\s+)?(?:book|schedule|create|reserve)\b)/i,
  );
  if (split?.[1]?.trim()) return split[1].trim();
  return prompt.trim();
}

export function extractCreateBookingSegmentFromCompoundPrompt(
  prompt: string,
): string {
  const split = prompt.match(
    /(?:\s*;\s*|\s+\band\b\s+(?:then\s+)?|\s+\bthen\b\s+|\s*[—–]\s*)((?:also\s+)?(?:book|schedule|create|reserve)\b.*)$/i,
  );
  if (split?.[1]?.trim()) return split[1].trim();
  return prompt.trim();
}

function extractCustomerNameForCreate(segment: string): string | undefined {
  const forName = segment.match(
    /\bfor\s+([A-Z][\p{L}'-]{1,40})(?=\s|$|[^\p{L}])/u,
  );
  if (forName?.[1]) return forName[1];
  return undefined;
}

function extractServiceNameForCreate(segment: string): string | undefined {
  // Prefer "book a second massage for Anna" over extractServiceName's "for Anna" steal.
  const bookService = segment.match(
    /\b(?:book|schedule|create|reserve)\s+(?:a\s+|an\s+|the\s+)?(?:(?:second|another)\s+)?([a-z][\w'-]{2,40})\b/i,
  );
  const candidate = bookService?.[1]?.trim();
  if (
    candidate &&
    !/^(for|second|another|also|the|a|an|appointment|booking|visit|slot|time)$/i.test(
      candidate,
    )
  ) {
    return candidate;
  }
  const fromUtil = extractServiceNameFromPrompt(segment);
  const customer = extractCustomerNameForCreate(segment);
  if (
    fromUtil &&
    (!customer || fromUtil.toLowerCase() !== customer.toLowerCase())
  ) {
    return fromUtil;
  }
  return undefined;
}

function hasRescheduleMoveCue(prompt: string): boolean {
  if (isRescheduleExistingAppointmentPrompt(prompt)) return true;
  // Bare "Reschedule Sam to Monday; then book…" omits appointment/booking/visit.
  return /\b(reschedule|move|shift|change\s+time)\b/i.test(prompt);
}

export function isRescheduleThenCreateBookingCompoundPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (text.length < 24) return false;
  if (isSingleRescheduleNearestContinuationPrompt(text)) return false;
  if (!hasThenBookSecondCue(text)) return false;
  if (!hasRescheduleMoveCue(text)) return false;
  // Keep cancel/waitlist/message compounds on their own goldens.
  if (
    /\b(cancel|waitlist|fill\s+(?:the\s+)?(?:freed\s+)?slot|notify|message|email|promo)\b/i.test(
      text,
    )
  ) {
    return false;
  }
  return true;
}

export function buildRescheduleThenCreateBookingCompoundParams(
  prompt: string,
): {
  reschedule: Record<string, unknown>;
  create: Record<string, unknown>;
} {
  const rescheduleSegment = extractRescheduleSegmentFromCompoundPrompt(prompt);
  const createSegment = extractCreateBookingSegmentFromCompoundPrompt(prompt);
  const shared = buildSharedBookingContextFromPrompt(prompt);

  const reschedule = enrichParamsWithSharedEntities(
    { ...shared },
    rescheduleSegment,
  );
  enrichBookingTimeHintsFromPrompt(
    'reschedule_booking',
    reschedule,
    rescheduleSegment,
  );

  const create = enrichParamsWithSharedEntities({ ...shared }, createSegment);
  enrichBookingTimeHintsFromPrompt('create_booking', create, createSegment);

  const customerName = extractCustomerNameForCreate(createSegment);
  if (customerName) create.customerName = customerName;

  const serviceName = extractServiceNameForCreate(createSegment);
  if (serviceName) {
    create.serviceName = serviceName;
  } else if (
    customerName &&
    typeof create.serviceName === 'string' &&
    create.serviceName.toLowerCase() === customerName.toLowerCase()
  ) {
    delete create.serviceName;
  }

  // Second booking is for a different client — do not inherit move-target provider.
  if (customerName) {
    create.employeeName = null;
    delete create.employeeId;
    create.allProviders = true;
  }

  return { reschedule, create };
}

export function decomposeRescheduleThenCreateBookingCompoundPrompt(
  prompt: string,
): RescheduleThenCreateBookingCompoundStep[] {
  if (!isRescheduleThenCreateBookingCompoundPrompt(prompt)) return [];

  const rescheduleSegment = extractRescheduleSegmentFromCompoundPrompt(prompt);
  const createSegment = extractCreateBookingSegmentFromCompoundPrompt(prompt);
  const { reschedule, create } =
    buildRescheduleThenCreateBookingCompoundParams(prompt);

  return propagateSharedBookingContextAcrossSteps([
    {
      action: 'reschedule_booking',
      params: reschedule,
      segment: rescheduleSegment,
    },
    {
      action: 'create_booking',
      params: create,
      segment: createSegment,
    },
  ]);
}

export function rescueRescheduleThenCreateBookingCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isRescheduleThenCreateBookingCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'reschedule_then_create_booking_compound',
  };
}
