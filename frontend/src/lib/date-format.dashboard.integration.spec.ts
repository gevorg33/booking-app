import { beforeEach, describe, expect, it } from 'vitest';
import {
  formatBookingDateTimeRange,
  formatDateDisplay,
  formatPublicReviewDate,
  formatScheduleTime,
  formatTimeDisplay,
  formatTimeRangeDisplay,
  setActiveBusinessDateFormats,
  toIsoDay,
} from './date-format';

describe('Sprint 34 — fmt-1.6 dashboard date-format helpers', () => {
  beforeEach(() => {
    setActiveBusinessDateFormats('MM/DD/YYYY', '12h');
  });

  it('formatTimeDisplay accepts timezone string and options object branches', () => {
    expect(formatTimeDisplay('2026-06-04T15:30:00.000Z', 'en', 'UTC')).toMatch(
      /3:30\s*PM/i,
    );
    expect(
      formatTimeDisplay('2026-06-04T15:30:00.000Z', 'en', {
        timeFormat: '24h',
        timeZone: 'UTC',
      }),
    ).toMatch(/15:30/);
    expect(
      formatTimeRangeDisplay(
        '2026-06-04T10:00:00.000Z',
        '2026-06-04T11:00:00.000Z',
        'en',
        { timeFormat: '24h', timeZone: 'UTC' },
      ),
    ).toMatch(/10:00–11:00/);
  });

  it('explicit options override bootstrapped business cache', () => {
    expect(
      formatDateDisplay('2026-06-04', 'en', { dateFormat: 'YYYY-MM-DD' }),
    ).toBe('2026-06-04');
    expect(
      formatTimeDisplay('2026-06-04T13:00:00.000Z', 'en', {
        timeFormat: '24h',
        timeZone: 'UTC',
      }),
    ).toMatch(/13:00/);
  });

  it('formatPublicReviewDate keeps locale-long month labels', () => {
    expect(formatPublicReviewDate('2026-06-04T12:00:00.000Z', 'en', 'UTC')).toMatch(
      /June/i,
    );
    expect(formatPublicReviewDate('2026-06-04T12:00:00.000Z', 'xx', 'UTC')).toMatch(
      /June/i,
    );
    expect(formatPublicReviewDate('not-a-date', 'en', 'UTC')).toBe('not-a-date');
  });

  it('toIsoDay normalizes user input for dashboard date filters', () => {
    expect(toIsoDay('06/04/2026')).toBe('2026-06-04');
    expect(toIsoDay('04/06/2026', { dateFormat: 'DD/MM/YYYY' })).toBe('2026-06-04');
    expect(toIsoDay('invalid')).toBe('invalid');
  });

  it('returns raw values for invalid date/time inputs', () => {
    expect(formatDateDisplay('not-a-date', 'en')).toBe('not-a-date');
    expect(formatTimeDisplay('invalid', 'en', 'UTC')).toBe('invalid');
    expect(formatScheduleTime('invalid', 'en')).toBe('invalid');
  });

  it('formatTimeRangeDisplay supports timezone string with maybeOptions', () => {
    expect(
      formatTimeRangeDisplay(
        '2026-06-04T10:00:00.000Z',
        '2026-06-04T11:00:00.000Z',
        'en',
        'UTC',
        { timeFormat: '24h' },
      ),
    ).toMatch(/10:00–11:00/);
  });

  it('formatBookingDateTimeRange accepts Date start values', () => {
    expect(
      formatBookingDateTimeRange(
        new Date('2026-06-04T10:00:00.000Z'),
        '2026-06-04T11:00:00.000Z',
        'en',
      ),
    ).toMatch(/06\/04\/2026 · .*10:00/i);
  });

  it('accepts Date objects and default timezone in time helpers', () => {
    const instant = new Date('2026-06-04T10:00:00.000Z');
    expect(formatTimeDisplay(instant, 'en', { timeFormat: '24h' })).toMatch(/10:00/);
    expect(formatScheduleTime(instant, 'en')).toMatch(/10:00/i);
    expect(formatPublicReviewDate(instant, 'en', 'UTC')).toMatch(/June/i);
  });
});
