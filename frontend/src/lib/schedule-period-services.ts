import { isValidTime24, normalizeTime24 } from '@/lib/time-format';

export interface SchedulePeriod {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  serviceIds?: string[] | null;
}

/** Find the service_block period that covers a given day + start time (UTC). */
export function findServicePeriodAtTime(
  periods: SchedulePeriod[],
  dayISO: string,
  timeHHmm: string,
): SchedulePeriod | null {
  if (!dayISO || !timeHHmm || !isValidTime24(timeHHmm)) return null;
  const snapped = normalizeTime24(timeHHmm);
  const instantMs = new Date(`${dayISO}T${snapped}:00.000Z`).getTime();
  if (Number.isNaN(instantMs)) return null;

  return (
    periods.find(
      (p) =>
        p.type === 'service_block' &&
        new Date(p.startTime).getTime() <= instantMs &&
        new Date(p.endTime).getTime() > instantMs,
    ) ?? null
  );
}

/** Services allowed for a schedule period (and optional employee assignment). */
export function servicesForSchedulePeriod<T extends { id: string; name: string }>(
  allServices: T[],
  period: SchedulePeriod | null,
  employeeServiceIds?: string[] | null,
): T[] {
  let list = allServices;

  if (employeeServiceIds?.length) {
    const employeeAllowed = new Set(employeeServiceIds);
    list = list.filter((s) => employeeAllowed.has(s.id));
  }

  if (!period) return list;

  const periodIds = period.serviceIds;
  if (!periodIds?.length) return list;

  return list.filter((s) => periodIds.includes(s.id));
}
