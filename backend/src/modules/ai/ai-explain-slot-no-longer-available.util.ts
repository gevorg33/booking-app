import { isFixCheckoutValidationErrorPrompt } from './ai-fix-checkout-validation-error.util.js';
import { isConsumerDiagnoseStripeCheckoutFailurePrompt } from './ai-diagnose-stripe-checkout-failure.util.js';
import { isFindSoonestAppointmentPrompt } from './ai-find-soonest-appointment.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SLOT_NO_LONGER_AVAILABLE_CLASSIFIER_RULES } from './ai-explain-slot-no-longer-available.fixtures.js';
import { EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_SCENARIOS } from './ai-explain-slot-no-longer-available-multilingual.fixtures.js';

export { CUSTOMER_PUBLIC_EXPLAIN_SLOT_NO_LONGER_AVAILABLE_CLASSIFIER_RULES };

/** Matches booking-payment checkout draft TTL (30 minutes). */
export const BOOKING_CHECKOUT_DRAFT_TTL_MINUTES = 30;

export const EXPLAIN_SLOT_NO_LONGER_AVAILABLE_INTENTS = [
  'explain_slot_no_longer_available',
] as const;

export type ExplainSlotNoLongerAvailableIntent =
  (typeof EXPLAIN_SLOT_NO_LONGER_AVAILABLE_INTENTS)[number];

export type SlotNoLongerAvailableAspect =
  | 'taken_by_someone'
  | 'disappeared'
  | 'checkout_hold_expired'
  | 'generic'
  | 'all';

const SLOT_GONE_CUE = new RegExp(
  String.raw`\b(slot|time|appointment)\b.{0,40}\b(gone|disappeared|vanished|lost|no\s+longer|not\s+there|not\s+available|unavailable|taken|stolen|missing)\b|\b(gone|disappeared|vanished|lost)\b.{0,40}\b(slot|time|appointment)\b|\b(someone|somebody|another\s+(?:person|customer|client))\b.{0,30}\b(took|booked|grabbed|snatched)\b.{0,20}\b(slot|time|my)\b|\b(took|booked)\b.{0,20}\bmy\s+slot\b|\bcan(?:not|'t)\s+book\b.{0,20}\btime\b|\bwhy\b.{0,20}\b(slot|time)\b.{0,20}\bdisappear`,
  'iu',
);

const CHECKOUT_CONTEXT = new RegExp(
  String.raw`\b(checkout|book(?:ing)?|confirm|selected|picked|chose|slot|time|appointment)\b`,
  'iu',
);

const DIRECT_AVAILABILITY_CUE = new RegExp(
  String.raw`\b(who\s+is\s+free|check\s+availability|open\s+slots?|available\s+(?:times?|slots?)|free\s+(?:times?|slots?))\b`,
  'iu',
);

