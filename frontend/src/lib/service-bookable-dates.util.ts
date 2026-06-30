export const SERVICE_BOOKABLE_DATE_SCAN_DAYS = 120;
export const SERVICE_BOOKABLE_DATE_MAX_RANGE = 62;

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

export function buildInclusiveDateKeyRange(fromKey: string, toKey: string): string[] {
  if (fromKey > toKey) return [];
  const keys: string[] = [];
  let current = fromKey;
  while (current <= toKey) {
    keys.push(current);
    current = addDaysToDateKey(current, 1);
  }
  return keys;
}

export function splitDateKeyRange(
  fromKey: string,
  toKey: string,
  maxDays: number,
): Array<{ from: string; to: string }> {
  if (fromKey > toKey || maxDays < 1) return [];
  const chunks: Array<{ from: string; to: string }> = [];
  let current = fromKey;
  while (current <= toKey) {
    const chunkEnd = addDaysToDateKey(current, maxDays - 1);
    const end = chunkEnd > toKey ? toKey : chunkEnd;
    chunks.push({ from: current, to: end });
    current = addDaysToDateKey(end, 1);
  }
  return chunks;
}

export function monthBoundsFromMonthKey(monthKey: string): { from: string; to: string } {
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = monthKey.slice(0, 7);
  return {
    from: `${prefix}-01`,
    to: `${prefix}-${String(daysInMonth).padStart(2, '0')}`,
  };
}

export function buildServiceDateEnabled(input: {
  bookableDates: ReadonlySet<string>;
  scannedDates: ReadonlySet<string>;
  minDateKey: string;
}): (dateKey: string) => boolean {
  const minDateKey = input.minDateKey.slice(0, 10);
  return (dateKey: string) => {
    const key = isoToDateKey(dateKey);
    if (key < minDateKey) return false;
    if (!input.scannedDates.has(key)) return false;
    return input.bookableDates.has(key);
  };
}

export function pickFirstBookableDateKey(
  bookableDates: ReadonlySet<string>,
  minDateKey: string,
): string | null {
  const sorted = [...bookableDates].sort();
  return sorted.find((dateKey) => dateKey >= minDateKey.slice(0, 10)) ?? null;
}
