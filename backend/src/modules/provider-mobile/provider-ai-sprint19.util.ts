import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  formatDateDisplay,
  toIsoDay,
  todayDisplay,
} from '../../common/utils/date-format.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';

export type ScheduleGapLabel = { start: string; end: string };

export type ProviderListBooking = {
  startTime: Date;
  status: string;
  service?: { name?: string } | null;
};

export interface ProviderBookingsListResult {
  success: boolean;
  action: 'list_bookings' | 'show_appointments';
  summary: string;
  details: Record<string, unknown>;
}

export interface CheckAvailabilityResult {
  success: boolean;
  action: 'check_availability';
  summary: string;
  details: Record<string, unknown>;
}

/** Map schedule-gap helper output to stable start/end labels for summaries. */
export function mapScheduleGapLabels(
  gaps: Array<{ startTime: string; endTime: string }>,
): ScheduleGapLabel[] {
  return gaps.map((g) => ({ start: g.startTime, end: g.endTime }));
}

export function isWhosNextPrompt(prompt: string): boolean {
  return /who'?s\s+next|next\s+appointment/i.test(prompt);
}

export function mergeShowAppointmentsParams(
  prompt: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...params };
  if (isWhosNextPrompt(prompt)) {
    merged.statusFilter = 'upcoming';
    if (!merged.date) merged.date = toIsoDay(todayDisplay());
  }
  return merged;
}

export function resolveStatusFilter(params: Record<string, unknown>): string {
  return String(params.statusFilter ?? params.status ?? '').toLowerCase();
}

export function sortBookingsByStartTime<T extends ProviderListBooking>(
  bookings: T[],
): T[] {
  return [...bookings].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
}

export function filterBookingsForProviderList<T extends ProviderListBooking>(
  bookings: T[],
  statusFilter: string,
  nowMs: number,
  normalizeStatus: (value: string) => string | undefined,
): T[] {
  if (statusFilter === 'upcoming') {
    return sortBookingsByStartTime(
      bookings.filter(
        (b) =>
          b.startTime.getTime() > nowMs &&
          b.status !== BookingStatus.CANCELLED &&
          b.status !== BookingStatus.COMPLETED &&
          b.status !== BookingStatus.NO_SHOW,
      ),
    );
  }
  if (statusFilter && statusFilter !== 'null') {
    const normalized = normalizeStatus(statusFilter);
    if (normalized) {
      return bookings.filter((b) => b.status === normalized);
    }
  }
  return bookings;
}

export function buildProviderBookingsListResult<
  T extends ProviderListBooking,
>(options: {
  bookings: T[];
  params: Record<string, unknown>;
  statusFilter: string;
  action: 'list_bookings' | 'show_appointments';
  emptySummary: string;
  formatLabel: (booking: T) => string;
}): ProviderBookingsListResult {
  const { bookings, params, statusFilter, action, emptySummary, formatLabel } =
    options;

  if (bookings.length === 0) {
    return {
      success: true,
      action,
      summary: emptySummary,
      details: { matchedCount: 0 },
    };
  }

  const lines = bookings.map((b) => {
    const svc = b.service?.name ? ` · ${b.service.name}` : '';
    return `• ${formatLabel(b)}${svc} — ${b.status}`;
  });
  const dateLabel = params.date
    ? formatDateDisplay(String(params.date))
    : 'the selected day';
  const headline =
    statusFilter === 'upcoming' && bookings[0]
      ? `Next up: ${formatLabel(bookings[0])}${bookings[0].service?.name ? ` (${bookings[0].service.name})` : ''}`
      : `${bookings.length} appointment${bookings.length === 1 ? '' : 's'} on ${dateLabel}`;

  return {
    success: true,
    action,
    summary:
      statusFilter === 'upcoming' && bookings.length === 1
        ? headline
        : `${headline}:\n${lines.slice(0, 12).join('\n')}${lines.length > 12 ? `\n…and ${lines.length - 12} more` : ''}`,
    details: {
      matchedCount: bookings.length,
      bookings: bookings.map((b) => formatLabel(b)),
      serviceFilter: params.serviceName ?? null,
    },
  };
}

export function buildNoLinkedEmployeeAvailabilityResult(): CheckAvailabilityResult {
  return {
    success: false,
    action: 'check_availability',
    summary:
      'Open a provider profile linked to your account to check your own availability.',
    details: {},
  };
}

export function resolveAvailabilityDayBounds(isoDay: string): {
  day: Date;
  dayEnd: Date;
} {
  const day = new Date(isoDay);
  day.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setUTCHours(23, 59, 59, 999);
  return { day, dayEnd };
}

