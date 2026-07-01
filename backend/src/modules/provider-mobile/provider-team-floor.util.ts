/** prov-exp-4.1 — manager team floor view for today's bookings. */

import { BookingStatus } from '../booking/entities/booking.entity.js';
import { resolveProviderBookingFloorStatus } from './provider-booking-check-in.util.js';

export type TeamFloorChipStatus = 'waiting' | 'in_service' | 'done' | 'no_show';

export const TEAM_FLOOR_CHIP_STATUSES: TeamFloorChipStatus[] = [
  'waiting',
  'in_service',
  'done',
  'no_show',
];

export interface TeamFloorBookingLike {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  checkedInAt?: Date | string | null;
  employee?: { id: string; name: string } | null;
}

export interface TeamFloorProviderOption {
  id: string;
  name: string;
}

export interface TeamFloorBookingView {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  checkedInAt: string | null;
  floorStatus: ReturnType<typeof resolveProviderBookingFloorStatus>;
  teamFloorStatus: TeamFloorChipStatus;
  notes: string | null;
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
  employee: { id: string; name: string } | null;
}

export interface TeamFloorColumnView {
  employeeId: string;
  employeeName: string;
  bookings: TeamFloorBookingView[];
  statusCounts: Record<TeamFloorChipStatus, number>;
}

export interface TeamFloorTodayView {
  date: string;
  viewMode: 'team';
  filterEmployeeId: string | null;
  providers: TeamFloorProviderOption[];
  columns: TeamFloorColumnView[];
  totalBookings: number;
}

const UNASSIGNED_EMPLOYEE_ID = '__unassigned__';

function parseCheckedInAt(value?: Date | string | null): boolean {
  if (!value) return false;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return !Number.isNaN(new Date(value).getTime());
}

export function resolveTeamFloorChipStatus(booking: {
  status: string;
  checkedInAt?: Date | string | null;
}): TeamFloorChipStatus {
  if (booking.status === BookingStatus.NO_SHOW) return 'no_show';
  if (booking.status === BookingStatus.COMPLETED) return 'done';
  if (booking.status === BookingStatus.IN_PROGRESS) return 'in_service';
  if (parseCheckedInAt(booking.checkedInAt)) return 'in_service';
  return 'waiting';
}

export function emptyTeamFloorStatusCounts(): Record<
  TeamFloorChipStatus,
  number
> {
  return {
    waiting: 0,
    in_service: 0,
    done: 0,
    no_show: 0,
  };
}

export function countTeamFloorStatuses(
  bookings: Array<{ teamFloorStatus: TeamFloorChipStatus }>,
): Record<TeamFloorChipStatus, number> {
  const counts = emptyTeamFloorStatusCounts();
  for (const booking of bookings) {
    counts[booking.teamFloorStatus] += 1;
  }
  return counts;
}

export function listTeamFloorProviders(
  bookings: TeamFloorBookingLike[],
): TeamFloorProviderOption[] {
  const byId = new Map<string, string>();
  for (const booking of bookings) {
    const employee = booking.employee;
    if (!employee?.id) {
      byId.set(UNASSIGNED_EMPLOYEE_ID, 'Unassigned');
      continue;
    }
    byId.set(employee.id, employee.name);
  }
  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function normalizeTeamFloorEmployeeFilter(
  employeeId?: string | null,
): string | null {
  const trimmed = employeeId?.trim();
  return trimmed ? trimmed : null;
}

export function filterTeamFloorBookingsByEmployee<
  T extends TeamFloorBookingLike,
>(bookings: T[], employeeId: string | null): T[] {
  if (!employeeId) return bookings;
  if (employeeId === UNASSIGNED_EMPLOYEE_ID) {
    return bookings.filter((booking) => !booking.employee?.id);
  }
  return bookings.filter((booking) => booking.employee?.id === employeeId);
}

export function buildTeamFloorColumns<T extends TeamFloorBookingLike>(
  bookings: T[],
  mapBooking: (booking: T) => TeamFloorBookingView,
): TeamFloorColumnView[] {
  const grouped = new Map<string, { employeeName: string; bookings: T[] }>();

  for (const booking of bookings) {
    const employeeId = booking.employee?.id ?? UNASSIGNED_EMPLOYEE_ID;
    const employeeName = booking.employee?.name ?? 'Unassigned';
    const entry = grouped.get(employeeId) ?? { employeeName, bookings: [] };
    entry.bookings.push(booking);
    grouped.set(employeeId, entry);
  }

  return [...grouped.entries()]
    .map(([employeeId, entry]) => {
      const mapped = [...entry.bookings]
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        )
        .map(mapBooking);
      return {
        employeeId,
        employeeName: entry.employeeName,
        bookings: mapped,
        statusCounts: countTeamFloorStatuses(mapped),
      };
    })
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

export function isValidTeamFloorEmployeeFilter(
  providers: TeamFloorProviderOption[],
  employeeId: string | null,
): boolean {
  if (!employeeId) return true;
  return providers.some((provider) => provider.id === employeeId);
}

export { UNASSIGNED_EMPLOYEE_ID };
