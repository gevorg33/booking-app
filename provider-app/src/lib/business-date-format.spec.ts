import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BUSINESS_DATE_FORMAT,
  DEFAULT_BUSINESS_TIME_FORMAT,
  businessDateFormatPattern,
  businessDateInputPlaceholder,
  businessDateToKey,
  formatDateWithFormat,
  formatTimeWithFormat,
  normalizeBusinessDateFormat,
  normalizeBusinessTimeFormat,
  parseBusinessDateInput,
  parseBusinessDateToKey,
  readAuthBusinessDateFormats,
} from './business-date-format';

describe('provider-app business-date-format', () => {
  const instant = new Date('2026-06-04T13:30:00.000Z');

  it('normalizes supported and invalid format codes', () => {
    expect(normalizeBusinessDateFormat('MM/DD/YYYY')).toBe('MM/DD/YYYY');
    expect(normalizeBusinessDateFormat('bad')).toBeNull();
    expect(normalizeBusinessTimeFormat('12h')).toBe('12h');
    expect(normalizeBusinessTimeFormat('bad')).toBeNull();
  });

  it.each([
    ['DD/MM/YYYY', '04/06/2026'],
    ['MM/DD/YYYY', '06/04/2026'],
    ['YYYY-MM-DD', '2026-06-04'],
  ] as const)('formats dates as %s', (format, expected) => {
    expect(formatDateWithFormat(instant, format)).toBe(expected);
  });

  it('formats 24h and 12h times', () => {
    expect(formatTimeWithFormat(instant, '24h')).toMatch(/13:30/);
    expect(formatTimeWithFormat(instant, '12h')).toMatch(/1:30\s*PM/i);
  });

  it('defaults match backend contract', () => {
    expect(DEFAULT_BUSINESS_DATE_FORMAT).toBe('DD/MM/YYYY');
    expect(DEFAULT_BUSINESS_TIME_FORMAT).toBe('24h');
  });

  it('reads auth business formats with fallback', () => {
    expect(
      readAuthBusinessDateFormats({ dateFormat: 'MM/DD/YYYY', timeFormat: '12h' }),
    ).toEqual({ dateFormat: 'MM/DD/YYYY', timeFormat: '12h' });
    expect(readAuthBusinessDateFormats({ dateFormat: 'bad', timeFormat: 'bad' })).toEqual({
      dateFormat: DEFAULT_BUSINESS_DATE_FORMAT,
      timeFormat: DEFAULT_BUSINESS_TIME_FORMAT,
    });
    expect(readAuthBusinessDateFormats(null)).toEqual({
      dateFormat: DEFAULT_BUSINESS_DATE_FORMAT,
      timeFormat: DEFAULT_BUSINESS_TIME_FORMAT,
    });
  });

  it('exposes placeholders and patterns per format', () => {
    expect(businessDateInputPlaceholder('MM/DD/YYYY')).toBe('12/31/2026');
    expect(businessDateFormatPattern('YYYY-MM-DD')).toBe('YYYY-MM-DD');
  });

  it.each([
    { format: 'DD/MM/YYYY' as const, input: '04/06/2026', key: '2026-06-04' },
    { format: 'MM/DD/YYYY' as const, input: '06/04/2026', key: '2026-06-04' },
    { format: 'YYYY-MM-DD' as const, input: '2026-06-04', key: '2026-06-04' },
  ])('parses $input as $format', ({ format, input, key }) => {
    expect(parseBusinessDateToKey(input, format)).toBe(key);
    expect(businessDateToKey(parseBusinessDateInput(input, format)!)).toBe(key);
  });

  it('rejects invalid typed dates', () => {
    expect(parseBusinessDateInput('not-a-date', 'DD/MM/YYYY')).toBeNull();
    expect(parseBusinessDateInput('32/13/2026', 'DD/MM/YYYY')).toBeNull();
    expect(parseBusinessDateInput('31/02/2026', 'DD/MM/YYYY')).toBeNull();
    expect(parseBusinessDateToKey('', 'MM/DD/YYYY')).toBeNull();
  });

  it('parseBusinessDateToKey defaults format when omitted', () => {
    expect(parseBusinessDateToKey('04/06/2026')).toBe('2026-06-04');
  });

  it('parses underscore dates and ISO datetime fallback', () => {
    expect(parseBusinessDateToKey('01_06_2026', 'DD/MM/YYYY')).toBe('2026-06-01');
    expect(
      parseBusinessDateInput('2026-06-04T12:00:00.000Z', 'MM/DD/YYYY')?.toISOString(),
    ).toBe('2026-06-04T12:00:00.000Z');
  });
});
