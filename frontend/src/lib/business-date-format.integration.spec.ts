import { describe, expect, it, beforeEach } from 'vitest';
import {
  BUSINESS_DATE_FORMATS,
  BUSINESS_TIME_FORMATS,
  DEFAULT_BUSINESS_DATE_FORMAT,
  DEFAULT_BUSINESS_TIME_FORMAT,
  readBusinessDateFormat,
  readBusinessTimeFormat,
  setActiveBusinessDateFormats,
  tenantDateFormatPreference,
} from './business-date-format';
import {
  formatBookingDateTimeRange,
  formatDateDisplay,
  formatScheduleTime,
  formatScheduleTimeRange,
  formatTimeDisplay,
  formatTimeRangeDisplay,
  todayDisplay,
} from './date-format';
import type { PublicBusinessProfile } from './public-api';

const bookingStart = '2026-06-04T10:00:00.000Z';
const bookingEnd = '2026-06-04T11:00:00.000Z';

const tenant = (
  dateFormat?: string,
  timeFormat?: string,
): Pick<PublicBusinessProfile, 'dateFormat' | 'timeFormat'> => ({
  dateFormat,
  timeFormat,
});

describe('Sprint 34 — business date format scenario matrix', () => {
  beforeEach(() => {
    setActiveBusinessDateFormats(undefined, undefined);
  });

  it('exposes all supported admin date and time format options', () => {
    expect(BUSINESS_DATE_FORMATS).toEqual([
      'DD/MM/YYYY',
      'MM/DD/YYYY',
      'YYYY-MM-DD',
    ]);
    expect(BUSINESS_TIME_FORMATS).toEqual(['24h', '12h']);
  });

  it.each([
    {
      id: 'european-default',
      profile: tenant(),
      date: '04/06/2026',
      timePattern: /10:00/,
    },
    {
      id: 'us-date',
      profile: tenant('MM/DD/YYYY'),
      date: '06/04/2026',
      timePattern: /10:00/,
    },
    {
      id: 'iso-date',
      profile: tenant('YYYY-MM-DD'),
      date: '2026-06-04',
      timePattern: /10:00/,
    },
    {
      id: 'us-date-12h',
      profile: tenant('MM/DD/YYYY', '12h'),
      date: '06/04/2026',
      timePattern: /10:00\s*AM/i,
    },
    {
      id: 'european-12h',
      profile: tenant('DD/MM/YYYY', '12h'),
      date: '04/06/2026',
      timePattern: /10:00\s*AM/i,
    },
    {
      id: 'iso-12h',
      profile: tenant('YYYY-MM-DD', '12h'),
      date: '2026-06-04',
      timePattern: /10:00\s*AM/i,
    },
  ])(
    'public booking formats checkout summary for $id',
    ({ profile, date, timePattern }) => {
      const prefs = tenantDateFormatPreference(profile);
      setActiveBusinessDateFormats(prefs.dateFormat, prefs.timeFormat);

      expect(formatDateDisplay(bookingStart, 'en')).toBe(date);
      expect(formatScheduleTime(bookingStart, 'en')).toMatch(timePattern);
      expect(formatBookingDateTimeRange(bookingStart, bookingEnd, 'en')).toMatch(
        new RegExp(`${date.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} · `),
      );
    },
  );

  it('uses explicit options over active cache when provided', () => {
    setActiveBusinessDateFormats('DD/MM/YYYY', '24h');
    expect(
      formatDateDisplay(bookingStart, 'en', { dateFormat: 'MM/DD/YYYY' }),
    ).toBe('06/04/2026');
    expect(
      formatScheduleTime(bookingStart, 'en', { timeFormat: '12h' }),
    ).toMatch(/10:00\s*AM/i);
  });

  it('falls back to defaults when tenant profile omits format fields', () => {
    const prefs = tenantDateFormatPreference({});
    expect(prefs).toEqual({
      dateFormat: DEFAULT_BUSINESS_DATE_FORMAT,
      timeFormat: DEFAULT_BUSINESS_TIME_FORMAT,
    });
    setActiveBusinessDateFormats(prefs.dateFormat, prefs.timeFormat);
    expect(formatDateDisplay('2026-06-04', 'en')).toBe('04/06/2026');
    expect(formatScheduleTime('2026-06-04T15:45:00.000Z', 'en')).toMatch(
      /15:45/,
    );
  });

  it('ignores invalid tenant format strings and keeps defaults', () => {
    const prefs = tenantDateFormatPreference({
      dateFormat: 'DD-MM-YYYY',
      timeFormat: '48h',
    });
    expect(prefs.dateFormat).toBe(DEFAULT_BUSINESS_DATE_FORMAT);
    expect(prefs.timeFormat).toBe(DEFAULT_BUSINESS_TIME_FORMAT);
  });

  it('reads persisted business settings for dashboard admin UI', () => {
    const settings = {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD',
    };
    expect(readBusinessDateFormat(settings)).toBe('MM/DD/YYYY');
    expect(readBusinessTimeFormat(settings)).toBe('12h');
  });

  it('formats slot time ranges for provider cards and manage-booking page', () => {
    setActiveBusinessDateFormats('DD/MM/YYYY', '24h');
    const range = formatScheduleTimeRange(bookingStart, bookingEnd, 'en');
    expect(range).toMatch(/10:00–11:00/);

    setActiveBusinessDateFormats('DD/MM/YYYY', '12h');
    const range12 = formatScheduleTimeRange(bookingStart, bookingEnd, 'en');
    expect(range12).toMatch(/AM|PM/i);
  });

  it('supports timezone-aware non-schedule time display', () => {
    setActiveBusinessDateFormats('DD/MM/YYYY', '24h');
    expect(formatTimeDisplay('2026-06-04T10:00:00.000Z', 'en', 'UTC')).toMatch(
      /10:00/,
    );
    expect(
      formatTimeRangeDisplay(
        '2026-06-04T10:00:00.000Z',
        '2026-06-04T11:00:00.000Z',
        'en',
        'UTC',
      ),
    ).toMatch(/10:00–11:00/);
  });

  it('returns raw input for invalid dates without throwing', () => {
    setActiveBusinessDateFormats('MM/DD/YYYY', '12h');
    expect(formatDateDisplay('not-a-date', 'en')).toBe('not-a-date');
    expect(formatScheduleTime('invalid', 'en')).toBe('invalid');
  });

  it('todayDisplay respects active business date format', () => {
    setActiveBusinessDateFormats('YYYY-MM-DD', '24h');
    const label = todayDisplay('UTC');
    expect(label).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
