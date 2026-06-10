/** prov-exp-4.3 — manager team queue for the next 2 hours. */

import { BookingStatus } from '../booking/entities/booking.entity.js';
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
  now: Date,
  windowEnd: Date,
): boolean {
  if (BLOCKED_STATUSES.has(booking.status)) return false;

  const startMs = new Date(booking.startTime).getTime();
  const endMs = new Date(booking.endTime).getTime();
  const nowMs = now.getTime();
  const windowEndMs = windowEnd.getTime();

  if (endMs <= nowMs) return false;
  if (startMs >= windowEndMs) return false;
  return true;
}

export function filterBookingsInTeamWhosNextWindow<T extends TeamWhosNextBookingLike>(
  bookings: T[],
  now: Date = new Date(),
): T[] {
  const { windowEnd } = buildTeamWhosNextWindow(now);
  return bookings.filter((booking) =>
    isBookingInTeamWhosNextWindow(booking, now, windowEnd),
  );
}

export function resolveNextQueueBookingId<T extends TeamWhosNextBookingLike>(
  queue: T[],
  now: Date = new Date(),
): string | null {
  const nowMs = now.getTime();
  const sorted = [...queue].sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const active = sorted.find((booking) => {
    if (booking.status === BookingStatus.IN_PROGRESS) return true;
    const startMs = new Date(booking.startTime).getTime();
    const endMs = new Date(booking.endTime).getTime();
    return startMs <= nowMs && endMs > nowMs;
  });
  if (active) return active.id;

  const upcoming = sorted.find(
    (booking) => new Date(booking.startTime).getTime() >= nowMs,
  );
  return upcoming?.id ?? sorted[0]?.id ?? null;
}

export function buildTeamWhosNextColumns<T extends TeamWhosNextBookingLike>(
  bookings: T[],
  mapQueueItem: (
    booking: T,
    meta: { isNext: boolean; queuePosition: number },
  ) => TeamWhosNextQueueItem,
  now: Date = new Date(),
): TeamWhosNextProviderColumn[] {
  const grouped = new Map<string, { employeeName: string; bookings: T[] }>();

  for (const booking of filterBookingsInTeamWhosNextWindow(bookings, now)) {
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
      const nextBookingId = resolveNextQueueBookingId(sorted, now);
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
  now: Date = new Date(),
): TeamWhosNextView {
  const { windowStart, windowEnd } = buildTeamWhosNextWindow(now);
  const columns = buildTeamWhosNextColumns(bookings, mapQueueItem, now);
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
    /across\s+(?:the\s+)?team|team(?:'s)?\s+(?:queue|schedule|floor)|all\s+providers|each\s+provider|every\s+provider|who'?s\s+next\s+(?:on\s+)?(?:the\s+)?team|next\s+2\s*h(?:ours?)?/.test(
      lower,
    )
  ) {
    return true;
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
