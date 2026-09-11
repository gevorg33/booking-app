import type { Repository } from 'typeorm';
import type {
  EntityFinder,
  EntityReader,
} from './ai-logic-repo.types.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { PublicCustomerBookingService } from '../public-booking/public-customer-booking.service.js';
import type { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import type { PublicCustomerBookingItem } from '../public-booking/public-customer-auth.types.js';
import type { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildReschedulePackageVisitSelfAmbiguousSummary,
  buildReschedulePackageVisitSelfNavigate,
  enrichReschedulePackageVisitSelfParamsFromPrompt,
  isReschedulePackageVisitSelfPrompt,
  matchCustomerOwnedPackageVisit,
  parseReschedulePackageVisitSelfFromPrompt,
} from './ai-reschedule-package-visit-self.util.js';
import {
  buildPackageVisitLinesFromTarget,
  type PackageVisitLineSource,
} from './ai-package-visit-lines.util.js';
import { buildUtcStartTimeFromDayAndTime } from '../../common/utils/date-format.util.js';

const TERMINAL_PACKAGE_VISIT_STATUSES = new Set([
  'cancelled',
  'completed',
  'no_show',
]);

export interface ReschedulePackageVisitSelfLogicDeps {
  businessRepo: EntityReader<Business>;
  publicCustomerBookingService: Pick<
    PublicCustomerBookingService,
    'reschedulePackageVisit'
  >;
  publicCustomerAuthService: Pick<PublicCustomerAuthService, 'listBookings'>;
  serviceRepo: EntityFinder<Service>;
  multiServiceBookingsService: Pick<
    MultiServiceBookingsService,
    'resolveSettingsFromBusiness'
  >;
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  return (
    (params.sessionCustomerId as string | undefined) ??
    (params.customerId as string | undefined)
  );
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
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

async function resolveBusinessSlug(
  deps: ReschedulePackageVisitSelfLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

export async function handleReschedulePackageVisitSelfLogic(
  deps: ReschedulePackageVisitSelfLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const effectivePrompt = String(prompt || params._prompt || '');
  const timeZone = String(params._timeZone ?? 'UTC');
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'reschedule_package_visit_self',
      'Sign in to reschedule your package visit.',
      { clarify: true, missing: ['customerId'] },
    );
  }

  const enriched = enrichReschedulePackageVisitSelfParamsFromPrompt(
    params,
    effectivePrompt,
    timeZone,
  );
  const hasExplicitTarget = Boolean(
    enriched.bookingId || enriched.packageName || enriched.visitIndex != null,
  );

  if (
    effectivePrompt &&
    effectivePrompt !== 'reschedule_package_visit_self' &&
    !hasExplicitTarget &&
    !parseReschedulePackageVisitSelfFromPrompt(
      effectivePrompt,
      enriched,
      timeZone,
    )
  ) {
    return failure(
      'reschedule_package_visit_self',
      'Say which package visit to move — for example "Move package visit 3 to next week" or "Reschedule my spa day".',
      { clarify: true },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) {
    return failure('reschedule_package_visit_self', 'Business not found.');
  }

  const { bookings } = await deps.publicCustomerAuthService.listBookings(
    slug,
    customerId,
  );
  const matched = matchCustomerOwnedPackageVisit(bookings, enriched);

  if (matched.ambiguous.length > 1) {
    return failure(
      'reschedule_package_visit_self',
      buildReschedulePackageVisitSelfAmbiguousSummary(matched.ambiguous),
      {
        clarify: true,
        missing: ['bookingId'],
        candidates: matched.ambiguous.map((row) => ({
          bookingId: row.id,
          packageName: row.packageName ?? row.serviceName ?? null,
          startTime: row.startTime,
          visitIndex: enriched.visitIndex ?? null,
        })),
        navigate: buildReschedulePackageVisitSelfNavigate(),
      },
    );
  }

  const booking = matched.booking;
  if (!booking) {
    return failure(
      'reschedule_package_visit_self',
      'No upcoming package visit found to reschedule.',
      {
        clarify: true,
        navigate: buildReschedulePackageVisitSelfNavigate(),
      },
    );
  }

  let lines = Array.isArray(enriched.lines) ? enriched.lines : undefined;

  if (!lines?.length) {
    const targetStartTime =
      (enriched.startTime as string | undefined) ??
      (enriched.date
        ? buildUtcStartTimeFromDayAndTime(
            enriched.date as string,
            (enriched.timeSlot as string | undefined) ?? '09:00',
          )
        : undefined);

    if (targetStartTime && booking.packagePurchaseId) {
      const visitBookings: PackageVisitLineSource[] = bookings
        .filter(
          (row) =>
            row.packagePurchaseId === booking.packagePurchaseId &&
            !TERMINAL_PACKAGE_VISIT_STATUSES.has(row.status.toLowerCase()),
        )
        .map((row) => ({
          bookingId: row.id,
          serviceId: row.serviceId,
          employeeId: row.employeeId,
          startTime: row.startTime,
        }));
      lines = await buildPackageVisitLinesFromTarget(
        deps,
        businessId,
        visitBookings,
        targetStartTime,
      );
    }
  }

  if (!lines?.length) {
    return success(
      'reschedule_package_visit_self',
      'Choose a new time block for your package visit.',
      {
        bookingId: booking.id,
        clarify: true,
        requestedDate: enriched.date ?? null,
        requestedTimeSlot: enriched.timeSlot ?? null,
        navigate: buildReschedulePackageVisitSelfNavigate(booking.id),
      },
    );
  }

  try {
    const { bookings: rescheduled, previousStartTime } =
      await deps.publicCustomerBookingService.reschedulePackageVisit(
        slug,
        customerId,
        booking.id,
        { lines },
      );
    return success(
      'reschedule_package_visit_self',
      'Package visit rescheduled.',
      {
        bookingIds: rescheduled.map((row) => row.id),
        previousStartTime,
        packagePurchaseId: booking.packagePurchaseId ?? null,
        navigate: buildReschedulePackageVisitSelfNavigate(booking.id),
      },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Could not reschedule package visit.';
    return failure('reschedule_package_visit_self', message, {
      bookingId: booking.id,
    });
  }
}

export function assertReschedulePackageVisitSelfPrompt(
  prompt: string,
): boolean {
  return isReschedulePackageVisitSelfPrompt(prompt);
}
