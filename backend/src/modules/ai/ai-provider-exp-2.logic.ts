import { In, MoreThanOrEqual, Not } from 'typeorm';
import type { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import type { BusinessService } from '../business/business.service.js';
import type { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import type { ReviewsService } from '../reviews/reviews.service.js';
import type { Review } from '../reviews/entities/review.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildDraftReviewResponseText,
  buildExplainRequestReviewFlowText,
  extractBookingActionCustomerName,
  extractRunningLateMinutesFromPrompt,
  formatExplainReviewsInboxSummary,
  formatListTeamUnpaidTodaySummary,
  formatProviderMyStatsSummary,
  formatTeamFloorStatusSummary,
  inferMyStatsPeriodFromPrompt,
  inferMyStatsScopeFromPrompt,
  inferReviewsInboxPeriodFromPrompt,
  inferReviewsInboxRatingFilterFromPrompt,
} from './ai-provider-exp-2.util.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';

export interface ProviderExp2LogicDeps {
  bookingRepo: Repository<Booking>;
  businessService: BusinessService;
  providerMobile: ProviderMobileService;
  reviewsService: ReviewsService;
  configService: ConfigService;
}

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

async function resolveBookingForProviderAction(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
  action: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<
  { bookingId: string; customerName: string } | { error: CommandResult }
> {
  const explicitBookingId =
    (typeof params.bookingId === 'string' && params.bookingId.trim()) ||
    (typeof context?.bookingId === 'string' && context.bookingId.trim()) ||
    null;

  if (explicitBookingId) {
    try {
      const booking = await deps.providerMobile.getBookingDetail(
        businessId,
        userId,
        explicitBookingId,
      );
      return {
        bookingId: explicitBookingId,
        customerName: booking.customer?.name ?? 'Client',
      };
    } catch {
      return {
        error: failure(
          action,
          'Could not find that appointment. Open the booking and try again.',
          { clarify: true },
        ),
      };
    }
  }

  const customerName = extractBookingActionCustomerName(prompt ?? '', params);
  if (!customerName) {
    return {
      error: failure(
        action,
        'Open an appointment or name the client (e.g. "Check in Jane Doe").',
        { clarify: true, missing: ['bookingId', 'customerName'] },
      ),
    };
  }

  const access = await deps.providerMobile.resolveMobileAccess(
    businessId,
    userId,
  );
  const employeeId = deps.providerMobile.getScopedEmployeeId(access);
  const today = getTodayDateKey();
  const dayStart = new Date(`${today}T00:00:00.000Z`);

  let bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      ...(employeeId ? { employeeId } : {}),
      startTime: MoreThanOrEqual(dayStart),
      status: Not(
        In([
          BookingStatus.CANCELLED,
          BookingStatus.COMPLETED,
          BookingStatus.NO_SHOW,
        ]),
      ),
    },
    relations: { customer: true },
    order: { startTime: 'ASC' },
    take: 50,
  });

  const lower = customerName.toLowerCase();
  bookings = bookings.filter((row) =>
    row.customer?.name?.toLowerCase().includes(lower),
  );

  const timeSlot = String(params.timeSlot ?? '').trim();
  if (timeSlot) {
    const normalized = timeSlot.slice(0, 5);
    bookings = bookings.filter((row) =>
      row.startTime.toISOString().slice(11, 16).startsWith(normalized),
    );
  }

  const booking = bookings[0];
  if (!booking) {
    return {
      error: failure(
        action,
        `No active appointment found for "${customerName}" today. Open their booking from the schedule.`,
        { clarify: true, customerName },
      ),
    };
  }

  return {
    bookingId: booking.id,
    customerName: booking.customer?.name ?? customerName,
  };
}

