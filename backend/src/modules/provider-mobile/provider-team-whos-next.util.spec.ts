import {
  TEAM_WHOS_NEXT_COLUMN_SCENARIOS,
  TEAM_WHOS_NEXT_PROMPT_SCENARIOS,
  TEAM_WHOS_NEXT_WINDOW_SCENARIOS,
} from './provider-team-whos-next.fixtures.js';
import {
  buildTeamWhosNextColumns,
  buildTeamWhosNextSummary,
  buildTeamWhosNextView,
  buildTeamWhosNextWindow,
  filterBookingsInTeamWhosNextWindow,
  isBookingInTeamWhosNextWindow,
  isTeamWhosNextPrompt,
  resolveNextQueueBookingId,
  TEAM_WHOS_NEXT_WINDOW_HOURS,
} from './provider-team-whos-next.util.js';
import { resolveTeamFloorChipStatus } from './provider-team-floor.util.js';

describe('provider-team-whos-next.util (prov-exp-4.3)', () => {
  it('uses a 2 hour window', () => {
    const now = new Date('2026-06-09T10:00:00.000Z');
    const { windowStart, windowEnd } = buildTeamWhosNextWindow(now);
    expect(TEAM_WHOS_NEXT_WINDOW_HOURS).toBe(2);
    expect(windowStart.toISOString()).toBe(now.toISOString());
    expect(windowEnd.toISOString()).toBe('2026-06-09T12:00:00.000Z');
  });

  it.each(TEAM_WHOS_NEXT_WINDOW_SCENARIOS)(
    'window filter $id',
    ({ now, booking, expected }) => {
      const current = new Date(now);
      expect(isBookingInTeamWhosNextWindow(booking, 'UTC', current)).toBe(
        expected,
      );
    },
  );

  it.each(TEAM_WHOS_NEXT_COLUMN_SCENARIOS)(
    'builds ordered provider columns $id',
    ({
      now,
      bookings,
      expectedColumnIds,
      expectedNextBookingIds,
      expectedQueueLengths,
    }) => {
      const current = new Date(now);
      const columns = buildTeamWhosNextColumns(
        bookings,
        (booking, meta) => ({
          id: booking.id,
          startTime: String(booking.startTime),
          endTime: String(booking.endTime),
          status: booking.status,
          isNext: meta.isNext,
          queuePosition: meta.queuePosition,
          teamFloorStatus: resolveTeamFloorChipStatus(booking),
          service: null,
          customer: null,
        }),
        'UTC',
        current,
      );

      expect(columns.map((column) => column.employeeId)).toEqual(
        expectedColumnIds,
      );
      expect(columns.map((column) => column.nextBookingId)).toEqual(
        expectedNextBookingIds,
      );
      expect(columns.map((column) => column.queue.length)).toEqual(
        expectedQueueLengths,
      );
    },
  );

  it('marks in-progress booking as next when it started before now', () => {
    const now = new Date('2026-06-09T10:30:00.000Z');
    const bookings = [
      {
        id: 'active',
        startTime: '2026-06-09T10:00:00.000Z',
        endTime: '2026-06-09T11:00:00.000Z',
        status: 'in_progress',
        employee: { id: 'emp-1', name: 'Alex' },
      },
      {
        id: 'later',
        startTime: '2026-06-09T11:15:00.000Z',
        endTime: '2026-06-09T12:00:00.000Z',
        status: 'confirmed',
        employee: { id: 'emp-1', name: 'Alex' },
      },
    ];

    expect(resolveNextQueueBookingId(bookings, 'UTC', now)).toBe('active');
    const filtered = filterBookingsInTeamWhosNextWindow(bookings, 'UTC', now);
    expect(filtered.map((booking) => booking.id)).toEqual(['active', 'later']);
  });

  it('builds summary lines per provider', () => {
    const summary = buildTeamWhosNextSummary(
      [
        {
          employeeId: 'emp-1',
          employeeName: 'Alex',
          nextBookingId: 'b1',
          queue: [
            {
              id: 'b1',
              startTime: '2026-06-09T10:30:00.000Z',
              endTime: '2026-06-09T11:30:00.000Z',
              status: 'confirmed',
              isNext: true,
              queuePosition: 1,
              teamFloorStatus: 'waiting',
              service: { id: 'svc-1', name: 'Haircut' },
              customer: { id: 'c1', name: 'Jane', phone: null, email: null },
            },
            {
              id: 'b2',
              startTime: '2026-06-09T11:30:00.000Z',
              endTime: '2026-06-09T12:30:00.000Z',
              status: 'confirmed',
              isNext: false,
              queuePosition: 2,
              teamFloorStatus: 'waiting',
              service: null,
              customer: null,
            },
          ],
        },
      ],
      (iso) => iso.slice(11, 16),
    );

    expect(summary).toContain('Alex');
    expect(summary).toContain('Jane');
    expect(summary).toContain('Haircut');
    expect(summary).toContain('1 more in queue');
  });

  it('handles summary rows without a marked next booking', () => {
    const summary = buildTeamWhosNextSummary(
      [
        {
          employeeId: 'emp-1',
          employeeName: 'Alex',
          nextBookingId: null,
          queue: [
            {
              id: 'b1',
              startTime: '2026-06-09T10:30:00.000Z',
              endTime: '2026-06-09T11:30:00.000Z',
              status: 'confirmed',
              isNext: false,
              queuePosition: 1,
              teamFloorStatus: 'waiting',
              service: null,
              customer: null,
            },
          ],
        },
      ],
      () => '10:30',
    );

    expect(summary).toContain('no upcoming clients');
  });

  it('groups unassigned bookings into a column', () => {
    const columns = buildTeamWhosNextColumns(
      [
        {
          id: 'b1',
          startTime: '2026-06-09T10:30:00.000Z',
          endTime: '2026-06-09T11:30:00.000Z',
          status: 'confirmed',
          employee: null,
        },
      ],
      (booking, meta) => ({
        id: booking.id,
        startTime: String(booking.startTime),
        endTime: String(booking.endTime),
        status: booking.status,
        isNext: meta.isNext,
        queuePosition: meta.queuePosition,
        teamFloorStatus: 'waiting',
        service: null,
        customer: null,
      }),
      'UTC',
      new Date('2026-06-09T10:00:00.000Z'),
    );

    expect(columns[0]?.employeeName).toBe('Unassigned');
  });

  it('prefers in-progress and overlapping bookings as next', () => {
    const now = new Date('2026-06-09T10:30:00.000Z');
    expect(
      resolveNextQueueBookingId(
        [
          {
            id: 'in-progress',
            startTime: '2026-06-09T10:00:00.000Z',
            endTime: '2026-06-09T11:00:00.000Z',
            status: 'in_progress',
          },
          {
            id: 'later',
            startTime: '2026-06-09T11:15:00.000Z',
            endTime: '2026-06-09T12:00:00.000Z',
            status: 'confirmed',
          },
        ],
        'UTC',
        now,
      ),
    ).toBe('in-progress');
    expect(
      resolveNextQueueBookingId(
        [
          {
            id: 'overlap',
            startTime: '2026-06-09T10:00:00.000Z',
            endTime: '2026-06-09T11:00:00.000Z',
            status: 'confirmed',
          },
          {
            id: 'later',
            startTime: '2026-06-09T11:15:00.000Z',
            endTime: '2026-06-09T12:00:00.000Z',
            status: 'confirmed',
          },
        ],
        'UTC',
        now,
      ),
    ).toBe('overlap');
    expect(
      resolveNextQueueBookingId(
        [
          {
            id: 'future',
            startTime: '2026-06-09T11:00:00.000Z',
            endTime: '2026-06-09T12:00:00.000Z',
            status: 'confirmed',
          },
        ],
        'UTC',
        now,
      ),
    ).toBe('future');
    expect(resolveNextQueueBookingId([], 'UTC', now)).toBeNull();
  });

  it('uses the earliest upcoming booking when nothing is active yet', () => {
    const now = new Date('2026-06-09T10:00:00.000Z');
    expect(
      resolveNextQueueBookingId(
        [
          {
            id: 'second',
            startTime: '2026-06-09T11:00:00.000Z',
            endTime: '2026-06-09T12:00:00.000Z',
            status: 'confirmed',
          },
          {
            id: 'first',
            startTime: '2026-06-09T10:30:00.000Z',
            endTime: '2026-06-09T11:30:00.000Z',
            status: 'confirmed',
          },
        ],
        'UTC',
        now,
      ),
    ).toBe('first');
  });

  it('excludes ended and out-of-window bookings from the filter', () => {
    const now = new Date('2026-06-09T10:00:00.000Z');
    expect(
      isBookingInTeamWhosNextWindow(
        {
          startTime: '2026-06-09T09:00:00.000Z',
          endTime: '2026-06-09T09:30:00.000Z',
          status: 'confirmed',
        },
        'UTC',
        now,
      ),
    ).toBe(false);
    expect(
      filterBookingsInTeamWhosNextWindow(
        [
          {
            id: 'cancelled',
            startTime: '2026-06-09T10:30:00.000Z',
            endTime: '2026-06-09T11:30:00.000Z',
            status: 'cancelled',
          },
        ],
        'UTC',
        now,
      ),
    ).toEqual([]);
  });

  it('summarizes walk-in clients without extra queue suffix', () => {
    const summary = buildTeamWhosNextSummary(
      [
        {
          employeeId: 'emp-1',
          employeeName: 'Alex',
          nextBookingId: 'b1',
          queue: [
            {
              id: 'b1',
              startTime: '2026-06-09T10:30:00.000Z',
              endTime: '2026-06-09T11:30:00.000Z',
              status: 'confirmed',
              isNext: true,
              queuePosition: 1,
              teamFloorStatus: 'waiting',
              service: null,
              customer: null,
            },
          ],
        },
      ],
      () => '10:30',
    );

    expect(summary).toContain('Walk-in');
    expect(summary).not.toContain('more in queue');
  });

  it('blocks bookings starting at or after the window end', () => {
    const now = new Date('2026-06-09T10:00:00.000Z');
    expect(
      isBookingInTeamWhosNextWindow(
        {
          startTime: '2026-06-09T12:00:00.000Z',
          endTime: '2026-06-09T13:00:00.000Z',
          status: 'confirmed',
        },
        'UTC',
        now,
      ),
    ).toBe(false);
  });

  it('returns empty summary when no columns', () => {
    expect(buildTeamWhosNextSummary([], () => '10:30')).toMatch(
      /No upcoming team appointments/,
    );
  });

  it.each(TEAM_WHOS_NEXT_PROMPT_SCENARIOS)(
    'detects team prompt $id',
    ({ prompt, expected }) => {
      expect(isTeamWhosNextPrompt(prompt)).toBe(expected);
    },
  );

  it('excludes past wall-clock bookings in Asia/Yerevan', () => {
    const now = new Date('2026-06-29T13:01:00.000Z');
    expect(
      isBookingInTeamWhosNextWindow(
        {
          startTime: '2026-06-29T16:30:00.000Z',
          endTime: '2026-06-29T17:00:00.000Z',
          status: 'confirmed',
        },
        'Asia/Yerevan',
        now,
      ),
    ).toBe(false);
  });

  it('buildTeamWhosNextView aggregates totals', () => {
    const view = buildTeamWhosNextView(
      [
        {
          id: 'b1',
          startTime: '2026-06-09T10:30:00.000Z',
          endTime: '2026-06-09T11:30:00.000Z',
          status: 'confirmed',
          employee: { id: 'emp-1', name: 'Alex' },
        },
      ],
      (booking, meta) => ({
        id: booking.id,
        startTime: String(booking.startTime),
        endTime: String(booking.endTime),
        status: booking.status,
        isNext: meta.isNext,
        queuePosition: meta.queuePosition,
        teamFloorStatus: 'waiting',
        service: null,
        customer: null,
      }),
      'UTC',
      new Date('2026-06-09T10:00:00.000Z'),
    );

    expect(view.totalQueued).toBe(1);
    expect(view.columns).toHaveLength(1);
  });
});
