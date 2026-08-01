/**
 * e2e-bug.254 — public availability is empty when a service is assigned only to
 * staff whose schedule has ended (past one-off blocks), while other salon staff
 * still have hours for other services.
 *
 * Pure helpers: diagnose the gap, project the last matching SERVICE_BLOCK pattern
 * onto future same-weekday date keys, and build 10-minute micro-slot payloads.
 */

export const E2E254_EMPTY_REASON_ASSIGNED_UNSCHEDULED =
  'assigned_providers_unscheduled' as const;

export type E2e254EmptyReason = typeof E2E254_EMPTY_REASON_ASSIGNED_UNSCHEDULED;

export type E2e254ServiceBlockPattern = {
  /** Minutes from UTC midnight. */
  startMinute: number;
  endMinute: number;
  serviceIds: string[] | null;
  maxAppointmentCount: number;
  /** JS getUTCDay() of the source period (0=Sun … 6=Sat). */
  utcDayOfWeek: number;
};

export type E2e254ProjectedDay = {
  dateKey: string;
  patterns: Array<{
    startTime: Date;
    endTime: Date;
    serviceIds: string[] | null;
    maxAppointmentCount: number;
  }>;
};

const MICRO_SLOT_MINUTES = 10;

export function periodAllowsService(
  serviceIds: string[] | null | undefined,
  serviceId: string,
): boolean {
  if (!serviceIds?.length) return true;
  return serviceIds.includes(serviceId);
}

export function extractServiceBlockPatterns(
  periods: Array<{
    startTime: Date;
    endTime: Date;
    serviceIds?: string[] | null;
    maxAppointmentCount?: number | null;
    type?: string;
  }>,
  serviceId: string,
): E2e254ServiceBlockPattern[] {
  const patterns: E2e254ServiceBlockPattern[] = [];
  for (const period of periods) {
    if (period.type && period.type !== 'service_block') continue;
    if (!periodAllowsService(period.serviceIds, serviceId)) continue;
    const start = period.startTime;
    const end = period.endTime;
    patterns.push({
      startMinute: start.getUTCHours() * 60 + start.getUTCMinutes(),
      endMinute: end.getUTCHours() * 60 + end.getUTCMinutes(),
      serviceIds: period.serviceIds?.length ? [...period.serviceIds] : null,
      maxAppointmentCount: period.maxAppointmentCount || 1,
      utcDayOfWeek: start.getUTCDay(),
    });
  }
  return patterns;
}

/** Same-weekday date keys in [fromKey, toKey] after `notBeforeKey` (exclusive of past). */
export function listFutureSameWeekdayDateKeys(
  utcDayOfWeek: number,
  fromKey: string,
  toKey: string,
  notBeforeKey: string,
): string[] {
  const keys: string[] = [];
  const cursor = new Date(`${fromKey}T00:00:00.000Z`);
  const end = new Date(`${toKey}T00:00:00.000Z`);
  const min = new Date(`${notBeforeKey}T00:00:00.000Z`);
  while (cursor <= end) {
    if (cursor.getUTCDay() === utcDayOfWeek && cursor > min) {
      keys.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

export function projectPatternsOntoDateKeys(
  patterns: E2e254ServiceBlockPattern[],
  dateKeys: string[],
): E2e254ProjectedDay[] {
  if (patterns.length === 0 || dateKeys.length === 0) return [];
  const byDay = new Map<number, E2e254ServiceBlockPattern[]>();
  for (const pattern of patterns) {
    const list = byDay.get(pattern.utcDayOfWeek) ?? [];
    list.push(pattern);
    byDay.set(pattern.utcDayOfWeek, list);
  }

  const projected: E2e254ProjectedDay[] = [];
  for (const dateKey of dateKeys) {
    const day = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
    const dayPatterns = byDay.get(day);
    if (!dayPatterns?.length) continue;
    projected.push({
      dateKey,
      patterns: dayPatterns.map((pattern) => {
        const startTime = new Date(`${dateKey}T00:00:00.000Z`);
        startTime.setUTCMinutes(pattern.startMinute);
        const endTime = new Date(`${dateKey}T00:00:00.000Z`);
        endTime.setUTCMinutes(pattern.endMinute);
        return {
          startTime,
          endTime,
          serviceIds: pattern.serviceIds,
          maxAppointmentCount: pattern.maxAppointmentCount,
        };
      }),
    });
  }
  return projected;
}

export function buildMicroSlotsForServiceBlock(input: {
  businessId: string;
  employeeId: string;
  startTime: Date;
  endTime: Date;
  serviceIds: string[] | null;
  maxAppointmentCount: number;
}): Array<{
  businessId: string;
  employeeId: string;
  startTime: Date;
  endTime: Date;
  status: 'available';
  serviceId: string | undefined;
  serviceIds: string[] | null;
  maxAppointmentCount: number;
  appointmentCount: number;
}> {
  const slots: Array<{
    businessId: string;
    employeeId: string;
    startTime: Date;
    endTime: Date;
    status: 'available';
    serviceId: string | undefined;
    serviceIds: string[] | null;
    maxAppointmentCount: number;
    appointmentCount: number;
  }> = [];
  const stepMs = MICRO_SLOT_MINUTES * 60_000;
  let current = input.startTime.getTime();
  const periodEnd = input.endTime.getTime();
  const validIds = input.serviceIds?.filter(Boolean) ?? [];
  while (current + stepMs <= periodEnd) {
    const startTime = new Date(current);
    const endTime = new Date(current + stepMs);
    slots.push({
      businessId: input.businessId,
      employeeId: input.employeeId,
      startTime,
      endTime,
      status: 'available',
      serviceId: validIds[0] || undefined,
      serviceIds: validIds.length > 0 ? validIds : null,
      maxAppointmentCount: input.maxAppointmentCount || 1,
      appointmentCount: 0,
    });
    current += stepMs;
  }
  return slots;
}

export function diagnoseAssignedProvidersUnscheduled(input: {
  assignedEmployeeCount: number;
  assignedWithFutureSlots: number;
  datesFound: number;
}): E2e254EmptyReason | null {
  if (input.datesFound > 0) return null;
  if (
    input.assignedEmployeeCount > 0 &&
    input.assignedWithFutureSlots === 0
  ) {
    return E2E254_EMPTY_REASON_ASSIGNED_UNSCHEDULED;
  }
  return null;
}

/** e2e-bug.273 — index ephemeral projected start times without persisting. */
export function projectedStartTimesKey(
  employeeId: string,
  dateKey: string,
): string {
  return `${employeeId}\0${dateKey}`;
}

export function indexProjectedMicroSlotStartTimes(
  plans: Array<{
    employeeId: string;
    dateKey: string;
    slots: Array<{ startTime: Date }>;
  }>,
): Map<string, Date[]> {
  const map = new Map<string, Date[]>();
  for (const plan of plans) {
    const key = projectedStartTimesKey(plan.employeeId, plan.dateKey);
    const times = plan.slots.map((s) => s.startTime);
    const existing = map.get(key) ?? [];
    map.set(key, existing.concat(times));
  }
  return map;
}

export function startTimeMatchesProjection(
  projected: Map<string, Date[]>,
  employeeId: string,
  startTime: Date,
): boolean {
  const dateKey = startTime.toISOString().slice(0, 10);
  const times = projected.get(projectedStartTimesKey(employeeId, dateKey));
  if (!times?.length) return false;
  const target = startTime.getTime();
  return times.some((t) => t.getTime() === target);
}