export async function handleMyStatsLogic(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult> {
  const period = inferMyStatsPeriodFromPrompt(prompt ?? '', params);
  const scope = inferMyStatsScopeFromPrompt(prompt ?? '', params);

  const stats = await deps.providerMobile.getMyStats(businessId, userId, {
    period,
    scope,
  });
  const business = await deps.businessService.findOne(businessId);
  const settings = (business?.settings ?? {}) as Record<string, unknown>;

  return success('my_stats', formatProviderMyStatsSummary(stats, settings), {
    ...stats,
  });
}

function reviewsInboxDateRange(
  period: 'today' | 'yesterday' | 'week' | 'month',
  now: Date,
): { start: Date; end: Date } {
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const end = new Date(todayStart);
  end.setUTCDate(end.getUTCDate() + 1);

  if (period === 'today') {
    return { start: todayStart, end };
  }
  if (period === 'yesterday') {
    const start = new Date(todayStart);
    start.setUTCDate(start.getUTCDate() - 1);
    return { start, end: todayStart };
  }
  if (period === 'week') {
    const start = new Date(todayStart);
    start.setUTCDate(start.getUTCDate() - 7);
    return { start, end };
  }
  const start = new Date(todayStart);
  start.setUTCDate(start.getUTCDate() - 30);
  return { start, end };
}

export async function handleExplainReviewsInboxLogic(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult> {
  const access = await deps.providerMobile.resolveMobileAccess(
    businessId,
    userId,
  );
  const scope: 'mine' | 'team' = access.viewMode === 'team' ? 'team' : 'mine';
  const employeeId =
    scope === 'mine' ? deps.providerMobile.getScopedEmployeeId(access) : undefined;
  const period = inferReviewsInboxPeriodFromPrompt(prompt ?? '', params);
  const ratingFilter = inferReviewsInboxRatingFilterFromPrompt(
    prompt ?? '',
    params,
  );

  const allReviews = await deps.reviewsService.list(businessId, employeeId);
  const { start, end } = reviewsInboxDateRange(period, new Date());
  const reviews = allReviews.filter((review) => {
    if (review.createdAt < start || review.createdAt >= end) return false;
    if (ratingFilter?.minRating != null && review.rating < ratingFilter.minRating) {
      return false;
    }
    if (ratingFilter?.maxRating != null && review.rating > ratingFilter.maxRating) {
      return false;
    }
    return true;
  });

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount === 0
      ? null
      : Math.round(
          (reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviewCount) *
            10,
        ) / 10;

  const view = {
    scope,
    period,
    ratingLabel: ratingFilter?.ratingLabel,
    averageRating,
    reviewCount,
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment ?? null,
      customerName: review.customerName ?? review.customer?.name ?? null,
      employeeName: review.employee?.name ?? 'Unknown',
      createdAt: review.createdAt,
    })),
  };

  return success(
    'explain_reviews_inbox',
    formatExplainReviewsInboxSummary(view),
    {
      scope: view.scope,
      period: view.period,
      ratingFilter: ratingFilter
        ? { minRating: ratingFilter.minRating, maxRating: ratingFilter.maxRating }
        : undefined,
      averageRating: view.averageRating,
      reviewCount: view.reviewCount,
      reviews: view.reviews,
    },
  );
}

async function resolveTargetReviewForDraftResponse(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  employeeId: string | undefined,
  params: Record<string, unknown>,
  prompt: string,
  context?: Record<string, unknown>,
): Promise<{ review: Review } | { error: CommandResult }> {
  const reviews = await deps.reviewsService.list(businessId, employeeId);
  if (reviews.length === 0) {
    return {
      error: failure('draft_review_response', 'No reviews found yet.', {}),
    };
  }

  const explicitId =
    (typeof params.reviewId === 'string' && params.reviewId.trim()) ||
    (typeof context?.reviewId === 'string' && context.reviewId.trim()) ||
    null;
  if (explicitId) {
    const match = reviews.find((review) => review.id === explicitId);
    if (match) return { review: match };
  }

  const customerName = extractBookingActionCustomerName(prompt, params);
  if (customerName) {
    const lower = customerName.toLowerCase();
    const match = reviews.find((review) =>
      (review.customerName ?? review.customer?.name ?? '')
        .toLowerCase()
        .includes(lower),
    );
    if (match) return { review: match };
    return {
      error: failure(
        'draft_review_response',
        `No review found for "${customerName}".`,
        { clarify: true, customerName },
      ),
    };
  }

  return { review: reviews[0] };
}

