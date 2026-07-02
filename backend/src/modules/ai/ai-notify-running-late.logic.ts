import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import { matchCustomerOwnedBooking } from './ai-cancel-my-booking.util.js';
import { enrichCancelMyBookingParamsFromPrompt } from './ai-cancel-my-booking.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import type { Booking } from '../booking/entities/booking.entity.js';
import { buildCustomerRunningLateSuccessSummary } from '../../common/utils/customer-running-late.util.js';
import {
  buildNotifyRunningLateAmbiguousSummary,
  parseNotifyRunningLateFromPrompt,
} from './ai-notify-running-late.util.js';

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

async function resolveOwnedBookingForLate(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  customerId: string,
  params: Record<string, unknown>,
  prompt: string,
): Promise<{ booking: Booking | null; ambiguous: Booking[] }> {
  const enrichedParams = enrichCancelMyBookingParamsFromPrompt(params, prompt);

  if (enrichedParams.bookingId) {
    const booking = await deps.bookingRepo.findOne({
      where: {
        id: enrichedParams.bookingId as string,
        businessId,
        customerId,
      },
      relations: { employee: true, service: true },
    });
    return { booking: booking ?? null, ambiguous: [] };
  }

  const bookings = await deps.bookingRepo.find({
    where: { businessId, customerId, status: BookingStatus.CONFIRMED },
    relations: { employee: true, service: true },
    order: { startTime: 'ASC' },
  });

  const matched = matchCustomerOwnedBooking(
    bookings,
    enrichedParams,
    prompt,
    String(params._timeZone ?? 'UTC'),
    { allowFirstWhenUnspecified: false },
  );
  return { booking: matched.booking, ambiguous: matched.ambiguous };
}

export async function handleNotifyRunningLateLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseNotifyRunningLateFromPrompt(textPrompt, params);
  if (!parsed) {
    return failure(
      'notify_running_late',
      'Say how many minutes late you are for your appointment.',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'notify_running_late',
      'Sign in to notify the salon you are running late.',
      { clarify: true },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('notify_running_late', 'Business not found.');

  const resolved = await resolveOwnedBookingForLate(
    deps,
    businessId,
    customerId,
    params,
    textPrompt,
  );

  if (resolved.ambiguous.length > 1) {
    return failure(
      'notify_running_late',
      buildNotifyRunningLateAmbiguousSummary(resolved.ambiguous),
      {
        clarify: true,
        missing: ['bookingId'],
        candidates: resolved.ambiguous.map((row) => ({
          bookingId: row.id,
          serviceName: row.service?.name ?? null,
          startTime: row.startTime.toISOString(),
        })),
      },
    );
  }

  const booking = resolved.booking;
  if (!booking) {
    return failure(
      'notify_running_late',
      'No upcoming booking found to notify about.',
      { clarify: true },
    );
  }

  try {
    const result = await deps.publicCustomerBookingService.notifyRunningLate(
      slug,
      customerId,
      booking.id,
      { minutesLate: parsed.minutesLate },
    );

    const summary = buildCustomerRunningLateSuccessSummary(result.minutesLate);
    const staffSuffix = result.staffNotified
      ? ''
      : ' (Staff email alerts are off for this salon.)';

    return success('notify_running_late', `${summary}${staffSuffix}`, {
      bookingId: result.bookingId,
      minutesLate: result.minutesLate,
      notifiedAt: result.notifiedAt,
      staffNotified: result.staffNotified,
      customerRunningLate: result.customerRunningLate,
      serviceName: booking.service?.name ?? null,
      startTime: booking.startTime.toISOString(),
    });
  } catch (err: any) {
    return failure(
      'notify_running_late',
      err?.message ?? 'Could not notify the salon.',
      { bookingId: booking.id },
    );
  }
}
