/** prov-exp-10.2 — calendar month day summaries + utilization bands. */

import { BookingStatus } from '../booking/entities/booking.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import {
  computeProviderUtilizationPercent,
  type ProviderMyStatsBookingLike,
  type ProviderMyStatsPeriodLike,
} from './provider-my-stats.util.js';

export type ProviderCalendarUtilizationBand =
  | 'empty'
  | 'low'
  | 'medium'
  | 'high';

export interface ProviderCalendarMonthDaySummary {
  date: string;
  bookingCount: number;
  bookedMinutes: number;
  scheduledMinutes: number;
  utilizationPercent: number;
  utilizationBand: ProviderCalendarUtilizationBand;
}

export interface ProviderCalendarMonthView {
  month: string;
  from: string;
  to: string;
  viewMode: 'provider' | 'team' | 'admin' | 'owner';
  days: ProviderCalendarMonthDaySummary[];
}

export const PROVIDER_CALENDAR_UTILIZATION_BAND_THRESHOLDS = {
  medium: 40,
  high: 70,
} as const;

export const PROVIDER_CALENDAR_DEFAULT_DAY_MINUTES = 8 * 60;

export function normalizeCalendarMonthKey(
  value?: string | null,
): string | null {
  const trimmed = value?.trim() ?? '';
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(trimmed);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

export function resolveCalendarMonthBounds(monthKey: string): {
  from: string;
  to: string;
} {
  const normalized = normalizeCalendarMonthKey(monthKey);
  if (!normalized) {
    throw new Error(`Invalid calendar month key: ${monthKey}`);
  }
  const [yearPart, monthPart] = normalized.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const from = `${yearPart}-${monthPart}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
  const to = `${yearPart}-${monthPart}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

function parseIsoDateKey(dateKey: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) throw new Error(`Invalid date key: ${dateKey}`);
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0),
  );
}

function formatIsoDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function listDateKeysInclusive(from: string, to: string): string[] {
  const keys: string[] = [];
  let cursor = parseIsoDateKey(from);
  const end = parseIsoDateKey(to);
  while (cursor.getTime() <= end.getTime()) {
    keys.push(formatIsoDateKey(cursor));
    cursor = addUtcDays(cursor, 1);
  }
  return keys;
}

export function resolveProviderCalendarUtilizationBand(input: {
  bookingCount: number;
  utilizationPercent: number;
}): ProviderCalendarUtilizationBand {
  if (input.bookingCount <= 0) return 'empty';
  if (input.utilizationPercent >= PROVIDER_CALENDAR_UTILIZATION_BAND_THRESHOLDS.high) {
    return 'high';
  }
  if (input.utilizationPercent >= PROVIDER_CALENDAR_UTILIZATION_BAND_THRESHOLDS.medium) {
    return 'medium';
  }
  return 'low';
}

export function countBookingsForDateKey(
  bookings: ProviderMyStatsBookingLike[],
  dateKey: string,
): number {
  return bookings.filter(
    (booking) =>
      booking.status !== BookingStatus.CANCELLED &&
      booking.startTime.toISOString().slice(0, 10) === dateKey,
  ).length;
}

export function sumBookedMinutesForDateKey(
  bookings: ProviderMyStatsBookingLike[],
  dateKey: string,
): number {
  return bookings
    .filter(
      (booking) =>
        booking.status !== BookingStatus.CANCELLED &&
        booking.startTime.toISOString().slice(0, 10) === dateKey,
    )
    .reduce(
      (sum, booking) =>
        sum + (booking.endTime.getTime() - booking.startTime.getTime()) / 60000,
      0,
    );
}

export function sumScheduledMinutesForDateKey(
  periods: ProviderMyStatsPeriodLike[],
  dateKey: string,
): number {
  return periods
    .filter(
      (period) =>
        period.type === TemplatePeriodType.SERVICE_BLOCK &&
        period.startTime.toISOString().slice(0, 10) === dateKey,
    )
    .reduce(
      (sum, period) =>
        sum + (period.endTime.getTime() - period.startTime.getTime()) / 60000,
      0,
    );
}

export function buildProviderCalendarMonthDaySummary(input: {
  dateKey: string;
  bookings: ProviderMyStatsBookingLike[];
  periods: ProviderMyStatsPeriodLike[];
  employeeCount: number;
}): ProviderCalendarMonthDaySummary {
  const bookingCount = countBookingsForDateKey(input.bookings, input.dateKey);
  const bookedMinutes = sumBookedMinutesForDateKey(input.bookings, input.dateKey);
  let scheduledMinutes = sumScheduledMinutesForDateKey(
    input.periods,
    input.dateKey,
  );
  if (scheduledMinutes <= 0 && input.employeeCount > 0) {
    scheduledMinutes = PROVIDER_CALENDAR_DEFAULT_DAY_MINUTES * input.employeeCount;
  }
  const utilizationPercent = computeProviderUtilizationPercent(
    bookedMinutes,
    scheduledMinutes,
  );
  return {
    date: input.dateKey,
    bookingCount,
    bookedMinutes: Math.round(bookedMinutes),
    scheduledMinutes: Math.round(scheduledMinutes),
    utilizationPercent,
    utilizationBand: resolveProviderCalendarUtilizationBand({
      bookingCount,
      utilizationPercent,
    }),
  };
}

export function buildProviderCalendarMonthView(input: {
  monthKey: string;
  viewMode: ProviderCalendarMonthView['viewMode'];
  bookings: ProviderMyStatsBookingLike[];
  periods: ProviderMyStatsPeriodLike[];
  employeeCount: number;
}): ProviderCalendarMonthView {
  const { from, to } = resolveCalendarMonthBounds(input.monthKey);
  const days = listDateKeysInclusive(from, to).map((dateKey) =>
    buildProviderCalendarMonthDaySummary({
      dateKey,
      bookings: input.bookings,
      periods: input.periods,
      employeeCount: input.employeeCount,
    }),
  );

  return {
    month: normalizeCalendarMonthKey(input.monthKey) ?? from.slice(0, 7),
    from,
    to,
    viewMode: input.viewMode,
    days,
  };
}