export async function handleDraftReviewResponseLogic(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const access = await deps.providerMobile.resolveMobileAccess(
    businessId,
    userId,
  );
  const employeeId =
    access.viewMode === 'team'
      ? undefined
      : deps.providerMobile.getScopedEmployeeId(access);

  const resolved = await resolveTargetReviewForDraftResponse(
    deps,
    businessId,
    employeeId,
    params,
    prompt ?? '',
    context,
  );
  if ('error' in resolved) return resolved.error;

  const draft = buildDraftReviewResponseText({
    rating: resolved.review.rating,
    comment: resolved.review.comment ?? null,
    customerName:
      resolved.review.customerName ?? resolved.review.customer?.name ?? null,
  });

  return success('draft_review_response', draft, {
    reviewId: resolved.review.id,
    rating: resolved.review.rating,
    draft,
  });
}

export function handleExplainRequestReviewFlowLogic(): CommandResult {
  return success(
    'explain_request_review_flow',
    buildExplainRequestReviewFlowText(),
    {},
  );
}

export function handleOpenDashboardDeepLinkLogic(
  deps: ProviderExp2LogicDeps,
  params: Record<string, unknown>,
  prompt?: string,
): CommandResult {
  const customerName = extractBookingActionCustomerName(prompt ?? '', params);
  if (!customerName) {
    return failure(
      'open_dashboard_deep_link',
      'Name the client to open their dashboard page (e.g. "Open CRM for Jane").',
      { clarify: true },
    );
  }

  const frontendUrl =
    deps.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  const url = `${frontendUrl.replace(/\/$/, '')}/dashboard/customers?search=${encodeURIComponent(customerName)}`;

  return success(
    'open_dashboard_deep_link',
    `Opening ${customerName}'s dashboard profile in a new tab.`,
    { url, customerName },
  );
}

export async function handleTeamFloorStatusLogic(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
): Promise<CommandResult> {
  const access = await deps.providerMobile.resolveMobileAccess(
    businessId,
    userId,
  );
  if (access.viewMode !== 'team') {
    return failure(
      'team_floor_status',
      'Team floor status is available to managers only.',
      { viewMode: access.viewMode },
    );
  }

  const floor = await deps.providerMobile.getTeamFloorToday(businessId, userId);

  return success('team_floor_status', formatTeamFloorStatusSummary(floor), {
    date: floor.date,
    totalBookings: floor.totalBookings,
    columns: floor.columns.map((column) => ({
      employeeId: column.employeeId,
      employeeName: column.employeeName,
      statusCounts: column.statusCounts,
    })),
  });
}

