import { In, MoreThanOrEqual, Not } from 'typeorm';
import type { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import type { BusinessService } from '../business/business.service.js';
import type { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  extractBookingActionCustomerName,
  extractRunningLateMinutesFromPrompt,
  formatProviderMyStatsSummary,
  formatTeamFloorStatusSummary,
  inferMyStatsPeriodFromPrompt,
  inferMyStatsScopeFromPrompt,
} from './ai-provider-exp-2.util.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';

export interface ProviderExp2LogicDeps {
  bookingRepo: Repository<Booking>;
  businessService: BusinessService;
  providerMobile: ProviderMobileService;
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
