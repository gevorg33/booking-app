const LOCALE_WALL_CLOCK_TIMEZONES: Record<string, string> = {
  hy: 'Asia/Yerevan',
};

function resolveTimezone(tz?: string | null): string {
  if (!tz || tz.trim() === '') return 'UTC';
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

/** Match backend resolveBusinessWallClockTimezone for client-side slot filtering. */
export function resolveBusinessWallClockTimezone(
  timezone?: string | null,
  locale?: string | null,
): string {
  const tz = resolveTimezone(timezone);
  if (tz !== 'UTC') return tz;
  const loc = locale?.trim().toLowerCase();
  if (loc && LOCALE_WALL_CLOCK_TIMEZONES[loc]) {
    return LOCALE_WALL_CLOCK_TIMEZONES[loc];
  }
  return 'UTC';
}

function wallClockMinutesFromTimeSlot(timeSlot: string): number {
  const [h, m] = timeSlot.split(':').map((part) => parseInt(part, 10));
  return h * 60 + (m ?? 0);
}

export function getWallClockNow(timeZone: string): {
  dateKey: string;
  minutes: number;
} {
  const tz = resolveTimezone(timeZone);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(
    parts.find((p) => p.type === 'minute')?.value ?? '0',
    10,
  );
  return {
    dateKey: `${year}-${month}-${day}`,
    minutes: hour * 60 + minute,
  };
}

export function scheduleTimeFromIso(isoStartTime: string): string {
  const d = new Date(isoStartTime);
  if (Number.isNaN(d.getTime())) return isoStartTime;
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export function isWallClockSlotBookable(
  isoDay: string,
  timeSlot: string,
  timeZone: string,
  notBeforeTime?: string | null,
): boolean {
  const now = getWallClockNow(timeZone);
  const slotMin = wallClockMinutesFromTimeSlot(timeSlot);
  const notBeforeMin = notBeforeTime
    ? wallClockMinutesFromTimeSlot(notBeforeTime)
    : null;

  if (isoDay < now.dateKey) return false;

  if (isoDay === now.dateKey) {
    const minExclusive = Math.max(now.minutes, notBeforeMin ?? -1);
    return slotMin > minExclusive;
  }

  if (notBeforeMin != null) return slotMin >= notBeforeMin;
  return true;
}

export function isWallClockStartBookable(
  isoStartTime: string,
  timeZone: string,
  notBeforeTime?: string | null,
): boolean {
  const d = new Date(isoStartTime);
  if (Number.isNaN(d.getTime())) return false;
  const isoDay = d.toISOString().split('T')[0];
  return isWallClockSlotBookable(
    isoDay,
    scheduleTimeFromIso(isoStartTime),
    timeZone,
    notBeforeTime,
  );
}

export function filterBookableWallClockSlots<T extends { startTime: string }>(
  slots: T[],
  timeZone: string,
  notBeforeTime?: string | null,
): T[] {
  return slots.filter((slot) =>
    isWallClockStartBookable(slot.startTime, timeZone, notBeforeTime),
  );
}
