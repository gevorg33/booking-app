/** prov-exp-4.3 — manager team queue for the next 2 hours. */

import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  getWallClockNowFromInstant,
  isWallClockRangeActiveAt,
  isWallClockStartInPastAt,
  isWallClockStartStrictlyFutureAt,
  minutesUntilWallClockStartAt,
  wallClockDateKeyFromDate,
  wallClockMinutesFromDate,
} from '../../common/utils/timezone.util.js';
import { resolveTeamFloorChipStatus } from './provider-team-floor.util.js';

export const TEAM_WHOS_NEXT_WINDOW_HOURS = 2;

const BLOCKED_STATUSES = new Set<string>([
  BookingStatus.CANCELLED,
  BookingStatus.COMPLETED,
  BookingStatus.NO_SHOW,
]);

export interface TeamWhosNextBookingLike {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  checkedInAt?: Date | string | null;
  employee?: { id: string; name: string } | null;
}

export interface TeamWhosNextQueueItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  isNext: boolean;
  queuePosition: number;
  teamFloorStatus: ReturnType<typeof resolveTeamFloorChipStatus>;
  service: {
    id: string;
    name: string;
    price?: number;
    currency?: string;
  } | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

export interface TeamWhosNextProviderColumn {
  employeeId: string;
  employeeName: string;
  nextBookingId: string | null;
  queue: TeamWhosNextQueueItem[];
}

export interface TeamWhosNextView {
  viewMode: 'team';
  windowHours: number;
  windowStart: string;
  windowEnd: string;
  columns: TeamWhosNextProviderColumn[];
  totalQueued: number;
}

const UNASSIGNED_EMPLOYEE_ID = '__unassigned__';

export function buildTeamWhosNextWindow(now: Date = new Date()): {
  windowStart: Date;
  windowEnd: Date;
} {
  const windowStart = new Date(now);
  const windowEnd = new Date(
    now.getTime() + TEAM_WHOS_NEXT_WINDOW_HOURS * 60 * 60 * 1000,
  );
  return { windowStart, windowEnd };
}

export function isBookingInTeamWhosNextWindow(
  booking: Pick<TeamWhosNextBookingLike, 'startTime' | 'endTime' | 'status'>,
  timeZone: string,
  now: Date = new Date(),
): boolean {
  if (BLOCKED_STATUSES.has(booking.status)) return false;

  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  const wallNow = getWallClockNowFromInstant(now, timeZone);
  if (isWallClockStartInPastAt(end, wallNow)) return false;

  if (isWallClockRangeActiveAt(start, end, wallNow)) return true;

  if (!isWallClockStartStrictlyFutureAt(start, wallNow)) return false;

  const startDay = wallClockDateKeyFromDate(start);
  if (startDay !== wallNow.dateKey) return false;

  return (
    minutesUntilWallClockStartAt(start, wallNow) <
    TEAM_WHOS_NEXT_WINDOW_HOURS * 60
  );
}

export function filterBookingsInTeamWhosNextWindow<T extends TeamWhosNextBookingLike>(
  bookings: T[],
  timeZone: string,
  now: Date = new Date(),
): T[] {
  return bookings.filter((booking) =>
    isBookingInTeamWhosNextWindow(booking, timeZone, now),
  );
}

export function resolveNextQueueBookingId<T extends TeamWhosNextBookingLike>(
  queue: T[],
  timeZone: string,
  now: Date = new Date(),
): string | null {
  const wallNow = getWallClockNowFromInstant(now, timeZone);
  const sorted = [...queue].sort(
    (a, b) =>
      wallClockMinutesFromDate(new Date(a.startTime)) -
      wallClockMinutesFromDate(new Date(b.startTime)),
  );

  const active = sorted.find((booking) => {
    if (booking.status === BookingStatus.IN_PROGRESS) return true;
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    return isWallClockRangeActiveAt(start, end, wallNow);
  });
  if (active) return active.id;

  const upcoming = sorted.find((booking) =>
    isWallClockStartStrictlyFutureAt(new Date(booking.startTime), wallNow),
  );
  return upcoming?.id ?? sorted[0]?.id ?? null;
}

