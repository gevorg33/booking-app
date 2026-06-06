import { beforeEach, describe, expect, it } from 'vitest';
import {
  BUSINESS_DATE_FORMAT_EXAMPLES,
  businessDateFormatPattern,
  businessDateInputPlaceholder,
  businessDateToKey,
  parseBusinessDateInput,
  parseBusinessDateToKey,
  setActiveBusinessDateFormats,
} from './business-date-format';
import { formatDateDisplay, toIsoDay } from './date-format';

const AMBIGUOUS = '04/06/2026';

const PARSE_MATRIX = [
  {
    id: 'ddmm-24h',
    dateFormat: 'DD/MM/YYYY' as const,
    ambiguousKey: '2026-06-04',
    typed: '04/06/2026',
    isoTyped: '2026-06-04',
    display: '04/06/2026',
    example: '31/12/2026',
  },
  {
    id: 'ddmm-12h',
    dateFormat: 'DD/MM/YYYY' as const,
    ambiguousKey: '2026-06-04',
    typed: '15/08/2026',
    isoTyped: '2026-08-15',
    display: '15/08/2026',
    example: '31/12/2026',
  },
  {
    id: 'mmdd-24h',
    dateFormat: 'MM/DD/YYYY' as const,
    ambiguousKey: '2026-04-06',
    typed: '06/04/2026',
    isoTyped: '2026-06-04',
    display: '06/04/2026',
    example: '12/31/2026',
  },
  {
    id: 'mmdd-12h',
    dateFormat: 'MM/DD/YYYY' as const,
    ambiguousKey: '2026-04-06',
    typed: '08/15/2026',
    isoTyped: '2026-08-15',
    display: '08/15/2026',
    example: '12/31/2026',
  },
  {
    id: 'iso-24h',
    dateFormat: 'YYYY-MM-DD' as const,
    ambiguousKey: '2026-06-04',
    typed: '2026-06-04',
    isoTyped: '2026-06-04',
    display: '2026-06-04',
    example: '2026-12-31',
  },
  {
    id: 'iso-12h',
    dateFormat: 'YYYY-MM-DD' as const,
    ambiguousKey: '2026-06-04',
    typed: '2026-08-15',
    isoTyped: '2026-08-15',
    display: '2026-08-15',
    example: '2026-12-31',
  },
] as const;

describe('Sprint 34 — fmt-1.7 business date input scenario matrix', () => {
  beforeEach(() => {
    setActiveBusinessDateFormats(undefined, undefined);
  });

  it('exposes format examples for every supported dateFormat', () => {
    expect(BUSINESS_DATE_FORMAT_EXAMPLES).toEqual({
      'DD/MM/YYYY': '31/12/2026',
      'MM/DD/YYYY': '12/31/2026',
      'YYYY-MM-DD': '2026-12-31',
    });
  });

  describe.each(PARSE_MATRIX)(
    '$id',
    ({ dateFormat, ambiguousKey, typed, isoTyped, display, example }) => {
      it('placeholder and pattern follow active format', () => {
        setActiveBusinessDateFormats(dateFormat, '24h');
        expect(businessDateInputPlaceholder()).toBe(example);
        expect(businessDateFormatPattern()).toBe(dateFormat);
        expect(businessDateInputPlaceholder(dateFormat)).toBe(example);
        expect(businessDateFormatPattern(dateFormat)).toBe(dateFormat);
      });

      it('parses typed and ISO inputs to calendar keys', () => {
        setActiveBusinessDateFormats(dateFormat, '24h');
        expect(parseBusinessDateToKey(typed)).toBe(isoTyped);
        expect(toIsoDay(typed)).toBe(isoTyped);
        expect(parseBusinessDateToKey(isoTyped)).toBe(isoTyped);
        expect(formatDateDisplay(isoTyped)).toBe(display);
        expect(formatDateDisplay(typed)).toBe(display);
      });

      it('disambiguates ambiguous slash dates per format', () => {
        setActiveBusinessDateFormats(dateFormat, '24h');
        expect(parseBusinessDateToKey(AMBIGUOUS)).toBe(ambiguousKey);
        expect(toIsoDay(AMBIGUOUS)).toBe(ambiguousKey);
      });

      it('parses with explicit format override without active cache', () => {
        setActiveBusinessDateFormats('DD/MM/YYYY', '24h');
        expect(parseBusinessDateToKey(typed, dateFormat)).toBe(isoTyped);
        expect(parseBusinessDateInput(typed, dateFormat)).not.toBeNull();
      });
    },
  );

  it('businessDateToKey round-trips parsed UTC dates', () => {
    const parsed = parseBusinessDateInput('06/04/2026', 'MM/DD/YYYY')!;
    expect(businessDateToKey(parsed)).toBe('2026-06-04');
  });

  it('rejects invalid calendar days and empty input', () => {
    expect(parseBusinessDateInput('')).toBeNull();
    expect(parseBusinessDateInput('31/02/2026', 'DD/MM/YYYY')).toBeNull();
    expect(parseBusinessDateInput('00/01/2026', 'DD/MM/YYYY')).toBeNull();
    expect(parseBusinessDateInput('01/00/2026', 'MM/DD/YYYY')).toBeNull();
    expect(parseBusinessDateToKey('garbage')).toBeNull();
  });

  it('underscore input always uses DD/MM ordering', () => {
    expect(parseBusinessDateToKey('01_06_2026')).toBe('2026-06-01');
    setActiveBusinessDateFormats('MM/DD/YYYY', '24h');
    expect(parseBusinessDateToKey('01_06_2026')).toBe('2026-06-01');
  });
});
