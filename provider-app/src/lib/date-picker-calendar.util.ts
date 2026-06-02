import { addCalendarDays, getTodayDateKey, parseDateKey, toDateKey } from './date-format';

export type CalendarDayCell = {
  dateKey: string;
  inMonth: boolean;
};

export function monthKeyFromDateKey(dateKey: string): string {
  const match = dateKey.match(/^(\d{4})-(\d{2})/);
  if (!match) return `${getTodayDateKey().slice(0, 7)}-01`;
  return `${match[1]}-${match[2]}-01`;
}

export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const anchor = parseDateKey(monthKey);
  if (!anchor) return monthKey;
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();
  const next = new Date(Date.UTC(year, month + deltaMonths, 1, 12));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function compareDateKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

export function isDateKeyInRange(dateKey: string, min?: string, max?: string): boolean {
  if (min && compareDateKeys(dateKey, min) < 0) return false;
  if (max && compareDateKeys(dateKey, max) > 0) return false;
  return true;
}

export function buildCalendarMonth(monthKey: string): CalendarDayCell[] {
  const monthStart = parseDateKey(monthKey);
  if (!monthStart) return [];

  const year = monthStart.getUTCFullYear();
  const month = monthStart.getUTCMonth() + 1;
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

  const mondayOffset = (monthStart.getUTCDay() + 6) % 7;
  const gridStart = addCalendarDays(monthStart, -mondayOffset);

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = addCalendarDays(gridStart, i);
    const dateKey = toDateKey(d);
    cells.push({
      dateKey,
      inMonth: dateKey.startsWith(monthPrefix),
    });
  }
  return cells;
}

export function formatMonthYearLabel(monthKey: string): string {
  const anchor = parseDateKey(monthKey);
  if (!anchor) return monthKey;
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(anchor);
}
