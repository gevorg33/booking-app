/** prov-exp-2.1 — personal stats for provider mobile profile insights. */

import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import { resolveBookingPaidGrossAmount } from '../../common/utils/booking-receipt-tax.util.js';
import { resolveBookingTipAmount } from '../../common/utils/booking-tip.util.js';

export type ProviderMyStatsPeriod = 'week' | 'month';
export type ProviderMyStatsScope = 'mine' | 'team';

export interface ProviderMyStatsView {
  period: ProviderMyStatsPeriod;
  scope: ProviderMyStatsScope;
  from: string;
  to: string;
  canTeamRollup: boolean;
  completedBookings: number;
  paidRevenue: number;
  currency: string;
  utilizationPercent: number;
  bookedMinutes: number;
  scheduledMinutes: number;
  averageReviewScore: number | null;
  newReviewsCount: number;
  employeeCount: number;
  tipsEnabled: boolean;
  tipTotal?: number;
  tippedVisitCount?: number;
}

export interface ProviderMyStatsBookingLike {
  status: string;
  paymentStatus: string;
  startTime: Date;
  endTime: Date;
  service?: { price?: number | string | null } | null;
  metadata?: Record<string, unknown> | null;
}

export interface ProviderMyStatsPeriodLike {
  startTime: Date;
  endTime: Date;
  type: TemplatePeriodType;
}

export interface ProviderMyStatsReviewLike {
  rating: number;
  createdAt: Date;
}

export function canRequestProviderTeamStatsRollup(
  membershipRole?: string | null,
): boolean {
  return (
    membershipRole === 'owner' ||
    membershipRole === 'admin' ||
    membershipRole === 'manager'
  );
}

export function normalizeProviderMyStatsPeriod(
  value?: string | null,
): ProviderMyStatsPeriod {
  return value === 'month' ? 'month' : 'week';
}

export function normalizeProviderMyStatsScope(
  value?: string | null,
): ProviderMyStatsScope {
  return value === 'team' ? 'team' : 'mine';
}

function parseIsoDateKey(dateKey: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) throw new Error(`Invalid date key: ${dateKey}`);
  return new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      12,
      0,
      0,
      0,
    ),
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

/** Monday-start week containing `todayKey`. */
export function resolveProviderMyStatsPeriodRange(
  period: ProviderMyStatsPeriod,
  todayKey: string,
): { from: string; to: string } {
  const today = parseIsoDateKey(todayKey);
  if (period === 'month') {
    const start = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 12),
    );
    const end = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 12),
    );
    return { from: formatIsoDateKey(start), to: formatIsoDateKey(end) };
  }

  const weekday = today.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const start = addUtcDays(today, mondayOffset);
  const end = addUtcDays(start, 6);
  return { from: formatIsoDateKey(start), to: formatIsoDateKey(end) };
}

export function countDaysInclusive(range: {
  from: string;
  to: string;
}): number {
  const start = parseIsoDateKey(range.from);
  const end = parseIsoDateKey(range.to);
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Math.max(1, diffDays + 1);
}

export function sumBookableSchedulingPeriodMinutes(
  periods: ProviderMyStatsPeriodLike[],
): number {
  return periods
    .filter((period) => period.type === TemplatePeriodType.SERVICE_BLOCK)
    .reduce(
      (sum, period) =>
        sum + (period.endTime.getTime() - period.startTime.getTime()) / 60000,
      0,
    );
}

export function sumBookedMinutesFromBookings(
  bookings: ProviderMyStatsBookingLike[],
): number {
  return bookings
    .filter((booking) => booking.status !== BookingStatus.CANCELLED)
    .reduce(
      (sum, booking) =>
        sum + (booking.endTime.getTime() - booking.startTime.getTime()) / 60000,
      0,
    );
}

export function fallbackScheduledMinutes(
  range: { from: string; to: string },
  employeeCount: number,
): number {
  const days = countDaysInclusive(range);
  return days * 8 * 60 * Math.max(employeeCount, 1);
}