export function buildTeamWhosNextColumns<T extends TeamWhosNextBookingLike>(
  bookings: T[],
  mapQueueItem: (
    booking: T,
    meta: { isNext: boolean; queuePosition: number },
  ) => TeamWhosNextQueueItem,
  timeZone: string,
  now: Date = new Date(),
): TeamWhosNextProviderColumn[] {
  const grouped = new Map<string, { employeeName: string; bookings: T[] }>();

  for (const booking of filterBookingsInTeamWhosNextWindow(
    bookings,
    timeZone,
    now,
  )) {
    const employeeId = booking.employee?.id ?? UNASSIGNED_EMPLOYEE_ID;
    const employeeName = booking.employee?.name ?? 'Unassigned';
    const entry = grouped.get(employeeId) ?? { employeeName, bookings: [] };
    entry.bookings.push(booking);
    grouped.set(employeeId, entry);
  }

  return [...grouped.entries()]
    .map(([employeeId, entry]) => {
      const sorted = [...entry.bookings].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
      const nextBookingId = resolveNextQueueBookingId(sorted, timeZone, now);
      const queue = sorted.map((booking, index) =>
        mapQueueItem(booking, {
          isNext: booking.id === nextBookingId,
          queuePosition: index + 1,
        }),
      );
      return {
        employeeId,
        employeeName: entry.employeeName,
        nextBookingId,
        queue,
      };
    })
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

export function buildTeamWhosNextView<T extends TeamWhosNextBookingLike>(
  bookings: T[],
  mapQueueItem: (
    booking: T,
    meta: { isNext: boolean; queuePosition: number },
  ) => TeamWhosNextQueueItem,
  timeZone: string,
  now: Date = new Date(),
): TeamWhosNextView {
  const { windowStart, windowEnd } = buildTeamWhosNextWindow(now);
  const columns = buildTeamWhosNextColumns(
    bookings,
    mapQueueItem,
    timeZone,
    now,
  );
  return {
    viewMode: 'team',
    windowHours: TEAM_WHOS_NEXT_WINDOW_HOURS,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    columns,
    totalQueued: columns.reduce((sum, column) => sum + column.queue.length, 0),
  };
}

export function isTeamWhosNextPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    /across\s+(?:the\s+)?team|team(?:'s)?\s+queue|who'?s\s+next\s+(?:on\s+)?(?:the\s+)?team|next\s+2\s*h(?:ours?)?/.test(
      lower,
    )
  ) {
    return true;
  }
  if (
    /(?:who'?s\s+next|who\s+is\s+next|show\s+who\s+is\s+next).*(?:all\s+providers|every\s+provider|each\s+provider)|(?:all\s+providers|every\s+provider|each\s+provider).*(?:who'?s\s+next|who\s+is\s+next|next\s+in\s+(?:the\s+)?queue)/.test(
      lower,
    )
  ) {
    return true;
  }
  if (/[\u0530-\u058F]/.test(prompt)) {
    return (
      /(թիմ.*(հաջորդ|next)|next.*2.*(ժամ|hour).*թիմ|հաջորդ.*2.*ժամ.*թիմ|(բոլոր.*provider|provider.*բոլոր).*(հաջորդ|next)|(հաջորդ|next).*(բոլոր.*provider|provider.*բոլոր))/i.test(
        prompt,
      )
    );
  }
  if (/[\u0400-\u04FF]/.test(prompt)) {
    return (
      /(команд.*(следующ|next)|следующ.*(команд|2.*час)|всех\s+провайдер.*(следующ|next)|следующ.*всех\s+провайдер)/i.test(
        prompt,
      )
    );
  }
  return false;
}

export function buildTeamWhosNextSummary(
  columns: TeamWhosNextProviderColumn[],
  formatTime: (iso: string) => string,
): string {
  if (columns.length === 0) {
    return 'No upcoming team appointments in the next 2 hours.';
  }

  const lines = columns.map((column) => {
    const next = column.queue.find((item) => item.isNext);
    if (!next) {
      return `• ${column.employeeName}: no upcoming clients`;
    }
    const customer = next.customer?.name ?? 'Walk-in';
    const service = next.service?.name ? ` (${next.service.name})` : '';
    const more =
      column.queue.length > 1
        ? ` — ${column.queue.length - 1} more in queue`
        : '';
    return `• ${column.employeeName}: ${customer} at ${formatTime(next.startTime)}${service}${more}`;
  });

  return `Team queue — next 2 hours:\n${lines.join('\n')}`;
}

export { UNASSIGNED_EMPLOYEE_ID };
