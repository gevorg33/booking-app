import { describe, it, expect, beforeEach } from 'vitest';
import {
  dateKeyToExpiresAtEndOfDay,
  formatBookingDateTimeRange,
  formatDateDisplay,
  formatAppointmentDateLabel,
  formatDateKeyPublicLabel,
  formatDateKeyStripParts,
  formatNearestSlotDateLabel,
  formatScheduleTime,
  formatScheduleTimeRange,
  formatWeekdayShortByDayIndex,
  getTodayDateKey,
  isExpiredAt,
  resolveDisplayLocale,
  resolveNearestSlotDateLabel,
  setActiveBusinessDateFormats,
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

  it('formats public date keys per locale', () => {
    const label = formatDateKeyPublicLabel('2026-06-04', 'hy', 'UTC');
    expect(label).toMatch(/հունիս/i);
    expect(label).toMatch(/հինգշաբթի/i);
  });

  it('formats appointment date labels with weekday and month', () => {
    const label = formatAppointmentDateLabel('2026-06-04T12:00:00.000Z', 'hy', 'UTC');
    expect(label).toMatch(/հունիս/i);
    expect(label).toMatch(/հինգշաբթի|հնգ/i);
  });

  it('formats date key strip parts for day picker', () => {
    const parts = formatDateKeyStripParts('2026-06-04', 'hy', 'UTC');
    expect(parts.weekday).toMatch(/հնգ/i);
    expect(parts.month).toMatch(/հնս/i);
  });

  it('formats weekday short by index', () => {
    expect(formatWeekdayShortByDayIndex(0, 'ru')).toBeTruthy();
  });

  it('prefixes today inline for nearest-slot labels', () => {
    const tz = 'UTC';
    const today = getTodayDateKey(tz);
    expect(formatNearestSlotDateLabel(today, 'en', tz, 'today')).toMatch(/^today,/);
    expect(formatNearestSlotDateLabel(today, 'hy', tz, 'այսօր')).toMatch(/^այսօր,/);
    expect(formatNearestSlotDateLabel('2099-01-01', 'ru', tz, 'сегодня')).not.toMatch(/^сегодня,/);
  });

  it('resolveNearestSlotDateLabel is re-exported for hydration-safe labels', () => {
    expect(
      resolveNearestSlotDateLabel({
        nearestDateLabel: 'today, 4 June, Thursday',
      }),
    ).toBe('today, 4 June, Thursday');
  });
});

describe('date-format business settings', () => {
  beforeEach(() => {
    setActiveBusinessDateFormats(undefined, undefined);
  });

  it('uses active tenant date format instead of locale ordering', () => {
    setActiveBusinessDateFormats('MM/DD/YYYY', '24h');
    const d = new Date('2026-06-04T12:00:00.000Z');
    expect(formatDateDisplay(d, 'en')).toBe('06/04/2026');
    expect(formatDateDisplay(d, 'hy')).toBe('06/04/2026');
  });

  it('formats checkout slot labels in 12-hour business time', () => {
    setActiveBusinessDateFormats('DD/MM/YYYY', '12h');
    expect(formatScheduleTime('2026-06-04T15:30:00.000Z', 'en')).toMatch(
      /3:30\s*PM/i,
    );
    expect(
      formatBookingDateTimeRange(
        '2026-06-04T10:00:00.000Z',
        '2026-06-04T11:00:00.000Z',
        'en',
      ),
    ).toMatch(/04\/06\/2026 · .*AM/i);
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
