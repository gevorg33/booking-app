import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import * as dateKeyParse from './date-key-parse.util';
import {
  addCalendarDays,
  getBrowserTimeZone,
  getTodayDateKey,
  parseDateInput,
  parseDateKey,
  parseDisplayDate,
  todayDateAnchor,
  toDateKey,
} from './calendar-date.util';

describe('calendar-date.util', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parseDateInput supports display, slash, iso, and invalid', () => {
    expect(parseDateInput('01_06_2026')?.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(parseDateInput('01/06/2026')?.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(parseDateInput('2026-06-01')?.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(parseDateInput('not-a-date')).toBeNull();
  });

  it('parseDateInput falls back to Date.parse for other strings', () => {
    expect(parseDateInput('2026-06-04T12:00:00.000Z')?.toISOString()).toBe(
      '2026-06-04T12:00:00.000Z',
    );
  });

  it('re-exports parseDateKey from date-key-parse.util', () => {
    expect(parseDateKey('2026-06-04')?.toISOString()).toBe('2026-06-04T12:00:00.000Z');
  });

  it('parseDisplayDate routes iso keys and strings', () => {
    expect(parseDisplayDate('2026-06-04')?.toISOString()).toBe('2026-06-04T12:00:00.000Z');
    expect(parseDisplayDate('01/06/2026')?.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(parseDisplayDate(new Date('2026-06-04T12:00:00.000Z'))?.toISOString()).toBe(
      '2026-06-04T12:00:00.000Z',
    );
  });

  it('getTodayDateKey and toDateKey use timezone', () => {
    expect(getTodayDateKey('UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getTodayDateKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const invalid = new Date('invalid');
    expect(toDateKey(invalid, 'UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toDateKey(invalid)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toDateKey(new Date('2026-06-04T15:00:00.000Z'), 'UTC')).toBe('2026-06-04');
    expect(toDateKey(new Date('2026-06-04T15:00:00.000Z'))).toBe('2026-06-04');
  });

  it('addCalendarDays shifts by calendar days', () => {
    const anchor = todayDateAnchor('UTC');
    const next = addCalendarDays(anchor, 1, 'UTC');
    expect(toDateKey(next, 'UTC')).not.toBe(toDateKey(anchor, 'UTC'));
  });

  it('getBrowserTimeZone returns resolved timezone', () => {
    expect(getBrowserTimeZone().length).toBeGreaterThan(0);
  });

  it('getBrowserTimeZone falls back when timezone missing or Intl throws', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: '',
    } as Intl.ResolvedDateTimeFormatOptions);
    expect(getBrowserTimeZone()).toBe('UTC');
    vi.restoreAllMocks();
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('no tz');
    });
    expect(getBrowserTimeZone()).toBe('UTC');
  });

  it('todayDateAnchor falls back to Date when day key cannot be parsed', () => {
    vi.spyOn(dateKeyParse, 'parseDateKey').mockReturnValue(null);
    expect(todayDateAnchor('UTC')).toBeInstanceOf(Date);
  });

  it('addCalendarDays returns shifted Date when parseDateKey fails', () => {
    const anchor = parseDateKey('2026-06-04')!;
    vi.spyOn(dateKeyParse, 'parseDateKey').mockReturnValueOnce(null);
    const result = addCalendarDays(anchor, 1, 'UTC');
    expect(result).toBeInstanceOf(Date);
    expect(toDateKey(result, 'UTC')).toBe('2026-06-05');
  });
});
