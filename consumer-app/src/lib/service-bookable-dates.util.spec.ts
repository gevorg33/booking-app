import { describe, expect, it } from 'vitest';
import {
  buildDateKeyRange,
  buildServiceDateEnabled,
  dateKeysForMonth,
  dayHasBookableSlots,
  pickFirstBookableDateKey,
} from './service-bookable-dates.util.js';

describe('dayHasBookableSlots', () => {
  it('returns false when there are no slots', () => {
    expect(dayHasBookableSlots({ slots: [], remainingSpots: null }, false)).toBe(false);
  });

  it('returns false for sold-out day-level tours', () => {
    expect(
      dayHasBookableSlots({ slots: [{ startTime: '2026-06-09T14:00:00.000Z' }], remainingSpots: 0 }, true),
    ).toBe(false);
  });

  it('returns true when slots exist', () => {
    expect(
      dayHasBookableSlots({ slots: [{ startTime: '2026-06-09T14:00:00.000Z' }], remainingSpots: 2 }, true),
    ).toBe(true);
  });
});

describe('buildServiceDateEnabled', () => {
  it('disables unscanned and empty days while keeping bookable days enabled', () => {
    const isDateEnabled = buildServiceDateEnabled({
      minDateKey: '2026-06-09',
      scannedDates: new Set(['2026-06-09', '2026-06-10', '2026-06-11']),
      bookableDates: new Set(['2026-06-10']),
    });

    expect(isDateEnabled('2026-06-08T00:00:00.000Z')).toBe(false);
    expect(isDateEnabled('2026-06-09T00:00:00.000Z')).toBe(false);
    expect(isDateEnabled('2026-06-10T00:00:00.000Z')).toBe(true);
    expect(isDateEnabled('2026-06-11T00:00:00.000Z')).toBe(false);
    expect(isDateEnabled('2026-06-12T00:00:00.000Z')).toBe(false);
  });
});

describe('pickFirstBookableDateKey', () => {
  it('returns the earliest bookable date on or after minDateKey', () => {
    expect(
      pickFirstBookableDateKey(new Set(['2026-06-08', '2026-06-11', '2026-06-10']), '2026-06-09'),
    ).toBe('2026-06-10');
  });
});

describe('buildDateKeyRange', () => {
  it('builds consecutive date keys', () => {
    expect(buildDateKeyRange('2026-06-09', 3)).toEqual([
      '2026-06-09',
      '2026-06-10',
      '2026-06-11',
    ]);
  });
});

describe('dateKeysForMonth', () => {
  it('returns every day in the month', () => {
    expect(dateKeysForMonth(2026, 5)).toHaveLength(30);
    expect(dateKeysForMonth(2026, 5)[0]).toBe('2026-06-01');
  });
});
