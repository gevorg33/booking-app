import { CUSTOMER_PUBLIC_RESUME_BOOKING_DRAFT_CLASSIFIER_RULES } from './ai-resume-booking-draft.fixtures.js';
import { RESUME_BOOKING_DRAFT_MULTILINGUAL_SCENARIOS } from './ai-resume-booking-draft-multilingual.fixtures.js';
import { isResumePendingPaymentPrompt } from './ai-resume-pending-payment.util.js';

export { CUSTOMER_PUBLIC_RESUME_BOOKING_DRAFT_CLASSIFIER_RULES };

export const RESUME_BOOKING_DRAFT_INTENTS = ['resume_booking_draft'] as const;

export type ResumeBookingDraftIntent =
  (typeof RESUME_BOOKING_DRAFT_INTENTS)[number];

export type BookingAbandonedStep = 'service' | 'slot' | 'confirm';

export interface BookingDraftContext {
  slug: string;
  serviceId: string;
  employeeId?: string;
  date?: string;
  slot?: string;
  guestContact?: {
    name: string;
    email: string;
    phone: string;
  };
  updatedAt: string;
}

const BOOKING_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const PAYMENT_ONLY_CONTEXT = new RegExp(
  String.raw`\b(?:my\s+)?(?:payment|checkout|stripe|paying|card\s+checkout)\b|վճար|оплат`,
  'iu',
);

function normalizePromptApostrophes(text: string): string {
  return text.replace(/[\u2018\u2019]/g, "'");
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readGuestContact(
  value: unknown,
): BookingDraftContext['guestContact'] | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const name = readString(record.name);
  const email = readString(record.email);
  const phone = readString(record.phone);
  if (!name && !email && !phone) return undefined;
  return {
    name: name ?? '',
    email: email ?? '',
    phone: phone ?? '',
  };
}

export function isResumeBookingDraftIntent(
  action: string,
): action is ResumeBookingDraftIntent {
  return (RESUME_BOOKING_DRAFT_INTENTS as readonly string[]).includes(action);
}

export function resolveAbandonedStepFromDraft(
  draft: BookingDraftContext,
): BookingAbandonedStep {
  if (draft.slot?.trim()) return 'confirm';
  if (draft.date?.trim()) return 'slot';
  return 'service';
}

export function hasResumableBookingProgress(
  draft: BookingDraftContext | null | undefined,
): boolean {
  if (!draft?.slug || !draft.serviceId) return false;
  return Boolean(
    draft.slot?.trim() ||
    draft.date?.trim() ||
    draft.employeeId?.trim() ||
    draft.guestContact?.name?.trim() ||
    draft.guestContact?.email?.trim() ||
    draft.guestContact?.phone?.trim(),
  );
}

export function isBookingDraftStale(
  draft: BookingDraftContext,
  now: Date = new Date(),
): boolean {
  const updatedAt = Date.parse(draft.updatedAt);
  if (!Number.isFinite(updatedAt)) return true;
  return now.getTime() - updatedAt > BOOKING_DRAFT_MAX_AGE_MS;
}

export function parseBookingDraftFromParams(
  params: Record<string, unknown> = {},
): BookingDraftContext | null {
  const nested = params.bookingDraft;
  if (nested && typeof nested === 'object') {
    const record = nested as Record<string, unknown>;
    const slug = readString(record.slug);
    const serviceId = readString(record.serviceId);
    const updatedAt = readString(record.updatedAt);
    if (slug && serviceId && updatedAt) {
      return {
        slug,
        serviceId,
        updatedAt,
        employeeId: readString(record.employeeId),
        date: readString(record.date),
        slot: readString(record.slot),
        guestContact: readGuestContact(record.guestContact),
      };
    }
  }

  const slug = readString(params.bookingDraftSlug) ?? readString(params.slug);
  const serviceId =
    readString(params.bookingDraftServiceId) ?? readString(params.serviceId);
  const updatedAt = readString(params.bookingDraftUpdatedAt);
  if (!slug || !serviceId || !updatedAt) return null;

  return {
    slug,
    serviceId,
    updatedAt,
    employeeId: readString(params.bookingDraftEmployeeId),
    date: readString(params.bookingDraftDate),
    slot: readString(params.bookingDraftSlot),
    guestContact: readGuestContact(params.bookingDraftGuestContact),
  };
}

