import {
  buildBlockScheduleParams,
  buildDirectScheduleProposalSteps,
  resolveEmployeeId,
} from './booking-tool-context.helpers.js';
import type { BookingToolRunContext } from './booking-tool.types.js';

describe('resolveEmployeeId (e2e-bug.169 regression)', () => {
  const ctx: BookingToolRunContext = {
    businessId: 'business-1',
    timeZone: 'UTC',
    toolContext: {},
    stepCounter: 0,
    proposals: [],
    lastStepByAction: {},
    employees: [
      { id: 'emp-karo', name: 'Karo Mazmanyan', serviceIds: ['svc-1'] },
      { id: 'emp-mariam', name: 'Mariam Ohanyan', serviceIds: ['svc-2'] },
    ],
    services: [],
    templates: [],
  };

  it('resolves a real employeeId from a bare employeeName via fuzzy match', () => {
    expect(resolveEmployeeId(ctx, undefined, 'Karo Mazmanyan')).toBe(
      'emp-karo',
    );
    expect(resolveEmployeeId(ctx, undefined, 'Mariam')).toBe('emp-mariam');
  });

  it('prefers an explicit employeeId when present', () => {
    expect(resolveEmployeeId(ctx, 'emp-mariam', 'Karo Mazmanyan')).toBe(
      'emp-mariam',
    );
  });

  it('returns undefined when neither id nor a matching name is given', () => {
    expect(resolveEmployeeId(ctx, undefined, 'Nobody Here')).toBeUndefined();
    expect(resolveEmployeeId(ctx, undefined, undefined)).toBeUndefined();
  });
});

describe('buildDirectScheduleProposalSteps (e2e-bug.169 regression)', () => {
  const ctx: BookingToolRunContext = {
    businessId: 'business-1',
    timeZone: 'UTC',
    toolContext: {},
    stepCounter: 0,
    proposals: [],
    lastStepByAction: {},
    employees: [
      { id: 'emp-karo', name: 'Karo Mazmanyan', serviceIds: ['svc-1'] },
      { id: 'emp-mariam', name: 'Mariam Ohanyan', serviceIds: ['svc-2'] },
    ],
    services: [],
    templates: [],
  };

  it('resolves a real employeeId when the LLM supplies only employeeName', () => {
    const steps = buildDirectScheduleProposalSteps(
      ctx,
      { date: '2026-07-19', timeFrom: '09:00', timeTo: '18:00' },
      { employeeName: 'Karo Mazmanyan' },
    );

    expect(steps).toHaveLength(1);
    expect(steps[0].params.employeeId).toBe('emp-karo');
    expect(steps[0].description).toBe(
      'Set schedule for Karo Mazmanyan on 2026-07-19',
    );
  });

  it('still works when employeeId is already provided', () => {
    const steps = buildDirectScheduleProposalSteps(
      ctx,
      { date: '2026-07-19' },
      { employeeId: 'emp-mariam' },
    );

    expect(steps[0].params.employeeId).toBe('emp-mariam');
  });

  it('leaves employeeId undefined (not a UUID guess) when no employee matches', () => {
    const steps = buildDirectScheduleProposalSteps(
      ctx,
      { date: '2026-07-19' },
      { employeeName: 'Nobody Here' },
    );

    expect(steps[0].params.employeeId).toBeUndefined();
  });
});

describe('buildBlockScheduleParams (e2e-bug.170 regression)', () => {
  const ctx: BookingToolRunContext = {
    businessId: 'business-1',
    timeZone: 'UTC',
    toolContext: {},
    stepCounter: 0,
    proposals: [],
    lastStepByAction: {},
    employees: [
      { id: 'emp-karo', name: 'Karo Mazmanyan', serviceIds: ['svc-1'] },
    ],
    services: [],
    templates: [],
  };

  it('builds a repetitiveBlock with day-of-week flags for a recurring day off across a date range', () => {
    const params = buildBlockScheduleParams(ctx, {
      employeeName: 'Karo Mazmanyan',
      dateFrom: '2026-07-19',
      dateTo: '2026-07-28',
      applyDays: [0], // Sunday
    });

    expect(params.employeeId).toBe('emp-karo');
    expect(params.isRepetitive).toBe(true);
    expect(params.singleBlock).toBeUndefined();
    expect(params.repetitiveBlock).toMatchObject({
      startDay: '2026-07-19',
      endDay: '2026-07-28',
      isActiveOnSunday: true,
      isActiveOnMonday: false,
      isActiveOnSaturday: false,
      weeksCount: 1,
    });
  });

  it('builds a singleBlock for a one-off time window on a single date', () => {
    const params = buildBlockScheduleParams(ctx, {
      employeeName: 'Karo Mazmanyan',
      date: '2026-07-20',
      startTime: '13:00',
      endTime: '14:00',
    });

    expect(params.isRepetitive).toBe(false);
    expect(params.repetitiveBlock).toBeUndefined();
    expect(params.singleBlock).toMatchObject({
      startTime: '2026-07-20T13:00:00.000Z',
      endTime: '2026-07-20T14:00:00.000Z',
    });
  });

  it('builds a full-day singleBlock when blockFullDay is set for a single date', () => {
    const params = buildBlockScheduleParams(ctx, {
      employeeName: 'Karo Mazmanyan',
      date: '2026-07-20',
      blockFullDay: true,
    });

    expect(params.isRepetitive).toBe(false);
    expect(params.singleBlock).toMatchObject({
      startTime: '2026-07-20T00:00:00.000Z',
      endTime: '2026-07-20T23:59:59.000Z',
    });
  });

  it('throws a clear error instead of crashing when no date info is given', () => {
    expect(() =>
      buildBlockScheduleParams(ctx, { employeeName: 'Karo Mazmanyan' }),
    ).toThrow(/requires date/i);
  });
});