export async function handleCheckInClientLogic(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const resolved = await resolveBookingForProviderAction(
    deps,
    businessId,
    userId,
    'check_in_client',
    params,
    prompt,
    context,
  );
  if ('error' in resolved) return resolved.error;

  try {
    const result = await deps.providerMobile.checkInBooking(
      businessId,
      userId,
      resolved.bookingId,
    );
    return success(
      'check_in_client',
      `Checked in ${resolved.customerName}. They are now on the floor.`,
      {
        bookingId: resolved.bookingId,
        checkedInAt: result.checkedInAt,
        floorStatus: result.floorStatus,
      },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Check-in failed for this visit.';
    return failure('check_in_client', message, {
      bookingId: resolved.bookingId,
    });
  }
}

export async function handleMarkRunningLateLogic(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const resolved = await resolveBookingForProviderAction(
    deps,
    businessId,
    userId,
    'mark_running_late',
    params,
    prompt,
    context,
  );
  if ('error' in resolved) return resolved.error;

  const minutesLate = extractRunningLateMinutesFromPrompt(prompt ?? '', params);

  try {
    const result = await deps.providerMobile.markBookingRunningLate(
      businessId,
      userId,
      resolved.bookingId,
      minutesLate,
    );
    const minutes = result.visitStatus?.minutesLate ?? minutesLate ?? 10;
    return success(
      'mark_running_late',
      `Marked ${resolved.customerName} as running ${minutes} minutes late.`,
      {
        bookingId: resolved.bookingId,
        visitStatus: result.visitStatus,
        floorStatus: result.floorStatus,
        notifications: result.notifications,
      },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not update visit status for this booking.';
    return failure('mark_running_late', message, {
      bookingId: resolved.bookingId,
    });
  }
}

export async function handleMarkReadyNowLogic(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const resolved = await resolveBookingForProviderAction(
    deps,
    businessId,
    userId,
    'mark_ready_now',
    params,
    prompt,
    context,
  );
  if ('error' in resolved) return resolved.error;

  try {
    const result = await deps.providerMobile.markBookingReadyNow(
      businessId,
      userId,
      resolved.bookingId,
    );
    return success(
      'mark_ready_now',
      `Marked ${resolved.customerName} as ready now.`,
      {
        bookingId: resolved.bookingId,
        visitStatus: result.visitStatus,
        floorStatus: result.floorStatus,
        notifications: result.notifications,
      },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not update visit status for this booking.';
    return failure('mark_ready_now', message, {
      bookingId: resolved.bookingId,
    });
  }
}

export async function handleSuggestCancelNoteLogic(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const resolved = await resolveBookingForProviderAction(
    deps,
    businessId,
    userId,
    'suggest_cancel_note',
    params,
    prompt,
    context,
  );
  if ('error' in resolved) return resolved.error;

  const draft = typeof params.draft === 'string' ? params.draft : undefined;

  try {
    const result = await deps.providerMobile.suggestCancelNote(
      businessId,
      userId,
      resolved.bookingId,
      { draft, prompt },
    );
    return success('suggest_cancel_note', result.suggestion, {
      bookingId: resolved.bookingId,
      suggestion: result.suggestion,
      aiAvailable: result.aiAvailable,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not draft a cancellation note for this booking.';
    return failure('suggest_cancel_note', message, {
      bookingId: resolved.bookingId,
    });
  }
}

export async function handleRequestClientReviewLogic(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const resolved = await resolveBookingForProviderAction(
    deps,
    businessId,
    userId,
    'request_client_review',
    params,
    prompt,
    context,
  );
  if ('error' in resolved) return resolved.error;

  try {
    const result = await deps.providerMobile.requestBookingReview(
      businessId,
      userId,
      resolved.bookingId,
    );
    return success(
      'request_client_review',
      `Review request sent to ${resolved.customerName}.`,
      { bookingId: resolved.bookingId, sent: result.sent },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not request a review for this booking.';
    return failure('request_client_review', message, {
      bookingId: resolved.bookingId,
    });
  }
}

export async function handleListReassignOptionsLogic(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const resolved = await resolveBookingForProviderAction(
    deps,
    businessId,
    userId,
    'list_reassign_options',
    params,
    prompt,
    context,
  );
  if ('error' in resolved) return resolved.error;

  const result = await deps.providerMobile.getBookingReassignOptions(
    businessId,
    userId,
    resolved.bookingId,
  );
  if (!result.allowed) {
    return failure(
      'list_reassign_options',
      result.reason ?? 'Reassign is not available for this booking.',
      { bookingId: resolved.bookingId },
    );
  }

  const names = result.options.map((option) => option.name);
  return success(
    'list_reassign_options',
    names.length
      ? `Available providers for ${resolved.customerName}'s ${result.serviceName} at ${result.timeSlot}: ${names.join(', ')}.`
      : 'No other providers are free for this slot.',
    { bookingId: resolved.bookingId, ...result },
  );
}

export async function handleReassignBookingSameDayLogic(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const resolved = await resolveBookingForProviderAction(
    deps,
    businessId,
    userId,
    'reassign_booking_same_day',
    params,
    prompt,
    context,
  );
  if ('error' in resolved) return resolved.error;

  const employeeName =
    typeof params.employeeName === 'string' ? params.employeeName.trim() : '';
  if (!employeeName && typeof params.employeeId !== 'string') {
    return failure(
      'reassign_booking_same_day',
      'Say which provider to reassign this appointment to.',
      { clarify: true, missing: ['employeeName'], bookingId: resolved.bookingId },
    );
  }

  const options = await deps.providerMobile.getBookingReassignOptions(
    businessId,
    userId,
    resolved.bookingId,
  );
  if (!options.allowed) {
    return failure(
      'reassign_booking_same_day',
      options.reason ?? 'Reassign is not available for this booking.',
      { bookingId: resolved.bookingId },
    );
  }

  const availableOptions = options.options as Array<{
    id: string;
    name: string;
  }>;

  let employeeId =
    typeof params.employeeId === 'string' ? params.employeeId : undefined;
  if (!employeeId) {
    const needle = employeeName.toLowerCase();
    const match =
      availableOptions.find((o) => o.name.toLowerCase() === needle) ??
      availableOptions.find((o) => o.name.toLowerCase().includes(needle));
    if (!match) {
      return failure(
        'reassign_booking_same_day',
        `${employeeName} isn't free for this slot. Available: ${availableOptions.map((o) => o.name).join(', ') || 'no one'}.`,
        { bookingId: resolved.bookingId, options: availableOptions },
      );
    }
    employeeId = match.id;
  }

  try {
    const result = await deps.providerMobile.reassignBooking(
      businessId,
      userId,
      resolved.bookingId,
      { employeeId },
    );
    return success(
      'reassign_booking_same_day',
      `Reassigned ${resolved.customerName}'s appointment to ${result.employee?.name ?? 'the new provider'}.`,
      { bookingId: resolved.bookingId, booking: result },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not reassign this appointment.';
    return failure('reassign_booking_same_day', message, {
      bookingId: resolved.bookingId,
    });
  }
}

export async function handleListTeamUnpaidTodayLogic(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
): Promise<CommandResult> {
  const access = await deps.providerMobile.resolveMobileAccess(
    businessId,
    userId,
  );
  if (access.viewMode !== 'team') {
    return failure(
      'list_team_unpaid_today',
      'Team unpaid view is available to managers only.',
      { viewMode: access.viewMode },
    );
  }

  const view = await deps.providerMobile.getTeamUnpaidToday(
    businessId,
    userId,
  );
  const business = await deps.businessService.findOne(businessId);
  const settings = (business?.settings ?? {}) as Record<string, unknown>;

  return success(
    'list_team_unpaid_today',
    formatListTeamUnpaidTodaySummary(view, settings),
    { date: view.date, totalUnpaid: view.totalUnpaid, bookings: view.bookings },
  );
}

export async function dispatchProviderExp2Intent(
  deps: ProviderExp2LogicDeps,
  businessId: string,
  userId: string,
  action: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult | null> {
  switch (action) {
    case 'my_stats':
      return handleMyStatsLogic(deps, businessId, userId, params, prompt);
    case 'team_floor_status':
      return handleTeamFloorStatusLogic(deps, businessId, userId);
    case 'list_team_unpaid_today':
      return handleListTeamUnpaidTodayLogic(deps, businessId, userId);
    case 'explain_reviews_inbox':
      return handleExplainReviewsInboxLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
      );
    case 'explain_request_review_flow':
      return handleExplainRequestReviewFlowLogic();
    case 'open_dashboard_deep_link':
      return handleOpenDashboardDeepLinkLogic(deps, params, prompt);
    case 'draft_review_response':
      return handleDraftReviewResponseLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'check_in_client':
      return handleCheckInClientLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'mark_running_late':
      return handleMarkRunningLateLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'mark_ready_now':
      return handleMarkReadyNowLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'suggest_cancel_note':
      return handleSuggestCancelNoteLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'request_client_review':
      return handleRequestClientReviewLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'list_reassign_options':
      return handleListReassignOptionsLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'reassign_booking_same_day':
      return handleReassignBookingSameDayLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    default:
      return null;
  }
}
