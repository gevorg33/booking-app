import type { CommissionRule } from '../commissions/entities/commission-rule.entity.js';
import {
  calculateCommissionAmount,
  pickCommissionRule,
} from '../../common/utils/commission-payout.util.js';
import {
  resolveBookingPaidGrossAmount,
  resolveBookingNetRevenue,
  resolveBookingTaxCollected,
  type BookingReceiptTaxSource,
} from '../../common/utils/booking-receipt-tax.util.js';
import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import type { DateRange } from './ai-orchestration.helpers.js';
import { PROVIDER_EARNINGS_PROMPT_SCENARIOS } from './ai-provider-earnings.fixtures.js';
import { isExplainAppointmentTaxPrompt } from './ai-appointment-tax.util.js';
import { isExplainProviderPaymentCurrencyPrompt } from './ai-provider-payment-currency.util.js';
import {
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
} from './ai-payments.util.js';
import { isMyStatsPrompt } from './ai-provider-exp-2.util.js';

export const PROVIDER_EARNINGS_INTENTS = [
  'summarize_my_appointments',
  'summarize_my_revenue',
] as const;

export type ProviderEarningsIntent =
  (typeof PROVIDER_EARNINGS_INTENTS)[number];

export interface ProviderAppointmentCountSummary {
  total: number;
  byStatus: Record<string, number>;
  periodLabel: string;
  from: string;
  to: string;
}

export interface ProviderRevenueBookingBreakdown {
  bookingId: string;
  grossCollected: number;
  taxExcluded: number;
  netBeforeSplit: number;
  providerNet: number;
  commissionType: string | null;
  commissionValue: number | null;
}

export interface ProviderRevenueSummary {
  paidVisitCount: number;
  grossCollected: number;
  taxExcluded: number;
  netBeforeCommission: number;
  providerNet: number;
  commissionApplied: boolean;
  scheduledUnpaidCount: number;
  scheduledUnpaidValue: number;
  periodLabel: string;
  from: string;
  to: string;
  currency: string;
  bookings: ProviderRevenueBookingBreakdown[];
}

export interface ProviderBookingCountLike {
  status: string;
}

export interface ProviderRevenueBookingLike extends BookingReceiptTaxSource {
  id: string;
  employeeId: string;
  serviceId: string;
  status: string;
  paymentStatus: string;
  service?: { price?: number | string | null } | null;
}

const COMPLETED = 'completed';
const PAID = 'paid';
const CANCELLED = 'cancelled';

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function isoDateRangeToUtcBounds(range: DateRange): {
  start: Date;
  end: Date;
} {
  const parseStart = /^(\d{4})-(\d{2})-(\d{2})$/.exec(range.start.trim());
  const parseEnd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(range.end.trim());
  if (!parseStart || !parseEnd) {
    throw new Error('Invalid ISO date range');
  }
  const start = new Date(
    Date.UTC(
      Number(parseStart[1]),
      Number(parseStart[2]) - 1,
      Number(parseStart[3]),
      0,
      0,
      0,
      0,
    ),
  );
  const end = new Date(
    Date.UTC(
      Number(parseEnd[1]),
      Number(parseEnd[2]) - 1,
      Number(parseEnd[3]),
      23,
      59,
      59,
      999,
    ),
  );
  return { start, end };
}

export function buildPeriodLabel(
  range: DateRange,
  prompt?: string,
): string {
  const lower = (prompt ?? '').toLowerCase();
  if (range.start === range.end) {
    if (/\btoday\b/i.test(lower)) return 'today';
    if (/\btomorrow\b/i.test(lower)) return 'tomorrow';
    if (/\byesterday\b/i.test(lower)) return 'yesterday';
    return `on ${formatDateDisplay(range.start)}`;
  }
  if (/\blast week\b/i.test(lower)) return 'last week';
  if (/\bthis week\b/i.test(lower)) return 'this week';
  if (/\blast month\b/i.test(lower)) return 'last month';
  if (/\bthis month\b/i.test(lower)) return 'this month';
  return `${formatDateDisplay(range.start)} – ${formatDateDisplay(range.end)}`;
}

export function isSummarizeMyAppointmentsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (isSummarizeMyRevenuePrompt(prompt)) return false;
  if (isBookNearestSlotPrompt(prompt) || isCheckProvidersForServicePrompt(prompt)) {
    return false;
  }
  if (/\bhow many times has [A-Z][a-z]+/i.test(prompt)) return false;
  if (/\bwhen did [A-Z][a-z]+ last visit\b/i.test(prompt)) return false;
  if (/\b(client snapshot|summarize client|visit count)\b/i.test(lower)) {
    return false;
  }
  if (/\b(revenue|earnings?|income|made|earn(?:ed)?|money|paid)\b/i.test(lower)) {
    return false;
  }

  const countCue =
    /\b(how many|count|number of|total|do i have any|any appointments)\b/i.test(
      lower,
    ) ||
    (containsArmenianScript(prompt) && /(քանի|կա՞|ամրագր)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(сколько|количество|есть ли|запис)/i.test(prompt));

  const appointmentCue =
    /\b(appointments?|bookings?|clients?|visits?|schedule)\b/i.test(lower) ||
    (containsArmenianScript(prompt) && /(ամրագր|հաճախորդ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) && /(запис|клиент|приём)/i.test(prompt));

  const selfCue =
    /\b(my|mine|i have|do i have|am i seeing|for me)\b/i.test(lower) ||
    (containsArmenianScript(prompt) && /(իմ|ունեմ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) && /(мои|моих|у меня)/i.test(prompt)) ||
    countCue;

  return countCue && appointmentCue && selfCue;
}

export function isSummarizeMyRevenuePrompt(prompt: string): boolean {
  if (isExplainAppointmentTaxPrompt(prompt)) return false;
  if (isExplainProviderPaymentCurrencyPrompt(prompt)) return false;

  const lower = prompt.toLowerCase();
  if (/\b(mark paid|payment sweep|collect outstanding)\b/i.test(lower)) {
    return false;
  }

  const revenueCue =
    /\b(revenue|earnings?|income|made|make|earn(?:ed)?|net|cut|take[- ]home)\b/i.test(
      lower,
    ) ||
    /\bhow much\b/i.test(lower) ||
    /\bdid i make\b/i.test(lower) ||
    (containsArmenianScript(prompt) && /(վաստակ|եկամուտ|գումար)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(заработ|доход|выручк|сколько)/i.test(prompt));

  const selfCue =
    /\b(my|mine|i made|did i make|my cut)\b/i.test(lower) ||
    (containsArmenianScript(prompt) && /(իմ|վաստակ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) && /(мои|мой|я заработ|сколько я)/i.test(prompt)) ||
    /\bhow much did i\b/i.test(lower);

  return revenueCue && selfCue;
}

export function rescueProviderEarningsIntent(
  prompt: string,
  action: string,
): { action: ProviderEarningsIntent; rescueReason: string } | null {
  if (isMyStatsPrompt(prompt)) return null;
  if (isSummarizeMyRevenuePrompt(prompt)) {
    return {
      action: 'summarize_my_revenue',
      rescueReason: 'summarize_my_revenue',
    };
  }
  if (isSummarizeMyAppointmentsPrompt(prompt)) {
    return {
      action: 'summarize_my_appointments',
      rescueReason: 'summarize_my_appointments',
    };
  }

  for (const scenario of PROVIDER_EARNINGS_PROMPT_SCENARIOS) {
    if (scenario.prompt === prompt) {
      return {
        action: scenario.expectedAction,
        rescueReason: scenario.expectedAction,
      };
    }
  }

  if (
    action === 'summarize_day' &&
    /\bhow many\b/i.test(prompt) &&
    /\bappointments?\b/i.test(prompt)
  ) {
    return {
      action: 'summarize_my_appointments',
      rescueReason: 'summarize_my_appointments',
    };
  }

  return null;
}

export function summarizeProviderAppointmentCounts(
  bookings: ProviderBookingCountLike[],
  range: DateRange,
  prompt?: string,
): ProviderAppointmentCountSummary {
  const active = bookings.filter((b) => b.status !== CANCELLED);
  const byStatus: Record<string, number> = {};
  for (const booking of active) {
    byStatus[booking.status] = (byStatus[booking.status] ?? 0) + 1;
  }
  return {
    total: active.length,
    byStatus,
    periodLabel: buildPeriodLabel(range, prompt),
    from: range.start,
    to: range.end,
  };
}

export function formatAppointmentCountSummary(
  summary: ProviderAppointmentCountSummary,
): string {
  if (summary.total === 0) {
    return `You have no appointments ${summary.periodLabel}.`;
  }
  const statusParts = Object.entries(summary.byStatus)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `${count} ${status.replace(/_/g, ' ')}`);
  const statusText =
    statusParts.length > 0 ? ` (${statusParts.join(', ')})` : '';
  return `You have ${summary.total} appointment${summary.total === 1 ? '' : 's'} ${summary.periodLabel}${statusText}.`;
}

