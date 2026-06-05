import { describe, expect, it } from 'vitest';
import {
  BUSINESS_DATE_FORMATS,
  BUSINESS_TIME_FORMATS,
  DEFAULT_BUSINESS_DATE_FORMAT,
  DEFAULT_BUSINESS_TIME_FORMAT,
  formatDateKeyWithFormat,
  formatDateWithFormat,
  formatTimeWithFormat,
  getActiveBusinessDateFormats,
  normalizeBusinessDateFormat,
  normalizeBusinessTimeFormat,
  readBusinessDateFormat,
  readAuthBusinessDateFormats,
  readBusinessDateFormatSettings,
  readBusinessTimeFormat,
  bootstrapAuthBusinessDateFormats,
  businessDateFormatPattern,
  businessDateInputPlaceholder,
  businessDateToKey,
  parseBusinessDateInput,
  parseBusinessDateToKey,
  resolveBootstrapDateFormatPreference,
  setActiveBusinessDateFormats,
  tenantDateFormatPreference,
} from './business-date-format';

describe('business-date-format', () => {
  it('exports supported format option lists', () => {
    expect(BUSINESS_DATE_FORMATS).toHaveLength(3);
    expect(BUSINESS_TIME_FORMATS).toHaveLength(2);
  });

  it('normalizes invalid format codes', () => {
    expect(normalizeBusinessDateFormat('bad')).toBeNull();
    expect(normalizeBusinessDateFormat(42 as never)).toBeNull();
    expect(normalizeBusinessTimeFormat('bad')).toBeNull();
    expect(normalizeBusinessTimeFormat(42 as never)).toBeNull();
    expect(formatDateKeyWithFormat('bad-key', 'DD/MM/YYYY')).toBe('bad-key');
    expect(formatTimeWithFormat(new Date('bad'), '24h')).toBe('');
  });

  it('reads settings with defaults', () => {
    expect(readBusinessDateFormat({})).toBe(DEFAULT_BUSINESS_DATE_FORMAT);
    expect(readBusinessTimeFormat({})).toBe(DEFAULT_BUSINESS_TIME_FORMAT);
    expect(readBusinessDateFormat({ dateFormat: 'MM/DD/YYYY' })).toBe(
      'MM/DD/YYYY',
    );
    expect(readBusinessTimeFormat({ timeFormat: '12h' })).toBe('12h');
    expect(readBusinessDateFormatSettings({ dateFormat: 'YYYY-MM-DD' })).toEqual({
      dateFormat: 'YYYY-MM-DD',
      timeFormat: DEFAULT_BUSINESS_TIME_FORMAT,
    });
  });

  it('formats date keys and dates', () => {
    expect(formatDateKeyWithFormat('2026-06-04', 'MM/DD/YYYY')).toBe('06/04/2026');
    expect(formatDateKeyWithFormat('2026-06-04')).toBe('04/06/2026');
    const d = new Date('2026-06-04T12:00:00.000Z');
    expect(formatDateWithFormat(d, 'YYYY-MM-DD')).toBe('2026-06-04');
    expect(formatDateWithFormat(d)).toBe('04/06/2026');
  });

  it('formats time in 24h and 12h', () => {
    const instant = new Date('2026-06-04T13:30:00.000Z');
    expect(formatTimeWithFormat(instant, '24h')).toMatch(/13:30/);
    expect(formatTimeWithFormat(instant, '12h')).toMatch(/1:30\s*PM/i);
  });

  it('resolveBootstrapDateFormatPreference prefers explicit formats', () => {
    expect(
      resolveBootstrapDateFormatPreference({
        business: { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      }),
    ).toEqual({ dateFormat: 'MM/DD/YYYY', timeFormat: '12h' });
    expect(
      resolveBootstrapDateFormatPreference({
        business: { dateFormat: 'YYYY-MM-DD', timeFormat: '24h' },
      }),
    ).toEqual({ dateFormat: 'YYYY-MM-DD', timeFormat: '24h' });
  });

  it('readAuthBusinessDateFormats and bootstrap hydrate dashboard cache', () => {
    expect(readAuthBusinessDateFormats({ dateFormat: 'MM/DD/YYYY', timeFormat: '12h' })).toEqual({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
    bootstrapAuthBusinessDateFormats({ dateFormat: 'YYYY-MM-DD', timeFormat: '24h' });
    expect(getActiveBusinessDateFormats()).toEqual({
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
    });
  });

  it('tenantDateFormatPreference and active cache', () => {
    expect(
      tenantDateFormatPreference({ dateFormat: 'MM/DD/YYYY', timeFormat: '12h' }),
    ).toEqual({ dateFormat: 'MM/DD/YYYY', timeFormat: '12h' });
    expect(tenantDateFormatPreference({})).toEqual({
      dateFormat: DEFAULT_BUSINESS_DATE_FORMAT,
      timeFormat: DEFAULT_BUSINESS_TIME_FORMAT,
    });
    expect(
      tenantDateFormatPreference({ dateFormat: 'bad', timeFormat: 'bad' }),
    ).toEqual({
      dateFormat: DEFAULT_BUSINESS_DATE_FORMAT,
      timeFormat: DEFAULT_BUSINESS_TIME_FORMAT,
    });
    setActiveBusinessDateFormats('YYYY-MM-DD', '12h');
    expect(getActiveBusinessDateFormats()).toEqual({
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '12h',
    });
    setActiveBusinessDateFormats(undefined, undefined);
    expect(getActiveBusinessDateFormats()).toEqual({
      dateFormat: DEFAULT_BUSINESS_DATE_FORMAT,
      timeFormat: DEFAULT_BUSINESS_TIME_FORMAT,
    });
  });

  it('parses typed dates using active business format', () => {
    setActiveBusinessDateFormats('MM/DD/YYYY', '24h');
    expect(businessDateInputPlaceholder()).toBe('12/31/2026');
    expect(businessDateFormatPattern()).toBe('MM/DD/YYYY');
    expect(parseBusinessDateToKey('06/04/2026')).toBe('2026-06-04');
    const parsed = parseBusinessDateInput('06/04/2026');
    expect(parsed && businessDateToKey(parsed)).toBe('2026-06-04');
    expect(parseBusinessDateInput('invalid')).toBeNull();
    expect(parseBusinessDateInput('31/02/2026', 'DD/MM/YYYY')).toBeNull();
  });
});
