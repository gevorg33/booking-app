/** adopt-4.4 — resolve per-service rebooking cadence and due dates. */

export const SERVICE_REBOOKING_CADENCE_METADATA_KEY = 'rebookingCadenceDays';

export interface ServiceRebookingCadenceSource {
  metadata?: Record<string, unknown> | null;
}

export interface RebookingCadenceSettings {
  defaultRebookingCadenceDays: number;
}

export function readServiceRebookingCadenceDays(
  service: ServiceRebookingCadenceSource,
): number | null {
  const raw = service.metadata?.[SERVICE_REBOOKING_CADENCE_METADATA_KEY];
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return clampCadenceDays(raw);
  }
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number.parseInt(raw.trim(), 10);
    if (Number.isFinite(parsed)) return clampCadenceDays(parsed);
  }
  return null;
}

export function resolveServiceRebookingCadenceDays(
  service: ServiceRebookingCadenceSource,
  settings: RebookingCadenceSettings,
): number | null {
  const fromService = readServiceRebookingCadenceDays(service);
  if (fromService != null) return fromService;
  return clampCadenceDays(settings.defaultRebookingCadenceDays);
}

export function clampCadenceDays(days: number): number {
  return Math.max(7, Math.min(365, Math.round(days)));
}

/** True when `now` is on/after due date and still within the nudge window. */
export function isRebookingNudgeDue(
  lastCompletedAt: Date,
  cadenceDays: number,
  now: Date,
  windowDays = 3,
): boolean {
  const dueAt = computeRebookingDueDate(lastCompletedAt, cadenceDays);
  const windowEnd = new Date(dueAt);
  windowEnd.setDate(windowEnd.getDate() + windowDays);
  return now >= dueAt && now <= windowEnd;
}

export function computeRebookingDueDate(
  lastCompletedAt: Date,
  cadenceDays: number,
): Date {
  const due = new Date(lastCompletedAt);
  due.setDate(due.getDate() + clampCadenceDays(cadenceDays));
  due.setHours(0, 0, 0, 0);
  return due;
}

export function formatRebookingCadenceLabel(cadenceDays: number): string {
  if (cadenceDays % 7 === 0) {
    const weeks = cadenceDays / 7;
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  return cadenceDays === 1 ? '1 day' : `${cadenceDays} days`;
}
