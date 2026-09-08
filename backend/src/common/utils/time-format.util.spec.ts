import {
  isValidTime24,
  normalizeTime24,
  timeToMinutes,
} from './time-format.util.js';

describe('normalizeTime24 (e2e-bug.469, §219)', () => {
  describe('genuine 12-hour readings still convert', () => {
    it.each([
      ['9:30 pm', '21:30'],
      ['3:30 PM', '15:30'],
      ['12:00 am', '00:00'],
      ['12:00 pm', '12:00'],
      ['07:05 AM', '07:05'],
    ])('%s -> %s', (input, want) => {
      expect(normalizeTime24(input)).toBe(want);
    });
  });

  describe('a meridiem on an already-24h clock is noise, not +12', () => {
    // Before §219 this branch added 12 with no upper bound, so it *fabricated*
    // times rather than passing input through: "13:30 PM" came back as
    // "25:30". That is not the documented fallback (return the input
    // unchanged) — it is an invented value, and one that reads as plausible
    // enough for a caller to store. `extractTimeSlotFromPrompt` already
    // applied this rule; the shared util did not.
    it.each([
      ['13:30 PM', '13:30'],
      ['14:00 pm', '14:00'],
      ['23:59 PM', '23:59'],
    ])('%s -> %s', (input, want) => {
      expect(normalizeTime24(input)).toBe(want);
      expect(isValidTime24(input)).toBe(true);
    });
  });

  describe('malformed input passes through unchanged, so validators can refuse it', () => {
    // Deliberate: this function has ~50 callers and an "always return a string"
    // contract. Returning '00:00' here would silently book midnight, which is
    // worse than a value every validator rejects.
    it.each([['24:00'], ['99:99'], ['25:61']])('%s is echoed, not repaired', (input) => {
      expect(normalizeTime24(input)).toBe(input);
      expect(isValidTime24(input)).toBe(false);
    });

    it('empty input is the one repaired case', () => {
      expect(normalizeTime24('')).toBe('00:00');
    });
  });

  it('timeToMinutes agrees with the normalizer', () => {
    expect(timeToMinutes('9:30 pm')).toBe(21 * 60 + 30);
    expect(timeToMinutes('13:30 PM')).toBe(13 * 60 + 30);
  });
});