function normalizePromptApostrophes(text: string): string {
  return text.replace(/[\u2018\u2019]/g, "'");
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function matchMultilingualScenario(
  prompt: string,
):
  | (typeof EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  return (
    EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_SCENARIOS.find(
      (scenario) => scenario.prompt === trimmed,
    ) ?? null
  );
}

export function isExplainSlotNoLongerAvailableIntent(
  action: string,
): action is ExplainSlotNoLongerAvailableIntent {
  return (
    EXPLAIN_SLOT_NO_LONGER_AVAILABLE_INTENTS as readonly string[]
  ).includes(action);
}

export function parseSlotNoLongerAvailableAspect(
  prompt: string,
  params: Record<string, unknown> = {},
): SlotNoLongerAvailableAspect {
  const fromParams = readString(params.aspect);
  if (
    fromParams === 'taken_by_someone' ||
    fromParams === 'disappeared' ||
    fromParams === 'checkout_hold_expired' ||
    fromParams === 'generic' ||
    fromParams === 'all'
  ) {
    return fromParams;
  }

  const text = normalizePromptApostrophes(prompt);
  if (
    /\b(checkout|payment|stripe)\b.{0,30}\b(expir|hold|session)\b/i.test(text)
  ) {
    return 'checkout_hold_expired';
  }
  if (
    /\b(someone|somebody|another|took|booked|grabbed|snatched|stolen)\b/i.test(
      text,
    )
  ) {
    return 'taken_by_someone';
  }
  if (/\b(disappeared|vanished|gone|lost|not\s+there)\b/i.test(text)) {
    return 'disappeared';
  }
  return 'generic';
}

export function isExplainSlotNoLongerAvailablePrompt(prompt: string): boolean {
  if (matchMultilingualScenario(prompt)) return true;
  if (isFixCheckoutValidationErrorPrompt(prompt)) return false;
  if (isConsumerDiagnoseStripeCheckoutFailurePrompt(prompt)) return false;
  if (isFindSoonestAppointmentPrompt(prompt)) return false;
  if (DIRECT_AVAILABILITY_CUE.test(prompt) && !SLOT_GONE_CUE.test(prompt)) {
    return false;
  }

  const text = normalizePromptApostrophes(prompt);
  if (/\bthat\s+time\s+disappeared\b/i.test(text)) return true;
  if (/\bsomeone\s+took\s+my\s+slot\b/i.test(text)) return true;
  if (/\bmy\s+slot\s+is\s+gone\b/i.test(text)) return true;
  if (
    /\btime\s+i\s+picked\b/i.test(text) &&
    /\b(?:isn['']t|not)\s+available\b/i.test(text)
  ) {
    return true;
  }
  if (/\bslot\s+i\s+selected\b/i.test(text) && /\bno\s+longer\b/i.test(text)) {
    return true;
  }
  if (/\blost\s+the\s+appointment\s+time\b/i.test(text)) return true;
  if (/\bcheckout\s+time\s+vanished\b/i.test(text)) return true;
  if (/\b(checkout|payment|stripe)\b.{0,40}\b(expir|hold)\b/i.test(text)) {
    return true;
  }
  if (/\bdid\s+someone\s+else\s+book\s+my\s+slot\b/i.test(text)) return true;
  if (
    /\bwhy\b/i.test(text) &&
    /\btime\s+slot\b/i.test(text) &&
    /\bdisappear\b/i.test(text)
  ) {
    return true;
  }
  if (
    /\bcan(?:not|'t)\s+book\b/i.test(text) &&
    /\btime\s+i\s+selected\b/i.test(text)
  ) {
    return true;
  }
  if (/\bslot\s+was\s+taken\b/i.test(text)) return true;
  if (/\bappointment\s+time\s+is\s+unavailable\b/i.test(text)) return true;

  return SLOT_GONE_CUE.test(text) && CHECKOUT_CONTEXT.test(text);
}

export function parseExplainSlotNoLongerAvailableFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: SlotNoLongerAvailableAspect } | null {
  if (!isExplainSlotNoLongerAvailablePrompt(prompt)) return null;
  return { aspect: parseSlotNoLongerAvailableAspect(prompt, params) };
}

export function rescueExplainSlotNoLongerAvailableIntent(
  prompt: string,
  action: string,
): { action: ExplainSlotNoLongerAvailableIntent; rescueReason: string } | null {
  if (isExplainSlotNoLongerAvailableIntent(action)) return null;
  if (!isExplainSlotNoLongerAvailablePrompt(prompt)) return null;
  return {
    action: 'explain_slot_no_longer_available',
    rescueReason: 'explain_slot_no_longer_available',
  };
}

export function buildSlotNoLongerAvailableExplanation(
  aspect: SlotNoLongerAvailableAspect,
): { likelyCauses: string[]; nextSteps: string[] } {
  const likelyCauses: string[] = [
    'Times are not reserved until you confirm the booking — if another customer booked that slot while you were still on checkout, it disappears from your selection.',
  ];
  const nextSteps: string[] = [
    'Pick another open time from the refreshed availability below.',
  ];

  if (aspect === 'taken_by_someone') {
    likelyCauses.unshift(
      'Another customer likely confirmed the same time just before you finished.',
    );
  } else if (aspect === 'disappeared') {
    likelyCauses.unshift(
      'The slot you picked may have been taken or the schedule updated while you were booking.',
    );
  }

  likelyCauses.push(
    `Online card checkout holds expire after ${BOOKING_CHECKOUT_DRAFT_TTL_MINUTES} minutes — if you paused too long, the slot can be released for others.`,
  );
  nextSteps.push(
    'If online payment was open, start checkout again with a new time.',
  );

  return { likelyCauses, nextSteps };
}

export function buildAvailabilityRefreshParams(
  params: Record<string, unknown> = {},
): Record<string, unknown> | null {
  const serviceId = readString(params.serviceId);
  const serviceName = readString(params.serviceName);
  const date =
    readString(params.date) ?? readString(params.bookingDraftDate) ?? undefined;
  if (!date || (!serviceId && !serviceName)) return null;

  return {
    ...(serviceId ? { serviceId } : {}),
    ...(serviceName ? { serviceName } : {}),
    date,
    ...(readString(params.employeeId)
      ? { employeeId: readString(params.employeeId) }
      : {}),
    ...(readString(params.employeeName)
      ? { employeeName: readString(params.employeeName) }
      : {}),
    ...(readString(params.timeSlot)
      ? { timeSlot: readString(params.timeSlot) }
      : {}),
    ...(readString(params.startTime)
      ? { startTime: readString(params.startTime) }
      : {}),
  };
}

export function buildExplainSlotNoLongerAvailableNavigate(
  params: Record<string, unknown>,
): { path: string; query: Record<string, string> } | undefined {
  const serviceId = readString(params.serviceId);
  const startTime = readString(params.startTime);
  const employeeId = readString(params.employeeId);
  const date = readString(params.date);
  if (!serviceId && !startTime && !date) return undefined;

  const query: Record<string, string> = {};
  if (serviceId) query.serviceId = serviceId;
  if (startTime) query.startTime = startTime;
  if (date) query.date = date;
  if (employeeId) query.employeeId = employeeId;
  query.freshBook = '1';

  return { path: 'checkout', query };
}
