import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import {
  buildPackageVisitLinesFromTarget,
  type PackageVisitLineSource,
} from './ai-package-visit-lines.util.js';
import {
  enrichRescheduleWithTokenParamsFromPrompt,
  resolveManageBookingCredentials,
} from './ai-manage-booking-with-token.util.js';
import { buildUtcStartTimeFromDayAndTime } from '../../common/utils/date-format.util.js';

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
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
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

function requireCredentials(
  action: string,
  params: Record<string, any>,
  prompt: string,
): { bookingId: string; manageToken: string } | CommandResult {
  const { bookingId, manageToken } = resolveManageBookingCredentials(
    params,
    prompt,
  );
  if (!bookingId || !manageToken) {
    return failure(
      action,
      'Share the manage link for this booking first, so I can look it up.',
      {
        clarify: true,
        missing: [
          ...(bookingId ? [] : ['bookingId']),
          ...(manageToken ? [] : ['manageToken']),
        ],
      },
    );
  }
  return { bookingId, manageToken };
}

export async function handleCancelBookingWithTokenLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any> = {},
  prompt = '',
): Promise<CommandResult> {
  const effectivePrompt = prompt || String(params._prompt ?? '');
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure('cancel_booking_with_token', 'Business not found.');

  const creds = requireCredentials(
    'cancel_booking_with_token',
    params,
    effectivePrompt,
  );
  if ('success' in creds) return creds;

  try {
    const { booking } = await deps.publicCustomerBookingService.cancelBookingWithToken(
      slug,
      creds.bookingId,
      creds.manageToken,
    );
    return success(
      'cancel_booking_with_token',
      `Cancelled your ${booking.service?.name ?? 'appointment'} — you're all set.`,
      { bookingId: booking.id, status: booking.status },
    );
  } catch (err: any) {
    return failure(
      'cancel_booking_with_token',
      err?.message ?? 'Could not cancel this booking.',
      { bookingId: creds.bookingId },
    );
  }
}

export async function handleRescheduleBookingWithTokenLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any> = {},
  prompt = '',
): Promise<CommandResult> {
  const effectivePrompt = prompt || String(params._prompt ?? '');
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure('reschedule_booking_with_token', 'Business not found.');

  const timeZone = String(params._timeZone ?? 'UTC');
  const enriched = enrichRescheduleWithTokenParamsFromPrompt(
    params,
    effectivePrompt,
    timeZone,
  );

  const creds = requireCredentials(
    'reschedule_booking_with_token',
    enriched,
    effectivePrompt,
  );
  if ('success' in creds) return creds;

  const startTime =
    (enriched.startTime as string | undefined) ??
    (enriched.date
      ? buildUtcStartTimeFromDayAndTime(
          enriched.date as string,
          (enriched.timeSlot as string | undefined) ?? '09:00',
        )
      : undefined);
  if (!startTime) {
    return failure(
      'reschedule_booking_with_token',
      'What new date and time should I move this booking to?',
      { clarify: true, missing: ['startTime'], bookingId: creds.bookingId },
    );
  }

  try {
    const { booking } = await deps.publicCustomerBookingService.rescheduleBookingWithToken(
      slug,
      creds.bookingId,
      creds.manageToken,
      {
        startTime,
        employeeId: enriched.employeeId as string | undefined,
      },
    );
    return success(
      'reschedule_booking_with_token',
      `Moved your ${booking.service?.name ?? 'appointment'} — you're all set.`,
      { bookingId: booking.id, startTime: booking.startTime.toISOString() },
    );
  } catch (err: any) {
    return failure(
      'reschedule_booking_with_token',
      err?.message ?? 'Could not reschedule this booking.',
      { bookingId: creds.bookingId },
    );
  }
}

export async function handleCancelPackageVisitWithTokenLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any> = {},
  prompt = '',
): Promise<CommandResult> {
  const effectivePrompt = prompt || String(params._prompt ?? '');
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure('cancel_package_visit_with_token', 'Business not found.');

  const creds = requireCredentials(
    'cancel_package_visit_with_token',
    params,
    effectivePrompt,
  );
  if ('success' in creds) return creds;

  try {
    const { bookings } =
      await deps.publicCustomerBookingService.cancelPackageVisitWithToken(
        slug,
        creds.bookingId,
        creds.manageToken,
      );
    return success(
      'cancel_package_visit_with_token',
      `Cancelled your package visit (${bookings.length} service${bookings.length === 1 ? '' : 's'}) — you're all set.`,
      { bookingIds: bookings.map((b) => b.id) },
    );
  } catch (err: any) {
    return failure(
      'cancel_package_visit_with_token',
      err?.message ?? 'Could not cancel this package visit.',
      { bookingId: creds.bookingId },
    );
  }
}

export async function handleReschedulePackageVisitWithTokenLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any> = {},
  prompt = '',
): Promise<CommandResult> {
  const effectivePrompt = prompt || String(params._prompt ?? '');
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure(
      'reschedule_package_visit_with_token',
      'Business not found.',
    );

  const timeZone = String(params._timeZone ?? 'UTC');
  const enriched = enrichRescheduleWithTokenParamsFromPrompt(
    params,
    effectivePrompt,
    timeZone,
  );

  const creds = requireCredentials(
    'reschedule_package_visit_with_token',
    enriched,
    effectivePrompt,
  );
  if ('success' in creds) return creds;

  const targetStartTime =
    (enriched.startTime as string | undefined) ??
    (enriched.date
      ? buildUtcStartTimeFromDayAndTime(
          enriched.date as string,
          (enriched.timeSlot as string | undefined) ?? '09:00',
        )
      : undefined);
  if (!targetStartTime) {
    return failure(
      'reschedule_package_visit_with_token',
      'What new date and time should I move this package visit to?',
      { clarify: true, missing: ['startTime'], bookingId: creds.bookingId },
    );
  }

  try {
    const context = await deps.publicCustomerBookingService.getManageContext(
      slug,
      creds.bookingId,
      creds.manageToken,
    );
    const appointments = context.packageVisit?.appointments ?? [
      {
        bookingId: context.bookingId,
        serviceId: context.serviceId,
        employeeId: context.employeeId,
        startTime: context.startTime,
      },
    ];
    const visitBookings: PackageVisitLineSource[] = appointments.map(
      (a: any) => ({
        bookingId: a.bookingId,
        serviceId: a.serviceId,
        employeeId: a.employeeId,
        startTime: a.startTime,
      }),
    );
    const lines = await buildPackageVisitLinesFromTarget(
      deps,
      businessId,
      visitBookings,
      targetStartTime,
    );

    const { bookings, previousStartTime } =
      await deps.publicCustomerBookingService.reschedulePackageVisitWithToken(
        slug,
        creds.bookingId,
        creds.manageToken,
        { lines },
      );
    return success(
      'reschedule_package_visit_with_token',
      `Moved your package visit (${bookings.length} service${bookings.length === 1 ? '' : 's'}) — you're all set.`,
      {
        bookingIds: bookings.map((b) => b.id),
        previousStartTime,
      },
    );
  } catch (err: any) {
    return failure(
      'reschedule_package_visit_with_token',
      err?.message ?? 'Could not reschedule this package visit.',
      { bookingId: creds.bookingId },
    );
  }
}