export function resolveAvailabilityTimeWindow(
  params: Record<string, unknown>,
): {
  timeFrom: string;
  timeTo: string;
} {
  return {
    timeFrom: params.timeFrom
      ? normalizeTime24(String(params.timeFrom))
      : '09:00',
    timeTo: params.timeTo ? normalizeTime24(String(params.timeTo)) : '19:00',
  };
}

export function buildSlotAvailabilityResult(options: {
  displayDay: string;
  slot: string;
  gaps: ScheduleGapLabel[];
}): CheckAvailabilityResult {
  const { displayDay, slot, gaps } = options;
  const open = gaps.some((g) => slot >= g.start && slot < g.end);
  return {
    success: true,
    action: 'check_availability',
    summary: open
      ? `Yes — you have an open slot at ${slot} on ${displayDay}.`
      : `No open slot at ${slot} on ${displayDay}. Open windows: ${gaps.map((g) => `${g.start}–${g.end}`).join(', ') || 'none'}.`,
    details: { date: displayDay, open, gaps, timeSlot: slot },
  };
}

export function buildAfternoonAvailabilityResult(options: {
  displayDay: string;
  gaps: ScheduleGapLabel[];
  timeFrom: string;
  timeTo: string;
}): CheckAvailabilityResult {
  const { displayDay, gaps, timeFrom, timeTo } = options;
  const afternoon = gaps.filter((g) => g.start >= '12:00');
  return {
    success: true,
    action: 'check_availability',
    summary:
      afternoon.length > 0
        ? `Afternoon gaps on ${displayDay}: ${afternoon.map((g) => `${g.start}–${g.end}`).join(', ')}.`
        : `No open afternoon gaps on ${displayDay} between ${timeFrom} and ${timeTo}.`,
    details: { date: displayDay, gaps: afternoon },
  };
}

export function buildGapsAvailabilityResult(options: {
  displayDay: string;
  gaps: ScheduleGapLabel[];
  timeFrom: string;
  timeTo: string;
}): CheckAvailabilityResult {
  const { displayDay, gaps, timeFrom, timeTo } = options;
  return {
    success: true,
    action: 'check_availability',
    summary:
      gaps.length > 0
        ? `Open slots on ${displayDay} (${timeFrom}–${timeTo}): ${gaps.map((g) => `${g.start}–${g.end}`).join(', ')}.`
        : `No open slots on ${displayDay} between ${timeFrom} and ${timeTo}.`,
    details: { date: displayDay, gaps },
  };
}

export function shouldUseAfternoonAvailability(
  prompt: string,
  params: Record<string, unknown>,
): boolean {
  return /afternoon/i.test(prompt) && !params.timeFrom;
}

export function prepareBlockScheduleParams(
  prompt: string,
  params: Record<string, unknown>,
  options: { scopedEmployeeId?: string | null; employeeName?: string | null },
): Record<string, unknown> {
  const next = { ...params };
  if (options.scopedEmployeeId) {
    next.allProviders = false;
    if (options.employeeName) next.employeeName = options.employeeName;
  }
  if (!next.date && !next.dateFrom) next.date = toIsoDay(todayDisplay());
  if (/lunch/i.test(prompt) && !next.timeFrom && !next.timeTo) {
    next.timeFrom = '12:00';
    next.timeTo = '13:00';
  }
  return next;
}

export function defaultUtilizationWeekRange(): { start: string; end: string } {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function utilizationScopeLabel(
  scopedEmployeeId?: string | null,
): string {
  return scopedEmployeeId ? 'Your utilization' : 'Team utilization';
}

export type UtilizationRow = {
  employeeName: string;
  utilizationPercent?: number;
  bookedMinutes?: number;
  totalMinutes?: number;
};

export function sortUtilizationRows(rows: UtilizationRow[]): UtilizationRow[] {
  return [...rows].sort(
    (a, b) => (a.utilizationPercent ?? 0) - (b.utilizationPercent ?? 0),
  );
}

export function buildUtilizationSummaryResult(options: {
  scopedEmployeeId?: string | null;
  range: { start: string; end: string };
  rows: UtilizationRow[];
}): {
  success: boolean;
  action: 'summarize_utilization';
  summary: string;
  details: Record<string, unknown>;
} {
  const sorted = sortUtilizationRows(options.rows);
  const lines = sorted.map(
    (u) =>
      `• ${u.employeeName}: ${u.utilizationPercent ?? 0}% (${u.bookedMinutes ?? 0}/${u.totalMinutes ?? 0} min)`,
  );
  const scopeLabel = utilizationScopeLabel(options.scopedEmployeeId);
  return {
    success: true,
    action: 'summarize_utilization',
    summary: [
      `${scopeLabel} ${options.range.start} → ${options.range.end}:`,
      ...lines,
    ].join('\n'),
    details: { range: options.range, utilization: sorted },
  };
}
