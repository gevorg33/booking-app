/** adopt-6.5 — learn per-customer rebooking interval from completed bookings. */

import {
  clampCadenceDays,
  resolveServiceRebookingCadenceDays,
  type RebookingCadenceSettings,
  type ServiceRebookingCadenceSource,
} from './service-rebooking-cadence.util.js';

export const CUSTOMER_REBOOKING_CADENCE_METADATA_KEY = 'learnedRebookingCadenceDays';
export const CUSTOMER_REBOOKING_CADENCE_BY_SERVICE_METADATA_KEY =
  'learnedRebookingCadenceByService';

export interface CompletedBookingInterval {
  completedAt: Date;
  previousCompletedAt?: Date | null;
}

export function computeMedianRebookingIntervalDays(
  intervals: CompletedBookingInterval[],
): number | null {
  const dayGaps: number[] = [];
  for (const row of intervals) {
    if (!row.previousCompletedAt) continue;
    const deltaMs = row.completedAt.getTime() - row.previousCompletedAt.getTime();
    const days = Math.round(deltaMs / (24 * 60 * 60 * 1000));
    if (days >= 7 && days <= 365) dayGaps.push(days);
  }
  if (dayGaps.length === 0) return null;
  dayGaps.sort((a, b) => a - b);
  const mid = Math.floor(dayGaps.length / 2);
  return dayGaps.length % 2 === 0
    ? Math.round((dayGaps[mid - 1]! + dayGaps[mid]!) / 2)
    : dayGaps[mid]!;
}

export function readCustomerLearnedCadenceDays(
  metadata?: Record<string, unknown> | null,
): number | null {
  return parseCadenceDays(metadata?.[CUSTOMER_REBOOKING_CADENCE_METADATA_KEY]);
}

function parseCadenceDays(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return clampCadenceDays(raw);
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number.parseInt(raw.trim(), 10);
    if (Number.isFinite(parsed)) return clampCadenceDays(parsed);
  }
  return null;
}

export function readCustomerServiceLearnedCadenceDays(
  metadata: Record<string, unknown> | null | undefined,
  serviceId: string,
): number | null {
  const byService = metadata?.[CUSTOMER_REBOOKING_CADENCE_BY_SERVICE_METADATA_KEY];
  if (byService && typeof byService === 'object' && !Array.isArray(byService)) {
    const fromService = parseCadenceDays(
      (byService as Record<string, unknown>)[serviceId],
    );
    if (fromService != null) return fromService;
  }
  return readCustomerLearnedCadenceDays(metadata);
}

export function resolveCustomerRebookingCadenceDays(input: {
  service: ServiceRebookingCadenceSource;
  settings: RebookingCadenceSettings;
  customerMetadata?: Record<string, unknown> | null;
  serviceId?: string;
  learnedFromHistory?: number | null;
}): number | null {
  const learned =
    input.learnedFromHistory ??
    (input.serviceId
      ? readCustomerServiceLearnedCadenceDays(input.customerMetadata, input.serviceId)
      : readCustomerLearnedCadenceDays(input.customerMetadata));
  if (learned != null) return learned;
  return resolveServiceRebookingCadenceDays(input.service, input.settings);
}

export function buildLearnedCadenceMetadataUpdate(days: number): Record<string, number> {
  return { [CUSTOMER_REBOOKING_CADENCE_METADATA_KEY]: clampCadenceDays(days) };
}

export function mergeLearnedCadenceByServiceMetadata(
  metadata: Record<string, unknown> | null | undefined,
  serviceId: string,
  days: number,
): Record<string, unknown> {
  const existingByService =
    metadata?.[CUSTOMER_REBOOKING_CADENCE_BY_SERVICE_METADATA_KEY];
  const byService =
    existingByService &&
    typeof existingByService === 'object' &&
    !Array.isArray(existingByService)
      ? { ...(existingByService as Record<string, number>) }
      : {};
  byService[serviceId] = clampCadenceDays(days);
  return {
    ...(metadata ?? {}),
    [CUSTOMER_REBOOKING_CADENCE_BY_SERVICE_METADATA_KEY]: byService,
  };
}

export function learnCustomerServiceCadenceDaysFromCompletedBookings(
  completed: Array<{ endTime: Date }>,
): number | null {
  if (completed.length < 2) return null;
  const intervals = completed
    .map((booking, index) => ({
      completedAt: booking.endTime,
      previousCompletedAt:
        index + 1 < completed.length ? completed[index + 1]!.endTime : null,
    }))
    .filter((row) => row.previousCompletedAt != null)
    .map((row) => ({
      completedAt: row.completedAt,
      previousCompletedAt: row.previousCompletedAt,
    }));
  return computeMedianRebookingIntervalDays(intervals);
}
