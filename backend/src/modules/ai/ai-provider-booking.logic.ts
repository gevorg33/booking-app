import { Between, type Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import type { BookingService } from '../booking/booking.service.js';
import { resolveDateRange } from './ai-orchestration.helpers.js';
import type { CommandResult } from './command-completion.types.js';
import {
  filterMultiServiceBookings,
  filterPackageBookings,
} from './ai-booking-depth.util.js';
import { handleMarkPaidLogic } from './ai-booking-depth.logic.js';
import {
  mergeCompoundStepParams,
  pickSharedEntitySessionSlice,
} from './ai-command-entity-params.util.js';
import {
  decomposeProviderBookingCompoundPrompt,
  extractBookingIdFromPrompt,
  type ProviderBookingCompoundStep,
} from './ai-provider-booking.util.js';

export interface ProviderBookingLogicDeps {
  bookingRepo: Repository<Booking>;
  bookingService: BookingService;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

function resolveSessionEmployeeId(
  params: Record<string, any>,
): string | undefined {
  return (
    (params.sessionEmployeeId as string | undefined) ??
    (params.employeeId as string | undefined)
  );
}

function scopeBookingsToEmployee<T extends { employeeId?: string | null }>(
  bookings: T[],
  employeeId?: string,
): T[] {
  if (!employeeId) return bookings;
  return bookings.filter((b) => b.employeeId === employeeId);
}

function todayRange(_timeZone = 'UTC'): {
  start: Date;
  end: Date;
  label: string;
} {
  const key = new Date().toISOString().slice(0, 10);
  const start = new Date(key);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(key);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end, label: key };
}

async function loadBookingsInRange(
  deps: ProviderBookingLogicDeps,
  businessId: string,
  start: Date,
  end: Date,
): Promise<Booking[]> {
  return deps.bookingRepo.find({
    where: { businessId, startTime: Between(start, end) },
    relations: { employee: true, service: true, customer: true },
    order: { startTime: 'ASC' },
  });
}

export async function handleListPackageAppointmentsTodayLogic(
  deps: ProviderBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const employeeId = resolveSessionEmployeeId(params);
  const { start, end, label } = todayRange(params._timeZone);
  const bookings = scopeBookingsToEmployee(
    filterPackageBookings(
      await loadBookingsInRange(deps, businessId, start, end),
    ),
    employeeId,
  );
  const purchaseIds = [
    ...new Set(bookings.map((b) => b.packagePurchaseId).filter(Boolean)),
  ];

  return success(
    'list_package_appointments_today',
    bookings.length
      ? `You have ${bookings.length} package appointment(s) today across ${purchaseIds.length} visit(s).`
      : 'No package appointments on your calendar today.',
    {
      bookings,
      visitCount: purchaseIds.length,
      count: bookings.length,
      date: label,
      scopedEmployeeId: employeeId,
    },
  );
}

export async function handleListMyPackageVisitsLogic(
  deps: ProviderBookingLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const employeeId = resolveSessionEmployeeId(params);
  const range = resolveDateRange(params, prompt, params._timeZone ?? 'UTC') ?? {
    start: new Date().toISOString().slice(0, 10),
    end: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  };
  const start = new Date(range.start);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setUTCHours(23, 59, 59, 999);

  const bookings = scopeBookingsToEmployee(
    filterPackageBookings(
      await loadBookingsInRange(deps, businessId, start, end),
    ),
    employeeId,
  );
  const purchaseIds = [
    ...new Set(bookings.map((b) => b.packagePurchaseId).filter(Boolean)),
  ];

  return success(
    'list_my_package_visits',
    bookings.length
      ? `${purchaseIds.length} package visit(s), ${bookings.length} appointment(s) on your calendar.`
      : 'No package visits in that range on your calendar.',
    {
      bookings,
      visitCount: purchaseIds.length,
      count: bookings.length,
      range,
      scopedEmployeeId: employeeId,
    },
  );
}

export async function handleListMyMultiServiceGroupsLogic(
  deps: ProviderBookingLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const employeeId = resolveSessionEmployeeId(params);
  const range = resolveDateRange(params, prompt, params._timeZone ?? 'UTC') ?? {
    start: new Date().toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  };
  const start = new Date(range.start);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setUTCHours(23, 59, 59, 999);

  const bookings = scopeBookingsToEmployee(
    filterMultiServiceBookings(
      await loadBookingsInRange(deps, businessId, start, end),
    ),
    employeeId,
  );
  const groupIds = [
    ...new Set(bookings.map((b) => b.multiServiceGroupId).filter(Boolean)),
  ];

  return success(
    'list_my_multi_service_groups',
    bookings.length
      ? `${groupIds.length} multi-service group(s), ${bookings.length} appointment(s) on your calendar.`
      : 'No multi-service groups in that range on your calendar.',
    {
      bookings,
      groupCount: groupIds.length,
      count: bookings.length,
      range,
      scopedEmployeeId: employeeId,
    },
  );
}

export async function handleProviderMarkPaidLogic(
  deps: ProviderBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
): Promise<CommandResult> {
  const bookingId =
    (params.bookingId as string | undefined) ??
    extractBookingIdFromPrompt((params._prompt as string) ?? '');
  if (!bookingId) {
    return failure(
      'mark_paid',
      'Specify which booking to mark paid (booking ID or reference).',
      {
        clarify: true,
        missing: ['bookingId'],
      },
    );
  }

  const employeeId = resolveSessionEmployeeId(params);
  const booking = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId },
    relations: { customer: true, employee: true },
  });
  if (!booking) return failure('mark_paid', `Booking ${bookingId} not found.`);
  if (employeeId && booking.employeeId !== employeeId) {
    return failure(
      'mark_paid',
      'You can only mark paid for appointments on your own calendar.',
      {
        bookingId,
        scopedEmployeeId: employeeId,
      },
    );
  }

  return handleMarkPaidLogic(
    {
      bookingRepo: deps.bookingRepo,
      bookingService: deps.bookingService,
    } as any,
    businessId,
    { ...params, bookingId },
    userId,
  );
}

