import { describe, expect, it } from '@jest/globals';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  buildAfternoonAvailabilityResult,
  buildGapsAvailabilityResult,
  buildNoLinkedEmployeeAvailabilityResult,
  buildProviderBookingsListResult,
  buildSlotAvailabilityResult,
  buildUtilizationSummaryResult,
  defaultUtilizationWeekRange,
  filterBookingsForProviderList,
  isWhosNextPrompt,
  mapScheduleGapLabels,
  mergeShowAppointmentsParams,
  prepareBlockScheduleParams,
  resolveAvailabilityDayBounds,
  resolveAvailabilityTimeWindow,
  resolveStatusFilter,
  shouldUseAfternoonAvailability,
  sortBookingsByStartTime,
  sortUtilizationRows,
  utilizationScopeLabel,
} from './provider-ai-sprint19.util.js';

describe('provider-ai-sprint19.util', () => {
  it('maps schedule gap labels', () => {
    expect(
      mapScheduleGapLabels([{ startTime: '10:00', endTime: '11:00' }]),
    ).toEqual([{ start: '10:00', end: '11:00' }]);
  });

  it('detects who is next prompts and merges params', () => {
    expect(isWhosNextPrompt("Who's next?")).toBe(true);
    const merged = mergeShowAppointmentsParams("Who's next?", {});
    expect(merged.statusFilter).toBe('upcoming');
    expect(merged.date).toBeTruthy();
    expect(merged.nextOnly).toBe(true);
    const kept = mergeShowAppointmentsParams("Who's next?", {
      date: '2026-06-01',
    });
    expect(kept.date).toBe('2026-06-01');
    expect(
      mergeShowAppointmentsParams('List today', { date: '2026-06-01' }),
    ).toEqual({
      date: '2026-06-01',
    });
    expect(isWhosNextPrompt("Who's my next client?")).toBe(true);
    expect(isWhosNextPrompt("Who's up next?")).toBe(true);
    expect(
      mergeShowAppointmentsParams("Who's my next client?", {}).nextOnly,
    ).toBe(true);
    expect(
      resolveStatusFilter({ statusFilter: 'upcoming', status: 'pending' }),
    ).toBe('upcoming');
    expect(resolveStatusFilter({ status: 'pending' })).toBe('pending');
    expect(resolveStatusFilter({})).toBe('');
    expect(resolveStatusFilter({ statusFilter: null, status: 'pending' })).toBe(
      'pending',
    );
    expect(
      filterBookingsForProviderList([], 'null', 0, () => undefined),
    ).toEqual([]);
  });

  it('defaults show_appointments to today when no date is given (ai-cmd-provider-6.2.5)', () => {
    const bare = mergeShowAppointmentsParams('Show my confirmed bookings', {});
    expect(bare.date).toBeTruthy();

    const explicit = mergeShowAppointmentsParams('List all for tomorrow', {
      date: '2026-06-02',
    });
    expect(explicit.date).toBe('2026-06-02');
  });

  it('filters upcoming and status-specific bookings', () => {
    const now = Date.now();
    const bookings = [
      {
        startTime: new Date(now + 60_000),
        status: BookingStatus.CONFIRMED,
        service: { name: 'Cut' },
      },
      {
        startTime: new Date(now - 60_000),
        status: BookingStatus.CONFIRMED,
        service: null,
      },
      {
        startTime: new Date(now + 120_000),
        status: BookingStatus.CANCELLED,
        service: null,
      },
    ];
    const upcoming = filterBookingsForProviderList(
      bookings,
      'upcoming',
      now,
      () => undefined,
    );
    expect(upcoming).toHaveLength(1);
    const sorted = sortBookingsByStartTime([
      {
        startTime: new Date(now + 120_000),
        status: BookingStatus.CONFIRMED,
        service: null,
      },
      {
        startTime: new Date(now + 60_000),
        status: BookingStatus.CONFIRMED,
        service: null,
      },
    ]);
    expect(sorted[0].startTime.getTime()).toBeLessThan(
      sorted[1].startTime.getTime(),
    );
    const confirmed = filterBookingsForProviderList(
      bookings,
      'confirmed',
      now,
      () => BookingStatus.CONFIRMED,
    );
    expect(confirmed).toHaveLength(2);
    const completed = filterBookingsForProviderList(
      bookings,
      'completed',
      now,
      () => undefined,
    );
    expect(completed).toHaveLength(bookings.length);
  });

  it('builds provider booking list summaries', () => {
    const future = new Date(Date.now() + 3_600_000);
    const empty = buildProviderBookingsListResult({
      bookings: [],
      params: {},
      statusFilter: 'upcoming',
      action: 'show_appointments',
      emptySummary: 'None',
      formatLabel: () => 'label',
    });
    expect(empty.summary).toBe('None');

    const single = buildProviderBookingsListResult({
      bookings: [
        {
          id: 'booking-next-1',
          startTime: future,
          status: BookingStatus.CONFIRMED,
          service: { name: 'Spa' },
        },
      ],
      params: { date: '2026-06-02' },
      statusFilter: 'upcoming',
      action: 'show_appointments',
      emptySummary: 'None',
      formatLabel: () => '10:00 Client',
    });
    expect(single.summary).toMatch(/Next up:.*\(Spa\)/);
    expect(single.details.bookingId).toBe('booking-next-1');

    const singleNoService = buildProviderBookingsListResult({
      bookings: [
        { startTime: future, status: BookingStatus.CONFIRMED, service: null },
      ],
      params: { date: '2026-06-02' },
      statusFilter: 'upcoming',
      action: 'show_appointments',
      emptySummary: 'None',
      formatLabel: () => '10:00 Client',
    });
    expect(singleNoService.summary).toMatch(/Next up: 10:00 Client$/m);

    const upcomingTwo = buildProviderBookingsListResult({
      bookings: [
        { startTime: future, status: BookingStatus.CONFIRMED, service: null },
        {
          startTime: new Date(future.getTime() + 1000),
          status: BookingStatus.CONFIRMED,
          service: null,
        },
      ],
      params: { date: '2026-06-02' },
      statusFilter: 'upcoming',
      action: 'show_appointments',
      emptySummary: 'None',
      formatLabel: () => 'slot',
    });
    expect(upcomingTwo.summary).toContain(':\n•');

    const many = buildProviderBookingsListResult({
      bookings: Array.from({ length: 14 }, (_, i) => ({
        startTime: new Date(future.getTime() + i * 1000),
        status: BookingStatus.CONFIRMED,
        service: null,
      })),
      params: { date: '2026-06-02' },
      statusFilter: '',
      action: 'list_bookings',
      emptySummary: 'None',
      formatLabel: () => 'row',
    });
    expect(many.summary).toMatch(/…and 2 more/);

    const oneOnDay = buildProviderBookingsListResult({
      bookings: [
        { startTime: future, status: BookingStatus.CONFIRMED, service: null },
      ],
      params: {},
      statusFilter: '',
      action: 'list_bookings',
      emptySummary: 'None',
      formatLabel: () => 'row',
    });
    expect(oneOnDay.summary).toMatch(/1 appointment on the selected day/);

    const listMulti = buildProviderBookingsListResult({
      bookings: [
        {
          startTime: future,
          status: BookingStatus.CONFIRMED,
          service: { name: 'Color' },
        },
        {
          startTime: new Date(future.getTime() + 1000),
          status: BookingStatus.CONFIRMED,
          service: null,
        },
      ],
      params: { date: '2026-06-02' },
      statusFilter: '',
      action: 'show_appointments',
      emptySummary: 'None',
      formatLabel: () => '10:00 Sam',
    });
    expect(listMulti.summary).toMatch(/2 appointments on/);
    expect(listMulti.summary).toContain('•');
    expect(buildNoLinkedEmployeeAvailabilityResult().action).toBe(
      'check_availability',
    );
  });

  it('builds availability summaries', () => {
    expect(buildNoLinkedEmployeeAvailabilityResult().success).toBe(false);
    expect(
      buildSlotAvailabilityResult({
        displayDay: '02/06/2026',
        slot: '14:00',
        gaps: [{ start: '13:00', end: '15:00' }],
      }).summary,
    ).toMatch(/Yes/);
    expect(
      buildSlotAvailabilityResult({
        displayDay: '02/06/2026',
        slot: '08:00',
        gaps: [{ start: '13:00', end: '15:00' }],
      }).summary,
    ).toMatch(/No open slot/);
    expect(
      buildSlotAvailabilityResult({
        displayDay: '02/06/2026',
        slot: '08:00',
        gaps: [],
      }).summary,
    ).toMatch(/none/);
    expect(
      buildAfternoonAvailabilityResult({
        displayDay: '02/06/2026',
        gaps: [
          { start: '13:00', end: '14:00' },
          { start: '10:00', end: '11:00' },
        ],
        timeFrom: '09:00',
        timeTo: '19:00',
      }).summary,
    ).toMatch(/Afternoon gaps/);
    expect(
      buildAfternoonAvailabilityResult({
        displayDay: '02/06/2026',
        gaps: [{ start: '09:00', end: '10:00' }],
        timeFrom: '09:00',
        timeTo: '19:00',
      }).summary,
    ).toMatch(/No open afternoon/);
    expect(
      buildGapsAvailabilityResult({
        displayDay: '02/06/2026',
        gaps: [],
        timeFrom: '09:00',
        timeTo: '19:00',
      }).summary,
    ).toMatch(/No open slots/);
    expect(
      buildGapsAvailabilityResult({
        displayDay: '02/06/2026',
        gaps: [{ start: '10:00', end: '11:00' }],
        timeFrom: '09:00',
        timeTo: '19:00',
      }).summary,
    ).toMatch(/Open slots on/);
    expect(
      resolveAvailabilityDayBounds('2026-06-02').dayEnd.getUTCHours(),
    ).toBe(23);
    expect(
      resolveAvailabilityTimeWindow({ timeFrom: '8:00', timeTo: '17:30' }),
    ).toEqual({
      timeFrom: '08:00',
      timeTo: '17:30',
    });
    expect(shouldUseAfternoonAvailability('gaps this afternoon', {})).toBe(
      true,
    );
    expect(shouldUseAfternoonAvailability('gaps', { timeFrom: '12:00' })).toBe(
      false,
    );
  });

  it('prepares block schedule params with lunch defaults', () => {
    const params = prepareBlockScheduleParams(
      'Block lunch today',
      {},
      {
        scopedEmployeeId: 'emp-1',
        employeeName: 'Alex',
      },
    );
    expect(params.allProviders).toBe(false);
    expect(params.employeeName).toBe('Alex');
    expect(params.timeFrom).toBe('12:00');
    expect(params.timeTo).toBe('13:00');
    expect(params.date).toBeTruthy();

    const team = prepareBlockScheduleParams(
      'Block break',
      { dateFrom: '2026-06-03' },
      {},
    );
    expect(team.allProviders).toBeUndefined();
    expect(team.dateFrom).toBe('2026-06-03');
    const scopedNoName = prepareBlockScheduleParams(
      'Block break',
      {},
      { scopedEmployeeId: 'emp-2' },
    );
    expect(scopedNoName.allProviders).toBe(false);
    expect(scopedNoName.employeeName).toBeUndefined();
    const keepTimes = prepareBlockScheduleParams(
      'Block lunch',
      { timeFrom: '11:00' },
      {},
    );
    expect(keepTimes.timeFrom).toBe('11:00');
    expect(keepTimes.timeTo).toBeUndefined();
    expect(sortUtilizationRows([])).toEqual([]);
  });

  it('builds utilization summary and helpers', () => {
    const range = defaultUtilizationWeekRange();
    expect(range.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(utilizationScopeLabel('emp')).toBe('Your utilization');
    expect(utilizationScopeLabel(null)).toBe('Team utilization');
    expect(
      sortUtilizationRows([
        { employeeName: 'B', utilizationPercent: 80 },
        { employeeName: 'A', utilizationPercent: 40 },
      ]).map((r) => r.employeeName),
    ).toEqual(['A', 'B']);
    const summary = buildUtilizationSummaryResult({
      scopedEmployeeId: null,
      range,
      rows: [
        {
          employeeName: 'Alex',
          utilizationPercent: 55,
          bookedMinutes: 120,
          totalMinutes: 220,
        },
      ],
    });
    expect(summary.action).toBe('summarize_utilization');
    expect(summary.summary).toMatch(/Team utilization/);
    expect(summary.summary).toMatch(/Alex: 55%/);

    const sparse = buildUtilizationSummaryResult({
      scopedEmployeeId: 'emp-1',
      range,
      rows: [{ employeeName: 'Sam' }],
    });
    expect(sparse.summary).toMatch(/Your utilization/);
    expect(sparse.summary).toMatch(/0\/0 min/);

    expect(
      sortUtilizationRows([
        { employeeName: 'Zero', utilizationPercent: 0 },
        { employeeName: 'Unset' },
        { employeeName: 'High', utilizationPercent: 40 },
      ]).map((r) => r.employeeName),
    ).toEqual(['Zero', 'Unset', 'High']);

    expect(
      buildUtilizationSummaryResult({ scopedEmployeeId: null, range, rows: [] })
        .summary,
    ).toMatch(/Team utilization/);
  });

  it('resolves status filter from params', () => {
    expect(resolveStatusFilter({ statusFilter: 'upcoming' })).toBe('upcoming');
    expect(resolveStatusFilter({ status: 'Completed' })).toBe('completed');
  });
});
