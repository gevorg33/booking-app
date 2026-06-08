import {
  buildBookingDraftResumePath,
  hasResumableBookingProgress,
  isBookingDraftResumePath,
  isBookingDraftStale,
  resolveAbandonedStepFromDraft,
  type BookingAbandonedStep,
  type BookingDraft,
} from './booking-draft.util.js';
import { getConsumerCopy } from './consumer-copy-catalog.js';
import { normalizeConsumerLocale } from './tenant-locale.js';

/** Query flag — abandoned booking resumes exactly where the user left off (n99-3.4 / adopt-3.6). */
export const BOOKING_DRAFT_RESUME_PARAM = 'resume';

export interface BookingDraftResumeContext {
  isResume: boolean;
  abandonedStep: BookingAbandonedStep;
  skipSlotDiscovery: boolean;
  collapseScheduleUi: boolean;
  restoreGuestContact: boolean;
}

export function readBookingDraftResumeContext(input: {
  search: string;
  slug: string;
  serviceId: string;
  slot: string;
  draft: BookingDraft | null;
}): BookingDraftResumeContext {
  const params = new URLSearchParams(
    input.search.startsWith('?') ? input.search : `?${input.search}`,
  );
  const hasResumeFlag = params.get(BOOKING_DRAFT_RESUME_PARAM) === '1';
  const draftMatches =
    input.draft?.slug === input.slug && input.draft?.serviceId === input.serviceId;
  const abandonedStep = input.draft
    ? resolveAbandonedStepFromDraft(input.draft)
    : ('service' as const);
  const isResume =
    hasResumeFlag &&
    draftMatches &&
    Boolean(input.draft && hasResumableBookingProgress(input.draft));

  return {
    isResume,
    abandonedStep,
    skipSlotDiscovery: isResume && abandonedStep === 'confirm',
    collapseScheduleUi: isResume && abandonedStep === 'confirm' && Boolean(input.slot.trim()),
    restoreGuestContact: isResume && Boolean(input.draft?.guestContact),
  };
}

export function shouldRedirectToAbandonedBooking(input: {
  pathname: string;
  draft: BookingDraft | null;
  stale: boolean;
}): boolean {
  if (!input.draft || input.stale || !hasResumableBookingProgress(input.draft)) {
    return false;
  }
  return !isBookingDraftResumePath(input.pathname, input.draft);
}

export function resolveAbandonedBookingRedirectPath(draft: BookingDraft): string {
  return buildBookingDraftResumePath(draft);
}

export function shouldDeferNavigationForAbandonedBooking(
  draft: BookingDraft | null,
  now: Date = new Date(),
): boolean {
  if (!draft || !hasResumableBookingProgress(draft)) return false;
  return !isBookingDraftStale(draft, now);
}

export function buildBookingDraftResumeCopy(
  step: BookingAbandonedStep,
  locale?: string | null,
): string {
  const copy = getConsumerCopy(normalizeConsumerLocale(locale) ?? 'en');
  switch (step) {
    case 'confirm':
      return copy.bookingDraftResumeConfirm;
    case 'slot':
      return copy.bookingDraftResumeSlot;
    default:
      return copy.bookingDraftResumeService;
  }
}

export function resolveBookingDraftResumeAnalyticsProps(input: {
  draft: BookingDraft;
  resumedOnOpen?: boolean;
}) {
  return {
    serviceId: input.draft.serviceId,
    abandonedStep: resolveAbandonedStepFromDraft(input.draft),
    ...(input.resumedOnOpen ? { firstRunRedirect: 'abandonment_resume' } : {}),
  };
}
