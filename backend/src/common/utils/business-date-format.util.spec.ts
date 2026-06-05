import {
  DEFAULT_BUSINESS_DATE_FORMAT,
  DEFAULT_BUSINESS_TIME_FORMAT,
  formatDateKeyWithFormat,
  formatDateWithFormat,
  formatTimeWithFormat,
  getBusinessDateFormat,
  getBusinessTimeFormat,
  normalizeBusinessDateFormat,
  normalizeBusinessTimeFormat,
  readBusinessDateFormatSettings,
} from './business-date-format.util.js';

describe('business-date-format.util', () => {
  describe('normalizeBusinessDateFormat', () => {
    it.each([
      ['DD/MM/YYYY', 'DD/MM/YYYY'],
      ['MM/DD/YYYY', 'MM/DD/YYYY'],
      ['YYYY-MM-DD', 'YYYY-MM-DD'],
      [' DD/MM/YYYY ', 'DD/MM/YYYY'],
      ['bad', null],
      [null, null],
      [undefined, null],
    ])('normalizes %s to %s', (input, expected) => {
      expect(normalizeBusinessDateFormat(input)).toBe(expected);
    });

    it('rejects non-string values', () => {
      expect(normalizeBusinessDateFormat(42 as never)).toBeNull();
      expect(normalizeBusinessTimeFormat(42 as never)).toBeNull();
    });
  });

  describe('normalizeBusinessTimeFormat', () => {
    it.each([
      ['24h', '24h'],
      ['12h', '12h'],
      [' 12h ', '12h'],
      ['bad', null],
      [null, null],
    ])('normalizes %s to %s', (input, expected) => {
      expect(normalizeBusinessTimeFormat(input)).toBe(expected);
    });
  });

  describe('getBusinessDateFormat / getBusinessTimeFormat', () => {
    it('reads settings with defaults', () => {
      expect(getBusinessDateFormat({})).toBe(DEFAULT_BUSINESS_DATE_FORMAT);
      expect(getBusinessTimeFormat({})).toBe(DEFAULT_BUSINESS_TIME_FORMAT);
      expect(getBusinessDateFormat({ dateFormat: 'MM/DD/YYYY' })).toBe(
        'MM/DD/YYYY',
      );
      expect(getBusinessTimeFormat({ timeFormat: '12h' })).toBe('12h');
      expect(getBusinessDateFormat({ dateFormat: 'nope' })).toBe(
        DEFAULT_BUSINESS_DATE_FORMAT,
      );
      expect(getBusinessTimeFormat({ timeFormat: 'nope' })).toBe(
        DEFAULT_BUSINESS_TIME_FORMAT,
      );
    });

    it('readBusinessDateFormatSettings returns both fields', () => {
      expect(
        readBusinessDateFormatSettings({
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '12h',
        }),
      ).toEqual({ dateFormat: 'YYYY-MM-DD', timeFormat: '12h' });
    });
  });

  describe('formatDateKeyWithFormat', () => {
    it.each([
      ['2026-06-04', 'DD/MM/YYYY', '04/06/2026'],
      ['2026-06-04', 'MM/DD/YYYY', '06/04/2026'],
      ['2026-06-04', 'YYYY-MM-DD', '2026-06-04'],
      ['bad-key', 'DD/MM/YYYY', 'bad-key'],
    ])('formats %s as %s -> %s', (key, format, expected) => {
      expect(formatDateKeyWithFormat(key, format as never)).toBe(expected);
    });

    it('uses default format when omitted', () => {
      expect(formatDateKeyWithFormat('2026-06-04')).toBe('04/06/2026');
    });
  });

  describe('formatDateWithFormat', () => {
    it('formats Date objects', () => {
      const d = new Date('2026-06-04T12:00:00.000Z');
      expect(formatDateWithFormat(d, 'MM/DD/YYYY')).toBe('06/04/2026');
      expect(formatDateWithFormat(d)).toBe('04/06/2026');
    });
  });

  describe('formatTimeWithFormat', () => {
    const instant = new Date('2026-06-04T13:30:00.000Z');

    it('formats 24h', () => {
      expect(formatTimeWithFormat(instant, '24h')).toMatch(/13:30/);
      expect(formatTimeWithFormat(instant)).toMatch(/13:30/);
    });

    it('formats 12h', () => {
      expect(formatTimeWithFormat(instant, '12h')).toMatch(/1:30\s*PM/i);
    });

    it('returns empty for invalid date', () => {
      expect(formatTimeWithFormat(new Date('bad'), '24h')).toBe('');
    });
  });
});
