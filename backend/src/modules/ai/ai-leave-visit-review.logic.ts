import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import { enrichCancelMyBookingParamsFromPrompt } from './ai-cancel-my-booking.util.js';
import {
  buildLeaveVisitReviewAmbiguousSummary,
  buildLeaveVisitReviewNavigate,
  matchCustomerReviewableBooking,
  parseLeaveVisitReviewFromPrompt,
} from './ai-leave-visit-review.util.js';

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

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

async function resolveBusinessSlug(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

export async function handleLeaveVisitReviewLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseLeaveVisitReviewFromPrompt(textPrompt, params);
  if (!parsed) {
    return failure(
      'leave_visit_review',
      'Ask to rate or review a completed visit (e.g. "Rate my last visit").',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'leave_visit_review',
      'Sign in to leave a review for your visit.',
      { clarify: true },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('leave_visit_review', 'Business not found.');

  const enrichedParams = enrichCancelMyBookingParamsFromPrompt(
    params,
    textPrompt,
  );
  const listed = await deps.publicCustomerAuthService.listBookings(
    slug,
    customerId,
  );
  const reviewable = listed.bookings.filter((row) => row.canReview);

  if (!reviewable.length) {
    return failure(
      'leave_visit_review',
      'No completed visits are waiting for a review right now.',
      { clarify: true },
    );
  }

  const matchParams: Record<string, unknown> = {
    ...(enrichedParams.bookingId
      ? { bookingId: enrichedParams.bookingId }
      : {}),
    ...(parsed.bookingId ? { bookingId: parsed.bookingId } : {}),
    ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
    ...(parsed.date ? { date: parsed.date } : {}),
  };

  const matched = matchCustomerReviewableBooking(
    reviewable,
    matchParams,
    textPrompt,
    String(params._timeZone ?? 'UTC'),
  );

  if (matched.ambiguous.length > 1) {
    return failure(
      'leave_visit_review',
      buildLeaveVisitReviewAmbiguousSummary(matched.ambiguous),
      {
        clarify: true,
        missing: ['bookingId'],
        candidates: matched.ambiguous.map((row) => ({
          bookingId: row.id,
          serviceName: row.serviceName,
          startTime: row.startTime,
        })),
      },
    );
  }

  const booking = matched.booking;
  if (!booking) {
    return failure(
      'leave_visit_review',
      'No matching completed visit found to review.',
      { clarify: true },
    );
  }

  if (parsed.rating) {
    try {
      const submitted = await deps.publicBookingService.submitCustomerReview(
        slug,
        customerId,
        booking.id,
        {
          rating: parsed.rating,
          ...(parsed.comment ? { comment: parsed.comment } : {}),
        },
      );
      return success(
        'leave_visit_review',
        `Thanks — your ${parsed.rating}-star review for ${booking.serviceName} is saved.`,
        {
          bookingId: booking.id,
          reviewId: submitted.id,
          rating: submitted.rating,
          serviceName: booking.serviceName,
          submitted: true,
        },
      );
    } catch (err: any) {
      return failure(
        'leave_visit_review',
        err?.message ?? 'Could not submit your review.',
        { bookingId: booking.id },
      );
    }
  }

  return success(
    'leave_visit_review',
    `Opening the review screen for your ${booking.serviceName} visit.`,
    {
      bookingId: booking.id,
      serviceName: booking.serviceName,
      submitted: false,
      navigate: buildLeaveVisitReviewNavigate(booking.id),
    },
  );
}
