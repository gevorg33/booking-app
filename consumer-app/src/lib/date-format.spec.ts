import { describe, expect, it, beforeEach } from 'vitest';
import {
  formatBookingDateTimeRange,
  formatDateDisplay,
  formatDateTimeLabel,
  formatScheduleTime,
  formatScheduleTimeRange,
} from './date-format.js';
import { setActiveBusinessDateFormats } from './business-date-format.js';

describe('Sprint 34 — consumer app date format', () => {
  beforeEach(() => {
    setActiveBusinessDateFormats(undefined, undefined);
  });

  it('formats my appointments with tenant US date + 12h time', () => {
    setActiveBusinessDateFormats('MM/DD/YYYY', '12h');
    const start = '2026-06-04T10:00:00.000Z';
    const end = '2026-06-04T11:00:00.000Z';
    expect(formatDateDisplay(start)).toBe('06/04/2026');
    expect(formatScheduleTime(start)).toMatch(/10:00\s*AM/i);
    expect(formatBookingDateTimeRange(start, end)).toMatch(
      /06\/04\/2026 · .*AM/i,
    );
    expect(formatDateTimeLabel(start)).toMatch(/06\/04\/2026 .*AM/i);
  });

  it('formats subscription expiry in ISO date format', () => {
    setActiveBusinessDateFormats('YYYY-MM-DD', '24h');
    expect(formatDateDisplay('2026-12-31T23:59:59.999Z')).toBe('2026-12-31');
  });

  it('defaults to DD/MM/YYYY and 24h when tenant formats are unset', () => {
    expect(formatDateDisplay('2026-06-04T12:00:00.000Z')).toBe('04/06/2026');
    expect(formatScheduleTime('2026-06-04T15:45:00.000Z')).toMatch(/15:45/);
    expect(
      formatScheduleTimeRange(
        '2026-06-04T10:00:00.000Z',
        '2026-06-04T11:00:00.000Z',
      ),
    ).toMatch(/10:00–11:00/);
  });

  it('returns raw strings for invalid instants', () => {
    setActiveBusinessDateFormats('MM/DD/YYYY', '12h');
    expect(formatDateDisplay('invalid')).toBe('invalid');
    expect(formatScheduleTime('invalid')).toBe('invalid');
  });
});