export function computeProviderUtilizationPercent(
  bookedMinutes: number,
  scheduledMinutes: number,
): number {
  if (scheduledMinutes <= 0) return 0;
  return Math.min(100, Math.round((bookedMinutes / scheduledMinutes) * 100));
}

export function countCompletedBookings(
  bookings: ProviderMyStatsBookingLike[],
): number {
  return bookings.filter(
    (booking) => booking.status === BookingStatus.COMPLETED,
  ).length;
}

function isCompletedPaidBooking(booking: ProviderMyStatsBookingLike): boolean {
  return (
    booking.status === BookingStatus.COMPLETED &&
    booking.paymentStatus === PaymentStatus.PAID
  );
}

export function sumPaidRevenueFromBookings(
  bookings: ProviderMyStatsBookingLike[],
): number {
  const total = bookings
    .filter(isCompletedPaidBooking)
    .reduce((sum, booking) => sum + resolveBookingPaidGrossAmount(booking), 0);
  return Math.round(total * 100) / 100;
}

export function summarizeTipsFromBookings(
  bookings: ProviderMyStatsBookingLike[],
): { tipTotal: number; tippedVisitCount: number } {
  let tipTotal = 0;
  let tippedVisitCount = 0;
  for (const booking of bookings) {
    if (!isCompletedPaidBooking(booking)) continue;
    const tipAmount = resolveBookingTipAmount(booking);
    if (tipAmount <= 0) continue;
    tipTotal += tipAmount;
    tippedVisitCount += 1;
  }
  return {
    tipTotal: Math.round(tipTotal * 100) / 100,
    tippedVisitCount,
  };
}

export function summarizeReviewsInPeriod(
  reviews: ProviderMyStatsReviewLike[],
): { averageReviewScore: number | null; newReviewsCount: number } {
  if (!reviews.length) {
    return { averageReviewScore: null, newReviewsCount: 0 };
  }
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    averageReviewScore: Math.round((total / reviews.length) * 10) / 10,
    newReviewsCount: reviews.length,
  };
}

export function buildProviderMyStatsView(input: {
  period: ProviderMyStatsPeriod;
  scope: ProviderMyStatsScope;
  range: { from: string; to: string };
  canTeamRollup: boolean;
  currency: string;
  employeeCount: number;
  bookings: ProviderMyStatsBookingLike[];
  periods: ProviderMyStatsPeriodLike[];
  reviews: ProviderMyStatsReviewLike[];
  tipsEnabled?: boolean;
}): ProviderMyStatsView {
  const bookedMinutes = Math.round(
    sumBookedMinutesFromBookings(input.bookings),
  );
  const scheduledFromPeriods = sumBookableSchedulingPeriodMinutes(
    input.periods,
  );
  const scheduledMinutes = Math.round(
    scheduledFromPeriods > 0
      ? scheduledFromPeriods
      : fallbackScheduledMinutes(input.range, input.employeeCount),
  );
  const reviewSummary = summarizeReviewsInPeriod(input.reviews);
  const tipsEnabled = input.tipsEnabled === true;
  const tipSummary = tipsEnabled
    ? summarizeTipsFromBookings(input.bookings)
    : null;

  return {
    period: input.period,
    scope: input.scope,
    from: input.range.from,
    to: input.range.to,
    canTeamRollup: input.canTeamRollup,
    completedBookings: countCompletedBookings(input.bookings),
    paidRevenue: sumPaidRevenueFromBookings(input.bookings),
    currency: input.currency,
    utilizationPercent: computeProviderUtilizationPercent(
      bookedMinutes,
      scheduledMinutes,
    ),
    bookedMinutes,
    scheduledMinutes,
    averageReviewScore: reviewSummary.averageReviewScore,
    newReviewsCount: reviewSummary.newReviewsCount,
    employeeCount: input.employeeCount,
    tipsEnabled,
    ...(tipSummary
      ? {
          tipTotal: tipSummary.tipTotal,
          tippedVisitCount: tipSummary.tippedVisitCount,
        }
      : {}),
  };
}
