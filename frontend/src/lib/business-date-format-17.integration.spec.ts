import { beforeEach, describe, expect, it } from 'vitest';
import {
  businessDateFormatPattern,
  businessDateInputPlaceholder,
  parseBusinessDateInput,
  parseBusinessDateToKey,
  setActiveBusinessDateFormats,
} from './business-date-format';
import { formatDateDisplay, toIsoDay } from './date-format';

describe('Sprint 34 — fmt-1.7 business date input parsing', () => {
  beforeEach(() => {
    setActiveBusinessDateFormats(undefined, undefined);
  });

  it.each([
    {
      id: 'ddmm',
      formats: { dateFormat: 'DD/MM/YYYY' as const, timeFormat: '24h' as const },
      typed: '04/06/2026',
      key: '2026-06-04',
      placeholder: '31/12/2026',
    },
    {
      id: 'mmdd',
      formats: { dateFormat: 'MM/DD/YYYY' as const, timeFormat: '12h' as const },
      typed: '06/04/2026',
      key: '2026-06-04',
      placeholder: '12/31/2026',
    },
    {
      id: 'iso',
      formats: { dateFormat: 'YYYY-MM-DD' as const, timeFormat: '24h' as const },
      typed: '2026-06-04',
      key: '2026-06-04',
      placeholder: '2026-12-31',
    },
  ])(
    '$id — placeholder, parse, and toIsoDay respect active format',
    ({ formats, typed, key, placeholder }) => {
      setActiveBusinessDateFormats(formats.dateFormat, formats.timeFormat);
      expect(businessDateInputPlaceholder()).toBe(placeholder);
      expect(businessDateFormatPattern()).toBe(formats.dateFormat);
      expect(parseBusinessDateToKey(typed)).toBe(key);
      expect(toIsoDay(typed)).toBe(key);
      expect(formatDateDisplay(key)).toBe(
        formats.dateFormat === 'YYYY-MM-DD'
          ? key
          : formats.dateFormat === 'MM/DD/YYYY'
            ? '06/04/2026'
            : '04/06/2026',
      );
    },
  );

  it('parseBusinessDateInput accepts underscore and ISO datetime fallback', () => {
    expect(parseBusinessDateInput('01_06_2026', 'DD/MM/YYYY')?.toISOString()).toBe(
      '2026-06-01T12:00:00.000Z',
    );
    expect(
      parseBusinessDateInput('2026-06-04T12:00:00.000Z', 'MM/DD/YYYY')?.toISOString(),
    ).toBe('2026-06-04T12:00:00.000Z');
    expect(parseBusinessDateInput('32/01/2026', 'DD/MM/YYYY')).toBeNull();
    expect(parseBusinessDateInput('   ', 'DD/MM/YYYY')).toBeNull();
    expect(parseBusinessDateInput('not-a-date', 'DD/MM/YYYY')).toBeNull();
  });

  it('MM/DD active format parses April 6 differently from DD/MM', () => {
    setActiveBusinessDateFormats('MM/DD/YYYY', '24h');
    expect(toIsoDay('04/06/2026')).toBe('2026-04-06');
    setActiveBusinessDateFormats('DD/MM/YYYY', '24h');
    expect(toIsoDay('04/06/2026')).toBe('2026-06-04');
  });
});