export function mergeProviderBookingCompoundContext(
  context: Record<string, unknown>,
  step: ProviderBookingCompoundStep,
  result: CommandResult,
): Record<string, unknown> {
  const details = result.details as Record<string, unknown>;
  const next = { ...context };
  if (details.sessionContext && typeof details.sessionContext === 'object') {
    Object.assign(next, details.sessionContext);
  }
  if (details.bookingId) next.bookingId = details.bookingId;
  if (
    details.bookings &&
    Array.isArray(details.bookings) &&
    details.bookings.length
  ) {
    const first = details.bookings[0] as { id?: string };
    if (first?.id) next.bookingId = first.id;
  }
  if (step.action === 'mark_paid' && details.bookingId)
    next.bookingId = details.bookingId;
  Object.assign(next, pickSharedEntitySessionSlice(details));
  return next;
}

export async function handleProviderBookingCompoundLogic(
  deps: ProviderBookingLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const steps: ProviderBookingCompoundStep[] =
    (params.compoundSteps as ProviderBookingCompoundStep[] | undefined) ??
    decomposeProviderBookingCompoundPrompt(prompt);

  if (steps.length < 2) {
    return failure(
      'compound_intent',
      'Could not split this into multiple provider booking commands. Try separating with "and" or semicolons.',
      { clarify: true },
    );
  }

  const results: CommandResult[] = [];
  let compoundContext: Record<string, unknown> = { ...params, _prompt: prompt };

  for (const step of steps.slice(0, 4)) {
    const stepParams = {
      ...compoundContext,
      ...mergeCompoundStepParams(compoundContext, step.params, step.action),
      _prompt: step.segment,
    };
    let result: CommandResult;
    switch (step.action) {
      case 'list_package_appointments_today':
        result = await handleListPackageAppointmentsTodayLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'list_my_package_visits':
        result = await handleListMyPackageVisitsLogic(
          deps,
          businessId,
          prompt,
          stepParams,
        );
        break;
      case 'list_my_multi_service_groups':
        result = await handleListMyMultiServiceGroupsLogic(
          deps,
          businessId,
          prompt,
          stepParams,
        );
        break;
      case 'mark_paid':
        result = await handleProviderMarkPaidLogic(
          deps,
          businessId,
          stepParams,
          params.userId as string,
        );
        break;
      default:
        result = failure(
          step.action,
          `Unsupported provider booking compound step: ${step.action}.`,
        );
    }
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        action: 'compound_intent',
        summary: `Stopped at step ${results.length} (${step.action}): ${result.summary}`,
        details: {
          steps: results.map((r) => r.action),
          failedStep: step.action,
        },
      };
    }
    compoundContext = mergeProviderBookingCompoundContext(
      compoundContext,
      step,
      result,
    );
  }

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} provider booking step(s): ${results.map((r) => r.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((r) => ({ action: r.action, summary: r.summary })),
      decomposed: true,
      providerBookingCompound: true,
      finalContext: compoundContext,
      sessionContext: compoundContext,
    },
  };
}
