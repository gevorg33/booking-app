import {
  businessDateInputPlaceholder,
  parseBusinessDateInput,
  parseBusinessDateToKey,
} from './business-date-input.util.js';

describe('business-date-input.util (fmt-1.7)', () => {
  it('parses ambiguous slash dates per business dateFormat', () => {
    expect(parseBusinessDateToKey('04/06/2026', 'DD/MM/YYYY')).toBe(
      '2026-06-04',
    );
    expect(parseBusinessDateToKey('04/06/2026', 'MM/DD/YYYY')).toBe(
      '2026-04-06',
    );
  });

  it('accepts ISO and rejects invalid slash months', () => {
    expect(parseBusinessDateToKey('2026-06-04', 'DD/MM/YYYY')).toBe(
      '2026-06-04',
    );
    expect(parseBusinessDateToKey('08/15/2026', 'DD/MM/YYYY')).toBeNull();
    expect(parseBusinessDateInput('08/15/2026', 'MM/DD/YYYY')).not.toBeNull();
  });

  it('exposes placeholders per format', () => {
    expect(businessDateInputPlaceholder('DD/MM/YYYY')).toBe('31/12/2026');
    expect(businessDateInputPlaceholder('MM/DD/YYYY')).toBe('12/31/2026');
  });
});
