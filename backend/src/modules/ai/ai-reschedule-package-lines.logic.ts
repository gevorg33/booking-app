import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { PublicCustomerBookingService } from '../public-booking/public-customer-booking.service.js';
import type { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import type { CommandResult } from './command-completion.types.js';
import { buildUtcStartTimeFromDayAndTime } from '../../common/utils/date-format.util.js';
import {
  buildReschedulePackageLinesAmbiguousSummary,
  buildReschedulePackageLinesNavigate,
  parseReschedulePackageLinesFromPrompt,
} from './ai-reschedule-package-lines.util.js';

const TERMINAL_PACKAGE_VISIT_STATUSES = new Set([
  'cancelled',
  'completed',
  'no_show',
]);

export interface ReschedulePackageLinesLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  publicCustomerBookingService: Pick<
    PublicCustomerBookingService,
    'reschedulePackageVisit'
  >;
  publicCustomerAuthService: Pick<PublicCustomerAuthService, 'listBookings'>;
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
  deps: ReschedulePackageLinesLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

function shiftVisitToDate(
  startTime: string,
  dayValue: string,
  overrideTimeSlot?: string,
): string {
  const original = new Date(startTime);
  const hh = String(original.getUTCHours()).padStart(2, '0');
  const mm = String(original.getUTCMinutes()).padStart(2, '0');
  const timeSlot = overrideTimeSlot ?? `${hh}:${mm}`;
  return buildUtcStartTimeFromDayAndTime(dayValue, timeSlot);
}

export async function handleReschedulePackageLinesLogic(
  deps: ReschedulePackageLinesLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const effectivePrompt = String(prompt || params._prompt || '');
  const timeZone = String(params._timeZone ?? 'UTC');
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'reschedule_package_lines',
      'Sign in to reschedule your package visits.',
      { clarify: true, missing: ['customerId'] },
    );
  }

  const parsed = parseReschedulePackageLinesFromPrompt(
    effectivePrompt,
    params,
    timeZone,
  );
  if (!parsed) {
    return failure(
      'reschedule_package_lines',
      'Say which visit numbers to move, e.g. "Move visits 2 and 3 to next week".',
      { clarify: true, missing: ['visitIndexes'] },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('reschedule_package_lines', 'Business not found.');

  const { bookings } = await deps.publicCustomerAuthService.listBookings(
    slug,
    customerId,
  );
  const now = new Date();
  let candidates = bookings.filter(
    (row) =>
      row.packagePurchaseId &&
      !TERMINAL_PACKAGE_VISIT_STATUSES.has(row.status.toLowerCase()) &&
      new Date(row.startTime) >= now,
  );

  if (parsed.bookingId) {
    const anchor =
      candidates.find((row) => row.id === parsed.bookingId) ??
      candidates.find((row) => row.id.startsWith(parsed.bookingId!));
    candidates = anchor
      ? candidates.filter(
          (row) => row.packagePurchaseId === anchor.packagePurchaseId,
        )
      : [];
  } else if (parsed.packageName) {
    const needle = parsed.packageName.toLowerCase();
    candidates = candidates.filter((row) =>
      (row.packageName ?? row.serviceName ?? '').toLowerCase().includes(needle),
    );
  }

  const byPurchase = new Map<string, typeof candidates>();
  for (const row of candidates) {
    const key = row.packagePurchaseId!;
    const rows = byPurchase.get(key) ?? [];
    rows.push(row);
    byPurchase.set(key, rows);
  }

  if (byPurchase.size === 0) {
    return failure(
      'reschedule_package_lines',
      'No matching upcoming package visits found.',
      { clarify: true, navigate: buildReschedulePackageLinesNavigate() },
    );
  }
  if (byPurchase.size > 1) {
    const names = [...byPurchase.values()].map(
      (rows) => rows[0].packageName ?? rows[0].serviceName ?? 'Package',
    );
    return failure(
      'reschedule_package_lines',
      buildReschedulePackageLinesAmbiguousSummary(names),
      { clarify: true, missing: ['packageName'] },
    );
  }

  const [purchaseRows] = [...byPurchase.values()];
  const sorted = [...purchaseRows].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const selected = parsed.visitIndexes.map((index) => sorted[index - 1]);
  const missingIndexes = parsed.visitIndexes.filter(
    (index) => !sorted[index - 1],
  );
  if (missingIndexes.length) {
    return failure(
      'reschedule_package_lines',
      `Couldn't find visit ${missingIndexes.join(', ')} in this package — it has ${sorted.length} upcoming visit(s).`,
      { clarify: true, availableVisitCount: sorted.length },
    );
  }

  if (!parsed.date) {
    return success(
      'reschedule_package_lines',
      'Choose a new date for the selected package visits.',
      {
        clarify: true,
        visitIndexes: parsed.visitIndexes,
        bookingIds: selected.map((row) => row!.id),
        navigate: buildReschedulePackageLinesNavigate(selected[0]?.id),
      },
    );
  }

  const lines = selected.map((row) => ({
    bookingId: row!.id,
    startTime: shiftVisitToDate(row!.startTime, parsed.date!, parsed.timeSlot),
    employeeId: row!.employeeId,
  }));

  try {
    const { bookings: rescheduled, previousStartTime } =
      await deps.publicCustomerBookingService.reschedulePackageVisit(
        slug,
        customerId,
        selected[0]!.id,
        { lines },
      );
    return success(
      'reschedule_package_lines',
      `Moved ${lines.length} package visit(s) to their new times.`,
      {
        bookingIds: rescheduled.map((row) => row.id),
        previousStartTime,
        visitIndexes: parsed.visitIndexes,
        navigate: buildReschedulePackageLinesNavigate(selected[0]!.id),
      },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Could not reschedule these package visits.';
    return failure('reschedule_package_lines', message, {
      bookingIds: selected.map((row) => row!.id),
    });
  }
}
