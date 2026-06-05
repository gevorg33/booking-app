import { beforeEach, describe, expect, it } from 'vitest';
import {
  bootstrapAuthBusinessDateFormats,
  getActiveBusinessDateFormats,
  readAuthBusinessDateFormats,
  setActiveBusinessDateFormats,
} from './business-date-format';
import {
  formatBookingDateTimeRange,
  formatDateDisplay,
  formatScheduleTime,
  formatTimeDisplay,
  todayDisplay,
} from './date-format';

describe('Sprint 34 — fmt-1.6 dashboard date format cache', () => {
  beforeEach(() => {
    setActiveBusinessDateFormats(undefined, undefined);
  });

  it('hydrates active cache from auth business summary', () => {
    bootstrapAuthBusinessDateFormats({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });

    expect(getActiveBusinessDateFormats()).toEqual({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
    expect(formatDateDisplay('2026-06-04')).toBe('06/04/2026');
    expect(formatScheduleTime('2026-06-04T15:30:00.000Z')).toMatch(/3:30\s*PM/i);
  });

  it('keeps dashboard helpers on business formats regardless of UI locale', () => {
    bootstrapAuthBusinessDateFormats({
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
    });

    expect(formatDateDisplay('2026-06-04', 'hy')).toBe('2026-06-04');
    expect(formatDateDisplay('2026-06-04', 'ru')).toBe('2026-06-04');
    expect(
      formatBookingDateTimeRange(
        '2026-06-04T10:00:00.000Z',
        '2026-06-04T11:00:00.000Z',
        'en',
      ),
    ).toMatch(/^2026-06-04 · 10:00–11:00$/);
  });

  it('falls back to defaults when auth business omits or invalidates formats', () => {
    expect(readAuthBusinessDateFormats(null)).toEqual({
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    });
    bootstrapAuthBusinessDateFormats({
      dateFormat: 'bad',
      timeFormat: 'bad',
    });
    expect(formatDateDisplay('2026-06-04')).toBe('04/06/2026');
    expect(formatTimeDisplay('2026-06-04T13:30:00.000Z', 'en', 'UTC')).toMatch(
      /13:30/,
    );
  });

  it('todayDisplay follows bootstrapped business date format', () => {
    bootstrapAuthBusinessDateFormats({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '24h',
    });
    expect(todayDisplay('UTC')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('simulates settings save refreshing cache without reload', () => {
    bootstrapAuthBusinessDateFormats({
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    });
    expect(formatDateDisplay('2026-06-04')).toBe('04/06/2026');

    bootstrapAuthBusinessDateFormats({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
    expect(formatDateDisplay('2026-06-04')).toBe('06/04/2026');
    expect(formatScheduleTime('2026-06-04T10:00:00.000Z')).toMatch(/10:00\s*AM/i);
  });
});