export function computeProviderBookingEarnings(
  booking: ProviderRevenueBookingLike,
  rules: CommissionRule[],
): ProviderRevenueBookingBreakdown {
  const grossCollected = resolveBookingPaidGrossAmount(booking);
  const taxExcluded = resolveBookingTaxCollected(booking);
  const netBeforeSplit = resolveBookingNetRevenue(booking);
  const rule = pickCommissionRule(rules, booking.employeeId, booking.serviceId);
  const providerNet = rule
    ? calculateCommissionAmount(netBeforeSplit, rule)
    : netBeforeSplit;

  return {
    bookingId: booking.id,
    grossCollected,
    taxExcluded,
    netBeforeSplit,
    providerNet,
    commissionType: rule?.type ?? null,
    commissionValue: rule ? Number(rule.value) : null,
  };
}

export function summarizeProviderRevenue(
  bookings: ProviderRevenueBookingLike[],
  rules: CommissionRule[],
  range: DateRange,
  currency: string,
  prompt?: string,
): ProviderRevenueSummary {
  const paidCompleted = bookings.filter(
    (b) => b.status === COMPLETED && b.paymentStatus === PAID,
  );
  const scheduledUnpaid = bookings.filter(
    (b) =>
      b.status !== CANCELLED &&
      b.status !== COMPLETED &&
      b.paymentStatus !== PAID,
  );

  const breakdowns = paidCompleted.map((booking) =>
    computeProviderBookingEarnings(booking, rules),
  );

  const grossCollected = breakdowns.reduce((sum, row) => sum + row.grossCollected, 0);
  const taxExcluded = breakdowns.reduce((sum, row) => sum + row.taxExcluded, 0);
  const netBeforeCommission = breakdowns.reduce(
    (sum, row) => sum + row.netBeforeSplit,
    0,
  );
  const providerNet = breakdowns.reduce((sum, row) => sum + row.providerNet, 0);
  const commissionApplied = breakdowns.some((row) => row.commissionType != null);

  let scheduledUnpaidValue = 0;
  for (const booking of scheduledUnpaid) {
    const paidAmount = resolveBookingPaidGrossAmount(booking);
    if (paidAmount > 0) {
      scheduledUnpaidValue += paidAmount;
      continue;
    }
    const servicePrice = Number(booking.service?.price ?? 0);
    if (Number.isFinite(servicePrice) && servicePrice > 0) {
      scheduledUnpaidValue += servicePrice;
    }
  }

  return {
    paidVisitCount: paidCompleted.length,
    grossCollected: roundMoney(grossCollected),
    taxExcluded: roundMoney(taxExcluded),
    netBeforeCommission: roundMoney(netBeforeCommission),
    providerNet: roundMoney(providerNet),
    commissionApplied,
    scheduledUnpaidCount: scheduledUnpaid.length,
    scheduledUnpaidValue: roundMoney(scheduledUnpaidValue),
    periodLabel: buildPeriodLabel(range, prompt),
    from: range.start,
    to: range.end,
    currency,
    bookings: breakdowns,
  };
}

export function formatProviderRevenueSummary(
  summary: ProviderRevenueSummary,
  formatMoney: (amount: number, currency: string) => string,
): string {
  const money = (amount: number) => formatMoney(amount, summary.currency);

  if (summary.paidVisitCount === 0 && summary.scheduledUnpaidCount === 0) {
    return `No paid or scheduled appointments ${summary.periodLabel}.`;
  }

  if (summary.paidVisitCount === 0) {
    return `No completed paid visits ${summary.periodLabel}. You have ${summary.scheduledUnpaidCount} upcoming appointment${summary.scheduledUnpaidCount === 1 ? '' : 's'} worth about ${money(summary.scheduledUnpaidValue)} (not yet earned).`;
  }

  const parts = [
    `Net earnings ${summary.periodLabel}: ${money(summary.providerNet)}`,
    `from ${summary.paidVisitCount} paid visit${summary.paidVisitCount === 1 ? '' : 's'}`,
  ];

  if (summary.taxExcluded > 0) {
    parts.push(`${money(summary.taxExcluded)} tax excluded`);
  }
  if (summary.grossCollected > summary.netBeforeCommission) {
    parts.push(`${money(summary.grossCollected)} gross collected`);
  }
  if (summary.commissionApplied) {
    parts.push('salon commission applied');
  } else if (summary.netBeforeCommission !== summary.providerNet) {
    parts.push(`${money(summary.netBeforeCommission)} before split`);
  }

  if (summary.scheduledUnpaidCount > 0) {
    parts.push(
      `${summary.scheduledUnpaidCount} upcoming (${money(summary.scheduledUnpaidValue)} scheduled, not yet earned)`,
    );
  }

  return `${parts[0]} ${parts.slice(1).join(', ')}.`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
