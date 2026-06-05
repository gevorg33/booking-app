import { describe, expect, it, beforeEach } from 'vitest';
import {
  DEFAULT_BUSINESS_DATE_FORMAT,
  DEFAULT_BUSINESS_TIME_FORMAT,
  formatDateWithFormat,
  formatTimeWithFormat,
  getActiveBusinessDateFormats,
  setActiveBusinessDateFormats,
  tenantDateFormatPreference,
} from './business-date-format.js';

describe('consumer-app business-date-format', () => {
  beforeEach(() => {
    setActiveBusinessDateFormats(undefined, undefined);
  });

  it('tenantDateFormatPreference resolves profile fields with defaults', () => {
    expect(tenantDateFormatPreference({ dateFormat: 'MM/DD/YYYY', timeFormat: '12h' })).toEqual({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
    expect(tenantDateFormatPreference(null)).toEqual({
      dateFormat: DEFAULT_BUSINESS_DATE_FORMAT,
      timeFormat: DEFAULT_BUSINESS_TIME_FORMAT,
    });
    expect(
      tenantDateFormatPreference({ dateFormat: 'nope', timeFormat: 'nope' }),
    ).toEqual({
      dateFormat: DEFAULT_BUSINESS_DATE_FORMAT,
      timeFormat: DEFAULT_BUSINESS_TIME_FORMAT,
    });
  });

  it.each([
    ['DD/MM/YYYY', '24h', '04/06/2026', /13:30/],
    ['MM/DD/YYYY', '24h', '06/04/2026', /13:30/],
    ['YYYY-MM-DD', '24h', '2026-06-04', /13:30/],
    ['MM/DD/YYYY', '12h', '06/04/2026', /1:30\s*PM/i],
  ] as const)(
    'formats appointment labels for %s + %s',
    (dateFormat, timeFormat, expectedDate, timePattern) => {
      setActiveBusinessDateFormats(dateFormat, timeFormat);
      const instant = new Date('2026-06-04T13:30:00.000Z');
      expect(formatDateWithFormat(instant, dateFormat)).toBe(expectedDate);
      expect(formatTimeWithFormat(instant, timeFormat, 'UTC')).toMatch(timePattern);
      expect(getActiveBusinessDateFormats()).toEqual({ dateFormat, timeFormat });
    },
  );
});
