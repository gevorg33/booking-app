/** Dashboard summarize_bookings revenue KPIs with tenant currency (ai-cmd-ext-1.6). */

import {
  formatBusinessMoney,
  getBusinessDefaultCurrency,
} from '../../common/utils/business-currency.util.js';
import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import { resolveBookingMetric } from './ai-intent-heuristics.js';
import { isTotalEarningsPrompt } from './dashboard-revenue-analytics.util.js';
import type { CommandResult } from './command-completion.types.js';

export const SUMMARIZE_BOOKINGS_INTENTS = ['summarize_bookings'] as const;

export type SummarizeBookingsIntent =
  (typeof SUMMARIZE_BOOKINGS_INTENTS)[number];

export function isSummarizeBookingsIntent(
  action: string,
): action is SummarizeBookingsIntent {
  return (SUMMARIZE_BOOKINGS_INTENTS as readonly string[]).includes(action);
}

/** Dashboard booking analytics (revenue totals + period overview). */
export function isDashboardSummarizeBookingsPrompt(prompt: string): boolean {
  if (isTotalEarningsPrompt(prompt)) return true;

  const lower = prompt.toLowerCase();
  const hasPeriod =
    /\b(today|tomorrow|yesterday|this week|last week|this month|last month|all time)\b/i.test(
      lower,
    ) || /\b\d{1,2}[/_]\d{1,2}(?:[/_]\d{2,4})?\b/.test(lower);

  return (
    hasPeriod &&
    /\b(bookings?|appointments?)\s+(overview|summary|breakdown|stats)\b/i.test(
      lower,
    )
  );
}

export function rescueSummarizeBookingsIntent(
  prompt: string,
  action: string,
): {
  action: SummarizeBookingsIntent;
  bookingMetric: NonNullable<ReturnType<typeof resolveBookingMetric>>;
  rescueReason: string;
} | null {
  if (isSummarizeBookingsIntent(action)) return null;
  if (!isDashboardSummarizeBookingsPrompt(prompt)) return null;

  const bookingMetric = isTotalEarningsPrompt(prompt) ? 'revenue' : 'overview';

  return {
    action: 'summarize_bookings',
    bookingMetric,
    rescueReason:
      bookingMetric === 'revenue'
        ? 'total_earnings'
        : 'summarize_bookings_metric',
  };
}

export type BookingRevenueRow = {
  status: string;
  servicePrice?: number | null;
};

const REVENUE_ELIGIBLE_STATUSES = new Set([
  'completed',
  'confirmed',
  'in_progress',
  'pending',
]);

export function isRevenueEligibleBooking(booking: BookingRevenueRow): boolean {
  if (booking.status === 'cancelled') return false;
  return REVENUE_ELIGIBLE_STATUSES.has(booking.status);
}

export function computeBookingRevenueTotal(
  bookings: readonly BookingRevenueRow[],
): number {
  return bookings
    .filter(isRevenueEligibleBooking)
    .reduce((sum, booking) => sum + Number(booking.servicePrice ?? 0), 0);
}

export function resolveSummarizeBookingsCurrency(
  businessSettings?: Record<string, unknown> | null,
): string {
  return getBusinessDefaultCurrency(businessSettings ?? undefined);
}

export function formatSummarizeBookingsRevenue(
  amount: number,
  businessSettings?: Record<string, unknown> | null,
): string {
  return formatBusinessMoney(amount, businessSettings ?? undefined);
}

export function buildSummarizeBookingsRevenueLine(
  amount: number,
  appointmentCount: number,
  businessSettings?: Record<string, unknown> | null,
): string {
  const formatted = formatSummarizeBookingsRevenue(amount, businessSettings);
  return `• ${formatted} from ${appointmentCount} appointment(s)`;
}

export function buildSummarizeBookingsOverviewRevenueLine(
  amount: number,
  unpaidCount: number,
  businessSettings?: Record<string, unknown> | null,
): string {
  const formatted = formatSummarizeBookingsRevenue(amount, businessSettings);
  return `• Revenue: ${formatted} · ${unpaidCount} unpaid`;
}

export function buildSummarizeBookingsRevenueDetails(
  amount: number,
  appointmentCount: number,
  businessSettings?: Record<string, unknown> | null,
): {
  total: number;
  currency: string;
  formatted: string;
  appointmentCount: number;
} {
  return {
    total: amount,
    currency: resolveSummarizeBookingsCurrency(businessSettings),
    formatted: formatSummarizeBookingsRevenue(amount, businessSettings),
    appointmentCount,
  };
}

export type SummarizeBookingsBookingSlice = {
  status: string;
  paymentStatus?: string | null;
  startTime: Date;
  service?: { price?: number | null } | null;
  employee?: { name?: string } | null;
};

export type ComposeSummarizeBookingsArgs = {
  bookings: readonly SummarizeBookingsBookingSlice[];
  businessSettings: Record<string, unknown>;
  metric: string;
  range: { start: string; end: string };
  employeeId?: string;
  employeeName?: string;
  statusFilter?: string;
  now?: Date;
};

