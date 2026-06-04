import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  addCalendarDays,
  formatDateDisplay,
  getBrowserTimeZone,
  getTodayDateKey,
  parseDateKey,
  todayDisplay,
} from './date-format';

describe('provider-app date-format', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formatDateDisplay uses navigator language when available', () => {
    vi.stubGlobal('navigator', { language: 'hy-AM' });
    const formatted = formatDateDisplay('2026-06-04');
    expect(formatted).toBeTruthy();
  });

  it('formatDateDisplay accepts explicit locale', () => {
    expect(formatDateDisplay('2026-06-04', 'ru')).toBeTruthy();
    expect(formatDateDisplay('2026-06-04', 'en')).toMatch(/04/);
  });

  it('formatDateDisplay falls back to DD/MM for invalid dates', () => {
    expect(formatDateDisplay('not-a-date')).toBe('not-a-date');
  });

  it('calendar helpers work', () => {
    expect(parseDateKey('2026-06-04')).toBeTruthy();
    expect(getTodayDateKey('UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const anchor = parseDateKey(getTodayDateKey('UTC'))!;
    expect(addCalendarDays(anchor, 1, 'UTC')).toBeInstanceOf(Date);
    expect(todayDisplay('UTC')).toMatch(/\d{2}[./]\d{2}[./]\d{4}/);
  });

  it('getBrowserTimeZone falls back on error', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('tz');
    });
    expect(getBrowserTimeZone()).toBe('UTC');
  });
});
