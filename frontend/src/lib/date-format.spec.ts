import { describe, it, expect } from 'vitest';
import {
  dateKeyToExpiresAtEndOfDay,
  formatDateDisplay,
  formatScheduleTimeRange,
  isExpiredAt,
  resolveDisplayLocale,
  toIntlLocale,
} from './date-format';

describe('date-format locale helpers', () => {
  it('maps app locales to Intl tags', () => {
    expect(toIntlLocale('hy')).toBe('hy-AM');
    expect(toIntlLocale('ru')).toBe('ru-RU');
    expect(toIntlLocale('en')).toBe('en-GB');
  });

  it('formats dates differently per locale', () => {
    const d = new Date('2026-06-03T12:00:00.000Z');
    expect(formatDateDisplay(d, 'en')).toMatch(/03/);
    expect(formatDateDisplay(d, 'hy')).toBeTruthy();
    expect(formatDateDisplay(d, 'ru')).toBeTruthy();
  });

  it('formats schedule time ranges with formatRange when available', () => {
    const start = new Date('2026-06-03T10:00:00.000Z');
    const end = new Date('2026-06-03T11:00:00.000Z');
    const range = formatScheduleTimeRange(start, end, 'en');
    expect(range).toMatch(/10:00/);
    expect(range).toMatch(/11:00/);
  });

  it('resolveDisplayLocale returns explicit locale first', () => {
    expect(resolveDisplayLocale('ru')).toBe('ru');
  });
});

describe('date-format expiration helpers', () => {
  it('converts date key to end-of-day UTC ISO timestamp', () => {
    expect(dateKeyToExpiresAtEndOfDay('2026-12-31')).toBe('2026-12-31T23:59:59.999Z');
    expect(dateKeyToExpiresAtEndOfDay('invalid')).toBeNull();
    expect(dateKeyToExpiresAtEndOfDay('')).toBeNull();
  });

  it('detects expired timestamps', () => {
    expect(isExpiredAt('2020-01-01T00:00:00.000Z')).toBe(true);
    expect(isExpiredAt(new Date('2020-01-01T00:00:00.000Z'))).toBe(true);
    expect(isExpiredAt(null)).toBe(false);
    expect(isExpiredAt(undefined)).toBe(false);
    expect(isExpiredAt(new Date(Date.now() + 86400000).toISOString())).toBe(false);
  });
});
