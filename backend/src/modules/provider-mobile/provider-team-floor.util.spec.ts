import {
  TEAM_FLOOR_CHIP_STATUS_SCENARIOS,
  TEAM_FLOOR_COLUMN_SCENARIOS,
} from './provider-team-floor.fixtures.js';
import {
  buildTeamFloorColumns,
  countTeamFloorStatuses,
  filterTeamFloorBookingsByEmployee,
  isValidTeamFloorEmployeeFilter,
  listTeamFloorProviders,
  normalizeTeamFloorEmployeeFilter,
  resolveTeamFloorChipStatus,
  UNASSIGNED_EMPLOYEE_ID,
} from './provider-team-floor.util.js';

describe('provider-team-floor.util (prov-exp-4.1)', () => {
  const mapBooking = (booking: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    employee?: { id: string; name: string } | null;
  }) => ({
    id: booking.id,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    checkedInAt: null,
    floorStatus: 'waiting' as const,
    teamFloorStatus: resolveTeamFloorChipStatus(booking),
    notes: null,
    service: null,
    customer: null,
    employee: booking.employee ?? null,
  });

  it.each(TEAM_FLOOR_CHIP_STATUS_SCENARIOS)(
    'resolveTeamFloorChipStatus — $id',
    ({ booking, expected }) => {
      expect(resolveTeamFloorChipStatus(booking)).toBe(expected);
    },
  );

  it.each(TEAM_FLOOR_COLUMN_SCENARIOS)(
    'buildTeamFloorColumns — $id',
    ({ bookings, expectedColumnIds, expectedFirstBookingIds }) => {
      const columns = buildTeamFloorColumns(bookings, mapBooking);
      expect(columns.map((column) => column.employeeId)).toEqual(expectedColumnIds);
      const alex = columns.find((column) => column.employeeId === 'emp-1');
      expect(alex?.bookings.map((booking) => booking.id)).toEqual(expectedFirstBookingIds);
    },
  );

  it('lists providers and filters bookings by employee', () => {
    const bookings = [
      {
        id: 'b1',
        startTime: '2026-06-09T10:00:00.000Z',
        endTime: '2026-06-09T11:00:00.000Z',
        status: 'confirmed',
        employee: { id: 'emp-1', name: 'Alex' },
      },
      {
        id: 'b2',
        startTime: '2026-06-09T12:00:00.000Z',
        endTime: '2026-06-09T13:00:00.000Z',
        status: 'confirmed',
        employee: { id: 'emp-2', name: 'Zara' },
      },
      {
        id: 'b3',
        startTime: '2026-06-09T14:00:00.000Z',
        endTime: '2026-06-09T15:00:00.000Z',
        status: 'confirmed',
        employee: null,
      },
    ];
    const providers = listTeamFloorProviders(bookings);
    expect(providers.map((provider) => provider.id).sort()).toEqual([
      UNASSIGNED_EMPLOYEE_ID,
      'emp-1',
      'emp-2',
    ]);
    expect(filterTeamFloorBookingsByEmployee(bookings, 'emp-1')).toHaveLength(1);
    expect(filterTeamFloorBookingsByEmployee(bookings, UNASSIGNED_EMPLOYEE_ID)).toHaveLength(1);
    expect(isValidTeamFloorEmployeeFilter(providers, 'emp-2')).toBe(true);
    expect(isValidTeamFloorEmployeeFilter(providers, 'missing')).toBe(false);
  });

  it('counts team floor statuses', () => {
    expect(
      countTeamFloorStatuses([
        { teamFloorStatus: 'waiting' },
        { teamFloorStatus: 'waiting' },
        { teamFloorStatus: 'done' },
      ]),
    ).toEqual({
      waiting: 2,
      in_service: 0,
      done: 1,
      no_show: 0,
    });
  });

  it('normalizes empty employee filters', () => {
    expect(normalizeTeamFloorEmployeeFilter('  ')).toBeNull();
    expect(normalizeTeamFloorEmployeeFilter('emp-1')).toBe('emp-1');
    expect(
      filterTeamFloorBookingsByEmployee(
        [
          {
            id: 'b1',
            startTime: '2026-06-09T10:00:00.000Z',
            endTime: '2026-06-09T11:00:00.000Z',
            status: 'confirmed',
            employee: { id: 'emp-1', name: 'Alex' },
          },
        ],
        null,
      ),
    ).toHaveLength(1);
  });
});
