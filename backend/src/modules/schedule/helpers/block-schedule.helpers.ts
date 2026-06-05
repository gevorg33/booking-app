export interface TimeRange {
  start: Date;
  end: Date;
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return (
    a.start.getTime() < b.end.getTime() && a.end.getTime() > b.start.getTime()
  );
}

/** Split a period into before / blocked / after segments relative to a block window. */
export function splitPeriodByBlock(
  period: TimeRange,
  block: TimeRange,
): {
  before: TimeRange | null;
  blocked: TimeRange | null;
  after: TimeRange | null;
} {
  if (!rangesOverlap(period, block)) {
    return { before: period, blocked: null, after: null };
  }

  const before =
    period.start.getTime() < block.start.getTime()
      ? {
          start: period.start,
          end: new Date(Math.min(block.start.getTime(), period.end.getTime())),
        }
      : null;

  const blocked = {
    start: new Date(Math.max(period.start.getTime(), block.start.getTime())),
    end: new Date(Math.min(period.end.getTime(), block.end.getTime())),
  };

  const after =
    block.end.getTime() < period.end.getTime()
      ? {
          start: new Date(
            Math.max(block.end.getTime(), period.start.getTime()),
          ),
          end: period.end,
        }
      : null;

  return {
    before:
      before && before.end.getTime() > before.start.getTime() ? before : null,
    blocked: blocked.end.getTime() > blocked.start.getTime() ? blocked : null,
    after: after && after.end.getTime() > after.start.getTime() ? after : null,
  };
}

export function buildUtcDateTime(dayIso: string, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(`${dayIso}T00:00:00.000Z`);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

export function dayIsoFromDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getDaysInRange(
  startDate: Date,
  endDate: Date,
  repeatWeeksCount = 1,
): Date[] {
  const days: Date[] = [];
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);
  const finalEnd = new Date(end);
  finalEnd.setUTCDate(
    finalEnd.getUTCDate() + Math.max(0, repeatWeeksCount - 1) * 7,
  );

  const current = new Date(start);
  while (current.getTime() <= finalEnd.getTime()) {
    days.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return days;
}

export function isWeekdayActive(
  day: Date,
  flags: Record<string, boolean | undefined>,
): boolean {
  const map = [
    flags.isActiveOnSunday,
    flags.isActiveOnMonday,
    flags.isActiveOnTuesday,
    flags.isActiveOnWednesday,
    flags.isActiveOnThursday,
    flags.isActiveOnFriday,
    flags.isActiveOnSaturday,
  ];
  return !!map[day.getUTCDay()];
}

export function periodsCanMerge(
  a: {
    endTime: Date;
    serviceIds: string[] | null;
    maxAppointmentCount: number;
    placeholderLabel: string | null;
    type: string;
  },
  b: {
    startTime: Date;
    serviceIds: string[] | null;
    maxAppointmentCount: number;
    placeholderLabel: string | null;
    type: string;
  },
): boolean {
  if (a.type !== b.type) return false;
  if (a.endTime.getTime() !== b.startTime.getTime()) return false;
  if ((a.maxAppointmentCount ?? 1) !== (b.maxAppointmentCount ?? 1))
    return false;
  if ((a.placeholderLabel ?? '') !== (b.placeholderLabel ?? '')) return false;
  const aIds = [...(a.serviceIds ?? [])].sort().join(',');
  const bIds = [...(b.serviceIds ?? [])].sort().join(',');
  return aIds === bIds;
}
