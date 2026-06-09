import type { PublicServiceDaySlots } from './types.js';

export const SERVICE_BOOKABLE_DATE_SCAN_DAYS = 120;

export function isoToDateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const next = new Date(Date.UTC(year!, month! - 1, day! + days));
  return next.toISOString().slice(0, 10);
}

export function buildDateKeyRange(startDateKey: string, dayCount: number): string[] {
  const keys: string[] = [];
  for (let index = 0; index < dayCount; index += 1) {
    keys.push(addDaysToDateKey(startDateKey, index));
  }
  return keys;
}

export function dateKeysForMonth(year: number, month: number): string[] {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const keys: string[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    keys.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    );
  }
  return keys;
}

export function dayHasBookableSlots(
  daySlots: Pick<PublicServiceDaySlots, 'slots' | 'remainingSpots'>,
  isDayLevelTour: boolean,
): boolean {
  if (daySlots.slots.length === 0) return false;
  if (isDayLevelTour && daySlots.remainingSpots != null && daySlots.remainingSpots <= 0) {
    return false;
  }
  return true;
}

export function buildServiceDateEnabled(input: {
  bookableDates: ReadonlySet<string>;
  scannedDates: ReadonlySet<string>;
  minDateKey: string;
}): (isoDate: string) => boolean {
  const minDateKey = input.minDateKey.slice(0, 10);
  return (isoDate: string) => {
    const dateKey = isoToDateKey(isoDate);
    if (dateKey < minDateKey) return false;
    if (!input.scannedDates.has(dateKey)) return false;
    return input.bookableDates.has(dateKey);
  };
}

export function pickFirstBookableDateKey(
  bookableDates: ReadonlySet<string>,
  minDateKey: string,
): string | null {
  const sorted = [...bookableDates].sort();
  return sorted.find((dateKey) => dateKey >= minDateKey.slice(0, 10)) ?? null;
}

export async function mapWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      if (current === undefined) return;
      await worker(current);
    }
  });
  await Promise.all(runners);
}
