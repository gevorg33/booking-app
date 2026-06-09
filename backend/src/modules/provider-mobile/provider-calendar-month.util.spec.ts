import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import {
  PROVIDER_CALENDAR_MONTH_BAND_SCENARIOS,
  PROVIDER_CALENDAR_MONTH_VIEW_SCENARIO,
} from './provider-calendar-month.fixtures.js';
import {
  buildProviderCalendarMonthDaySummary,
  buildProviderCalendarMonthView,
  listDateKeysInclusive,
  normalizeCalendarMonthKey,
  PROVIDER_CALENDAR_DEFAULT_DAY_MINUTES,
  resolveCalendarMonthBounds,
  resolveProviderCalendarUtilizationBand,
} from './provider-calendar-month.util.js';

describe('provider-calendar-month.util (prov-exp-10.2)', () => {
  it('normalizes month keys', () => {
    expect(normalizeCalendarMonthKey('2026-06')).toBe('2026-06');
    expect(normalizeCalendarMonthKey('2026-06-01')).toBe('2026-06');
    expect(normalizeCalendarMonthKey('bad')).toBeNull();
    expect(normalizeCalendarMonthKey(null)).toBeNull();
    expect(normalizeCalendarMonthKey(undefined)).toBeNull();
  });

  it('resolves inclusive month bounds', () => {
    expect(resolveCalendarMonthBounds('2026-06-01')).toEqual({
      from: '2026-06-01',
      to: '2026-06-30',
    });
    expect(() => resolveCalendarMonthBounds('bad-month')).toThrow(
      'Invalid calendar month key',
    );
  });

  it('lists all days in a month range', () => {
    expect(listDateKeysInclusive('2026-06-01', '2026-06-03')).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
    ]);
  });

  it('maps utilization bands from booking counts and utilization', () => {
    expect(
      resolveProviderCalendarUtilizationBand({
        bookingCount: 0,
        utilizationPercent: 80,
      }),
    ).toBe('empty');
    expect(
      resolveProviderCalendarUtilizationBand({
        bookingCount: 2,
        utilizationPercent: 25,
      }),
    ).toBe('low');
    expect(
      resolveProviderCalendarUtilizationBand({
        bookingCount: 2,
        utilizationPercent: 55,
      }),
    ).toBe('medium');
    expect(
      resolveProviderCalendarUtilizationBand({
        bookingCount: 2,
        utilizationPercent: 85,
      }),
    ).toBe('high');
  });

  it.each(PROVIDER_CALENDAR_MONTH_BAND_SCENARIOS)(
    'buildProviderCalendarMonthDaySummary — $id',
    ({ dateKey, bookings, periods, employeeCount, expectedBand, expectedCount }) => {
      const normalizedPeriods = periods.map((period) => ({
        ...period,
        type:
          period.type === 'service_block'
            ? TemplatePeriodType.SERVICE_BLOCK
            : TemplatePeriodType.SERVICE_BLOCK,
      }));
      const summary = buildProviderCalendarMonthDaySummary({
        dateKey,
        bookings,
        periods: normalizedPeriods,
        employeeCount,
      });
      expect(summary.utilizationBand).toBe(expectedBand);
      expect(summary.bookingCount).toBe(expectedCount);
    },
  );

  it('builds a full month view with one day of activity', () => {
    const view = buildProviderCalendarMonthView({
      monthKey: PROVIDER_CALENDAR_MONTH_VIEW_SCENARIO.monthKey,
      viewMode: PROVIDER_CALENDAR_MONTH_VIEW_SCENARIO.viewMode,
      bookings: PROVIDER_CALENDAR_MONTH_VIEW_SCENARIO.bookings,
      periods: PROVIDER_CALENDAR_MONTH_VIEW_SCENARIO.periods,
      employeeCount: PROVIDER_CALENDAR_MONTH_VIEW_SCENARIO.employeeCount,
    });

    expect(view.days).toHaveLength(PROVIDER_CALENDAR_MONTH_VIEW_SCENARIO.expectedDays);
    expect(view.days.find((day) => day.date === '2026-06-09')?.bookingCount).toBe(1);
  });

  it('leaves scheduled minutes at zero when no employees are in scope', () => {
    const summary = buildProviderCalendarMonthDaySummary({
      dateKey: '2026-06-09',
      bookings: PROVIDER_CALENDAR_MONTH_VIEW_SCENARIO.bookings,
      periods: [],
      employeeCount: 0,
    });

    expect(summary.scheduledMinutes).toBe(0);
    expect(summary.bookingCount).toBe(1);
  });

  it('ignores cancelled bookings and non-service schedule blocks', () => {
    const summary = buildProviderCalendarMonthDaySummary({
      dateKey: '2026-06-15',
      bookings: [
        {
          status: 'cancelled',
          paymentStatus: 'unpaid',
          startTime: new Date('2026-06-15T10:00:00.000Z'),
          endTime: new Date('2026-06-15T11:00:00.000Z'),
        },
      ],
      periods: [
        {
          type: TemplatePeriodType.UNAVAILABLE_BLOCK,
          startTime: new Date('2026-06-15T09:00:00.000Z'),
          endTime: new Date('2026-06-15T17:00:00.000Z'),
        },
      ],
      employeeCount: 1,
    });

    expect(summary.bookingCount).toBe(0);
    expect(summary.utilizationBand).toBe('empty');
    expect(summary.scheduledMinutes).toBe(PROVIDER_CALENDAR_DEFAULT_DAY_MINUTES);
  });
});
