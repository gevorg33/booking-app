import { describe, expect, it } from 'vitest';
import {
  buildInclusiveDateKeyRange,
  buildServiceDateEnabled,
  monthBoundsFromMonthKey,
  pickFirstBookableDateKey,
  splitDateKeyRange,
} from './service-bookable-dates.util';

describe('service-bookable-dates.util', () => {
  it('buildInclusiveDateKeyRange includes both endpoints', () => {
    expect(buildInclusiveDateKeyRange('2026-06-09', '2026-06-11')).toEqual([
      '2026-06-09',
      '2026-06-10',
      '2026-06-11',
    ]);
  });

  it('splitDateKeyRange splits long ranges into max-sized chunks', () => {
    expect(splitDateKeyRange('2026-06-01', '2026-08-15', 62)).toEqual([
      { from: '2026-06-01', to: '2026-08-01' },
      { from: '2026-08-02', to: '2026-08-15' },
    ]);
  });

  it('monthBoundsFromMonthKey returns first and last day of month', () => {
    expect(monthBoundsFromMonthKey('2026-06-01')).toEqual({
      from: '2026-06-01',
      to: '2026-06-30',
    });
  });

  it('buildServiceDateEnabled keeps only scanned bookable days enabled', () => {
    const isDateEnabled = buildServiceDateEnabled({
      minDateKey: '2026-06-09',
      scannedDates: new Set(['2026-06-09', '2026-06-10', '2026-06-11']),
      bookableDates: new Set(['2026-06-10']),
    });

    expect(isDateEnabled('2026-06-08')).toBe(false);
    expect(isDateEnabled('2026-06-09')).toBe(false);
    expect(isDateEnabled('2026-06-10')).toBe(true);
    expect(isDateEnabled('2026-06-11')).toBe(false);
  });

  it('pickFirstBookableDateKey returns earliest bookable day on or after min', () => {
    expect(
      pickFirstBookableDateKey(new Set(['2026-06-08', '2026-06-11', '2026-06-10']), '2026-06-09'),
    ).toBe('2026-06-10');
  });
});