export function buildResumeBookingDraftCopy(
  step: BookingAbandonedStep,
): string {
  switch (step) {
    case 'confirm':
      return 'Continue your booking — confirm the time below.';
    case 'slot':
      return 'Continue your booking — pick a time below.';
    default:
      return 'Continue your unfinished booking below.';
  }
}

function matchResumeBookingDraftMultilingualScenario(
  prompt: string,
): (typeof RESUME_BOOKING_DRAFT_MULTILINGUAL_SCENARIOS)[number] | null {
  const trimmed = prompt.trim();
  return (
    RESUME_BOOKING_DRAFT_MULTILINGUAL_SCENARIOS.find(
      (scenario) => scenario.prompt === trimmed,
    ) ?? null
  );
}

export function isResumeBookingDraftPrompt(prompt: string): boolean {
  if (isResumePendingPaymentPrompt(prompt)) return false;
  if (matchResumeBookingDraftMultilingualScenario(prompt)) return true;

  const text = normalizePromptApostrophes(prompt);

  if (/\bcontinue\s+where\s+I\s+left\s+off\b/i.test(text)) return true;
  if (/\brestore\s+my\s+half[\s-]?finished\s+booking\b/i.test(text)) {
    return true;
  }
  if (/\brestore\s+my\s+unfinished\s+booking\b/i.test(text)) return true;
  if (
    /\bcontinue\s+my\s+(?:unfinished|half[\s-]?finished)\s+booking\b/i.test(
      text,
    )
  ) {
    return true;
  }
  if (/\bgo\s+back\s+to\s+the\s+booking\s+I\s+started\b/i.test(text)) {
    return true;
  }
  if (/\bresume\s+my\s+booking\b/i.test(text)) return true;
  if (/\bfinish\s+the\s+booking\s+I\s+started\b/i.test(text)) return true;
  if (
    /\brestore\s+my\s+(?:in[\s-]?progress|saved)\s+booking(?:\s+draft)?\b/i.test(
      text,
    )
  ) {
    return true;
  }
  if (/\bcontinue\s+the\s+booking\s+I\s+abandoned\b/i.test(text)) return true;
  if (/\btake\s+me\s+back\s+to\s+my\s+half[\s-]?done\s+booking\b/i.test(text)) {
    return true;
  }
  if (/\bcontinue\s+my\s+booking\s+below\b/i.test(text)) return true;
  if (
    /\b(pick\s+up\s+where\s+I\s+left\s+off)\b/i.test(text) &&
    /\bbooking\b/i.test(text)
  ) {
    return true;
  }
  if (
    /\b(pick\s+up\s+where|continue\s+where).{0,15}left\s+off\b/i.test(text) &&
    !PAYMENT_ONLY_CONTEXT.test(text)
  ) {
    return true;
  }

  return false;
}

export function parseResumeBookingDraftFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { draft: BookingDraftContext | null } | null {
  if (!isResumeBookingDraftPrompt(prompt)) return null;
  return { draft: parseBookingDraftFromParams(params) };
}

export function rescueResumeBookingDraftIntent(
  prompt: string,
  action: string,
): { action: ResumeBookingDraftIntent; rescueReason: string } | null {
  if (isResumeBookingDraftIntent(action)) return null;
  if (!isResumeBookingDraftPrompt(prompt)) return null;
  return {
    action: 'resume_booking_draft',
    rescueReason: 'resume_booking_draft',
  };
}

export function buildResumeBookingDraftNavigate(draft: BookingDraftContext): {
  path: string;
  query: Record<string, string>;
} {
  const query: Record<string, string> = {
    serviceId: draft.serviceId,
    resume: '1',
  };
  if (draft.date) query.date = draft.date;
  if (draft.slot) {
    query.slot = draft.slot;
    query.startTime = draft.slot;
  }
  if (draft.employeeId) query.employeeId = draft.employeeId;
  return { path: 'checkout', query };
}
