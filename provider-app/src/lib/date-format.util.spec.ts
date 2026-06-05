import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as dateFormat from './date-format';
import {
  addCalendarDays,
  formatDateDisplay,
  formatTimeDisplay,
  formatTimeRangeDisplay,
  getBrowserTimeZone,
  getTodayDateKey,
  parseDateKey,
  todayDisplay,
  toDateKey,
} from './date-format';
import { useAuthStore } from '../services/auth-store';

describe('provider date-format utilities', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'p@test.com' },
      business: {
        id: 'biz-1',
        name: 'Salon',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
      },
      token: 'token',
      isAuthenticated: true,
      employee: null,
      businesses: [],
    });
  });

  it('getBrowserTimeZone falls back when Intl throws', () => {
    const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('no tz');
    });
    expect(getBrowserTimeZone()).toBe('UTC');
    spy.mockRestore();
  });

  it('getBrowserTimeZone falls back when resolved timeZone is empty', () => {
    const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ timeZone: '' }),
          format: () => '',
        }) as Intl.DateTimeFormat,
    );
    expect(getBrowserTimeZone()).toBe('UTC');
    spy.mockRestore();
  });

  it('parseDateKey rejects invalid keys', () => {
    expect(parseDateKey('bad')).toBeNull();
    expect(parseDateKey('2026-13-40')).toBeNull();
  });

  it('toDateKey and getTodayDateKey return YYYY-MM-DD strings', () => {
    expect(getTodayDateKey('UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toDateKey(new Date('2026-06-04T12:00:00.000Z'), 'UTC')).toBe('2026-06-04');
    expect(toDateKey(new Date('invalid'), 'UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('addCalendarDays shifts calendar days in timezone', () => {
    const anchor = new Date('2026-06-04T12:00:00.000Z');
    const next = addCalendarDays(anchor, 1, 'UTC');
    expect(toDateKey(next, 'UTC')).toBe('2026-06-05');
  });

  it('addCalendarDays returns shifted Date when parseDateKey returns null', () => {
    const shifted = new Date('2026-06-05T12:00:00.000Z');
    const spy = vi.spyOn(dateFormat, 'parseDateKey').mockReturnValueOnce(null);
    const anchor = new Date('2026-06-04T12:00:00.000Z');
    const next = addCalendarDays(anchor, 1, 'UTC');
    expect(next.getTime()).toBeGreaterThan(anchor.getTime());
    spy.mockRestore();
    expect(shifted).toBeTruthy();
  });

  it('formatDateDisplay falls back when parseDateKey returns null for ISO key', () => {
    const spy = vi.spyOn(dateFormat, 'parseDateKey').mockReturnValueOnce(null);
    expect(formatDateDisplay('2026-06-04')).toBe('04/06/2026');
    spy.mockRestore();
  });

  it('formatDateDisplay and formatTimeDisplay accept Date objects', () => {
    expect(formatDateDisplay(new Date('2026-06-04T12:00:00.000Z'))).toBe(
      '04/06/2026',
    );
    expect(formatTimeDisplay(new Date('2026-06-04T10:00:00.000Z'))).toMatch(
      /10:00/,
    );
  });

  it('formatTimeRangeDisplay and todayDisplay use auth formats', () => {
    expect(
      formatTimeRangeDisplay(
        '2026-06-04T10:00:00.000Z',
        '2026-06-04T11:00:00.000Z',
      ),
    ).toMatch(/10:00–11:00/);
    expect(todayDisplay()).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
