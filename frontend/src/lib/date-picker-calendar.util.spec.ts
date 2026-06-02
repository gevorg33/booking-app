import { describe, expect, it } from 'vitest';
import {
  buildCalendarMonth,
  isDateKeyInRange,
  monthKeyFromDateKey,
  shiftMonthKey,
} from './date-picker-calendar.util';

describe('date-picker-calendar.util', () => {
  it('builds 42 cells for a month grid', () => {
    expect(buildCalendarMonth('2026-06-01')).toHaveLength(42);
  });

  it('shifts months without drift', () => {
    expect(shiftMonthKey('2026-01-01', 1)).toBe('2026-02-01');
    expect(shiftMonthKey('2026-12-01', 1)).toBe('2027-01-01');
  });

  it('respects min and max date keys', () => {
    expect(isDateKeyInRange('2026-06-15', '2026-06-01', '2026-06-30')).toBe(true);
    expect(isDateKeyInRange('2026-05-31', '2026-06-01')).toBe(false);
  });

  it('derives month key from any day', () => {
    expect(monthKeyFromDateKey('2026-03-18')).toBe('2026-03-01');
  });
});
