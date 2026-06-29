export type BookingTimeOfDayGroup = 'morning' | 'afternoon' | 'evening';

export const BOOKING_TIME_OF_DAY_ORDER: BookingTimeOfDayGroup[] = [
  'morning',
  'afternoon',
  'evening',
];

/** Wall-clock minutes from ISO slot time (UTC hour/minute = business wall time). */
export function slotWallClockMinutes(startTime: string): number {
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return 0;
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function resolveBookingTimeOfDayGroup(startTime: string): BookingTimeOfDayGroup {
  const minutes = slotWallClockMinutes(startTime);
  if (minutes < 12 * 60) return 'morning';
  if (minutes < 17 * 60) return 'afternoon';
  return 'evening';
}

export function groupSlotsByTimeOfDay<T extends { startTime: string }>(
  slots: readonly T[],
): Array<{ group: BookingTimeOfDayGroup; slots: T[] }> {
  const buckets: Record<BookingTimeOfDayGroup, T[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const slot of slots) {
    buckets[resolveBookingTimeOfDayGroup(slot.startTime)].push(slot);
  }
  return BOOKING_TIME_OF_DAY_ORDER.filter((group) => buckets[group].length > 0).map((group) => ({
    group,
    slots: buckets[group],
  }));
}