export function composeSummarizeBookingsResult(
  args: ComposeSummarizeBookingsArgs,
): CommandResult {
  const now = args.now ?? new Date();
  const filtered = args.statusFilter
    ? args.bookings.filter((booking) => booking.status === args.statusFilter)
    : [...args.bookings];

  const upcoming = filtered.filter(
    (booking) =>
      booking.startTime > now &&
      booking.status !== 'cancelled' &&
      booking.status !== 'completed' &&
      booking.status !== 'no_show',
  );
  const confirmed = filtered.filter(
    (booking) => booking.status === 'confirmed',
  );
  const pending = filtered.filter((booking) => booking.status === 'pending');
  const completed = filtered.filter(
    (booking) => booking.status === 'completed',
  );
  const active = filtered.filter((booking) => booking.status !== 'cancelled');
  const cancelled = filtered.filter(
    (booking) => booking.status === 'cancelled',
  );
  const noShows = filtered.filter((booking) => booking.status === 'no_show');
  const unpaid = filtered.filter(
    (booking) =>
      booking.status !== 'cancelled' && booking.paymentStatus === 'pending',
  );

  const revenueRows = active.map((booking) => ({
    status: booking.status,
    servicePrice: Number(booking.service?.price ?? 0),
  }));
  const revenueBookings = revenueRows.filter(isRevenueEligibleBooking);
  const totalRevenue = computeBookingRevenueTotal(revenueRows);
  const revenueDetails = buildSummarizeBookingsRevenueDetails(
    totalRevenue,
    revenueBookings.length,
    args.businessSettings,
  );

  const byProvider = new Map<string, number>();
  for (const booking of active) {
    const name = booking.employee?.name || 'Unknown';
    byProvider.set(name, (byProvider.get(name) ?? 0) + 1);
  }
  const busiest = [...byProvider.entries()].sort((a, b) => b[1] - a[1]);

  const rangeLabel =
    args.range.start === args.range.end
      ? formatDateDisplay(args.range.start)
      : `${formatDateDisplay(args.range.start)} → ${formatDateDisplay(args.range.end)}`;
  const scopeLabel = args.employeeName || 'all providers';
  const statusNote = args.statusFilter ? ` (${args.statusFilter} only)` : '';

  const metricTitles: Record<string, string> = {
    count: 'Appointment count',
    revenue: 'Revenue',
    busiest_provider: 'Busiest provider',
    cancelled: 'Cancelled appointments',
    no_shows: 'No-shows',
    unpaid: 'Unpaid appointments',
    upcoming: 'Upcoming appointments',
    confirmed: 'Confirmed appointments',
    pending: 'Pending appointments',
    completed: 'Completed appointments',
    overview: 'Booking overview',
  };

  const lines: string[] = [
    `${metricTitles[args.metric] ?? 'Booking overview'} for ${scopeLabel} on ${rangeLabel}${statusNote}:`,
  ];

  switch (args.metric) {
    case 'count':
      lines.push(`• ${active.length} active appointment(s)`);
      if (!args.statusFilter) {
        lines.push(
          `• ${cancelled.length} cancelled · ${noShows.length} no-show(s)`,
        );
      }
      break;
    case 'revenue':
      lines.push(
        buildSummarizeBookingsRevenueLine(
          totalRevenue,
          revenueBookings.length,
          args.businessSettings,
        ),
      );
      break;
    case 'busiest_provider':
      if (busiest.length === 0) {
        lines.push('• No active appointments in this period.');
      } else {
        const [topName, topCount] = busiest[0];
        const tied = busiest.filter(([, count]) => count === topCount);
        lines.push(`• ${topName}: ${topCount} appointment(s)`);
        if (tied.length > 1) {
          lines.push(
            `• Tied with: ${tied
              .slice(1)
              .map(([name, count]) => `${name} (${count})`)
              .join(', ')}`,
          );
        }
        if (busiest.length > 1 && tied.length === 1) {
          lines.push('', 'All providers:');
          for (const [name, count] of busiest) {
            lines.push(`• ${name}: ${count}`);
          }
        }
      }
      break;
    case 'cancelled':
      lines.push(`• ${cancelled.length} cancelled appointment(s)`);
      break;
    case 'no_shows':
      lines.push(`• ${noShows.length} no-show(s)`);
      break;
    case 'unpaid':
      lines.push(`• ${unpaid.length} unpaid appointment(s)`);
      break;
    case 'upcoming':
      lines.push(`• ${upcoming.length} upcoming appointment(s)`);
      break;
    case 'confirmed':
      lines.push(`• ${confirmed.length} confirmed appointment(s)`);
      break;
    case 'pending':
      lines.push(`• ${pending.length} pending appointment(s)`);
      break;
    case 'completed':
      lines.push(`• ${completed.length} completed appointment(s)`);
      break;
    case 'overview':
      lines.push(
        `• ${active.length} active · ${cancelled.length} cancelled · ${noShows.length} no-show(s)`,
        buildSummarizeBookingsOverviewRevenueLine(
          totalRevenue,
          unpaid.length,
          args.businessSettings,
        ),
      );
      if (busiest.length > 0) {
        lines.push(`• Busiest: ${busiest[0][0]} (${busiest[0][1]} appt(s))`);
      }
      break;
  }

  return {
    success: true,
    action: 'summarize_bookings',
    summary: lines.join('\n'),
    details: {
      bookingMetric: args.metric,
      date:
        args.range.start === args.range.end
          ? formatDateDisplay(args.range.start)
          : null,
      range: args.range,
      scope: args.employeeId ? 'provider' : 'all_providers',
      employee: args.employeeName ?? null,
      counts: {
        total: filtered.length,
        active: active.length,
        cancelled: cancelled.length,
        noShows: noShows.length,
        unpaid: unpaid.length,
        upcoming: upcoming.length,
        confirmed: confirmed.length,
        pending: pending.length,
        completed: completed.length,
      },
      revenue: revenueDetails,
      busiestProvider:
        busiest.length > 0
          ? { name: busiest[0][0], count: busiest[0][1] }
          : null,
      byProvider: Object.fromEntries(busiest),
    },
  };
}
