import {
  PROVIDER_TIME_OFF_BLOCK_BUILD_SCENARIOS,
  PROVIDER_TIME_OFF_RANGE_SCENARIOS,
  PROVIDER_TIME_OFF_SETTINGS_SCENARIOS,
} from './provider-time-off.fixtures.js';
import {
  buildBlockScheduleDtoFromTimeOffRequest,
  isProviderTimeOffEnabled,
  mapProviderTimeOffRequestView,
  readProviderTimeOffSettings,
  summarizeTimeOffRequests,
  validateProviderTimeOffRange,
} from './provider-time-off.util.js';

/**
 * e2e-bug.422 — the clock is frozen because these fixtures name real dates.
 *
 * `validateProviderTimeOffRange` (and its self-block sibling) reject anything
 * more than a day in the past, measured against `Date.now()`. The fixtures were
 * written with `2026-06-20`, which was comfortably in the future then and is not
 * now, so every scenario started returning "Cannot request time off in the
 * past" — and `buildBlockScheduleDtoFromTimeOffRequest` returns `null` on a
 * validation error, which is why the assertions saw `undefined` rather than a
 * date complaint.
 *
 * Freezing rather than rewriting the fixtures to relative dates: the literal
 * dates are what make the expected ISO strings readable, and a fixture computed
 * from `Date.now()` cannot express "a range spanning a month boundary" without
 * becoming a second implementation of the thing under test.
 */
const FROZEN_NOW = new Date('2026-06-01T09:00:00.000Z');

beforeAll(() => {
  jest.useFakeTimers({ now: FROZEN_NOW, doNotFake: ['nextTick'] });
});

afterAll(() => {
  jest.useRealTimers();
});

describe('provider-time-off.util (prov-exp-7.2)', () => {
  it.each(PROVIDER_TIME_OFF_SETTINGS_SCENARIOS.map((s) => [s.id, s]))(
    'reads settings for %s',
    (_id, scenario) => {
      expect(
        isProviderTimeOffEnabled(readProviderTimeOffSettings(scenario.raw)),
      ).toBe(scenario.expectedEnabled);
    },
  );

  it.each(PROVIDER_TIME_OFF_RANGE_SCENARIOS.map((s) => [s.id, s]))(
    'validates range for %s',
    (_id, scenario) => {
      expect(validateProviderTimeOffRange(scenario.input)).toBe(
        scenario.expectedError,
      );
    },
  );

  it.each(PROVIDER_TIME_OFF_BLOCK_BUILD_SCENARIOS.map((s) => [s.id, s]))(
    'builds block dto for %s',
    (_id, scenario) => {
      const dto = buildBlockScheduleDtoFromTimeOffRequest(
        scenario.employeeId,
        scenario.request,
      );
      expect(dto?.isRepetitive).toBe(scenario.expectedRepetitive);
      if ('expectedStart' in scenario) {
        expect(dto?.singleBlock).toEqual({
          startTime: scenario.expectedStart,
          endTime: scenario.expectedEnd,
        });
      } else {
        expect(dto?.repetitiveBlock).toMatchObject({
          startDay: scenario.expectedStartDay,
          endDay: scenario.expectedEndDay,
        });
      }
    },
  );

  it('maps request view and summarizes list', () => {
    const view = mapProviderTimeOffRequestView({
      id: 'req-1',
      businessId: 'biz-1',
      employeeId: 'emp-1',
      requestedByUserId: 'user-1',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      dailyStartTime: '00:00',
      dailyEndTime: '23:59',
      reason: 'Vacation',
      status: 'pending',
      reviewedByUserId: null,
      reviewedAt: null,
      reviewNotes: null,
      blockScheduleId: null,
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-01T10:00:00.000Z'),
      employee: { name: 'Sam' } as any,
    });
    expect(view.employeeName).toBe('Sam');
    expect(summarizeTimeOffRequests([view])).toContain('Sam');
    expect(summarizeTimeOffRequests([])).toContain('No time-off');
  });

  it('rejects invalid dates and past ranges', () => {
    expect(
      validateProviderTimeOffRange({
        startDate: 'bad',
        endDate: '2026-06-20',
        dailyStartTime: '09:00',
        dailyEndTime: '17:00',
      }),
    ).toBe('Invalid date or time');
    expect(
      validateProviderTimeOffRange({
        startDate: '2020-01-01',
        endDate: '2020-01-01',
        dailyStartTime: '09:00',
        dailyEndTime: '17:00',
      }),
    ).toBe('Cannot request time off in the past');
    expect(
      buildBlockScheduleDtoFromTimeOffRequest('emp-1', {
        startDate: 'bad',
        endDate: '2026-06-20',
        dailyStartTime: '09:00',
        dailyEndTime: '17:00',
      }),
    ).toBeNull();
  });

  it('formats single-day summary range', () => {
    const view = mapProviderTimeOffRequestView({
      id: 'req-2',
      businessId: 'biz-1',
      employeeId: 'emp-1',
      requestedByUserId: 'user-1',
      startDate: '2026-06-20',
      endDate: '2026-06-20',
      dailyStartTime: '09:00',
      dailyEndTime: '17:00',
      reason: null,
      status: 'approved',
      reviewedByUserId: null,
      reviewedAt: null,
      reviewNotes: null,
      blockScheduleId: null,
      createdAt: undefined as any,
      updatedAt: new Date('2026-06-01T10:00:00.000Z'),
      employee: { name: 'Sam' } as any,
    });
    expect(view.createdAt).toBeTruthy();
    expect(summarizeTimeOffRequests([view])).toContain('2026-06-20');
    expect(
      summarizeTimeOffRequests([
        {
          ...view,
          employeeName: null,
          startDate: '2026-06-21',
          endDate: '2026-06-22',
        },
      ]),
    ).toContain('Provider');
  });

  it('uses Time off placeholder when reason blank', () => {
    const dto = buildBlockScheduleDtoFromTimeOffRequest('emp-1', {
      startDate: '2026-06-20',
      endDate: '2026-06-20',
      dailyStartTime: '09:00',
      dailyEndTime: '17:00',
      reason: '   ',
    });
    expect(dto?.placeholder).toBe('Time off');
  });
});
