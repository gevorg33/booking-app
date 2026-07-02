import type { CommandResult } from './command-completion.types.js';
import {
  buildResumeBookingDraftCopy,
  buildResumeBookingDraftNavigate,
  hasResumableBookingProgress,
  isBookingDraftStale,
  parseBookingDraftFromParams,
  parseResumeBookingDraftFromPrompt,
  resolveAbandonedStepFromDraft,
} from './ai-resume-booking-draft.util.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

export async function handleResumeBookingDraftLogic(
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  void businessId;
  const parsed = parseResumeBookingDraftFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'resume_booking_draft',
      'Ask to continue an unfinished booking (e.g. "Continue where I left off" or "Restore my half-finished booking").',
      { clarify: true },
    );
  }

  const draft = parseBookingDraftFromParams(params);
  if (!draft) {
    return failure(
      'resume_booking_draft',
      'No saved booking draft was found on this device. Pick a service and start booking again.',
      {
        clarify: true,
        missing: [
          'bookingDraftSlug',
          'bookingDraftServiceId',
          'bookingDraftUpdatedAt',
        ],
      },
    );
  }

  if (!hasResumableBookingProgress(draft)) {
    return failure(
      'resume_booking_draft',
      'Your saved booking draft has no slot or contact details yet — pick a service to continue.',
      { bookingDraft: draft, resumable: false },
    );
  }

  if (isBookingDraftStale(draft)) {
    return failure(
      'resume_booking_draft',
      'That booking draft expired after a week of inactivity. Start a fresh booking.',
      { bookingDraft: draft, stale: true },
    );
  }

  const abandonedStep = resolveAbandonedStepFromDraft(draft);
  const summary = buildResumeBookingDraftCopy(abandonedStep);
  const navigate = buildResumeBookingDraftNavigate(draft);

  return success('resume_booking_draft', summary, {
    bookingDraft: draft,
    abandonedStep,
    skipSlotDiscovery: abandonedStep === 'confirm',
    collapseScheduleUi:
      abandonedStep === 'confirm' && Boolean(draft.slot?.trim()),
    restoreGuestContact: Boolean(draft.guestContact),
    navigate,
    sessionContext: {
      serviceId: draft.serviceId,
      slug: draft.slug,
      ...(draft.date ? { date: draft.date } : {}),
      ...(draft.slot ? { timeSlot: draft.slot, startTime: draft.slot } : {}),
      ...(draft.employeeId ? { employeeId: draft.employeeId } : {}),
    },
  });
}
