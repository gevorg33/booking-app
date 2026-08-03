import { E2E343_SLASH_DATE_CASES } from './e2e343-mmdd-day-over-12-no-crash.fixtures.js';
import { parseDateInput, toIsoDay } from './date-format.util.js';

describe('e2e-bug.343: parseDateInput/toIsoDay must not crash on MM/DD slash dates with day-of-month > 12', () => {
  it.each(E2E343_SLASH_DATE_CASES.map((row) => [row.id, row] as const))(
    '%s',
    (_id, row) => {
      const parsed = parseDateInput(row.input);
      if (row.expectedIso === null) {
        expect(parsed).toBeNull();
      } else {
        expect(parsed).not.toBeNull();
        expect(parsed!.toISOString().split('T')[0]).toBe(row.expectedIso);
      }

      // toIsoDay must never throw, regardless of input validity.
      expect(() => toIsoDay(row.input)).not.toThrow();
      const iso = toIsoDay(row.input);
      if (row.expectedIso === null) {
        expect(iso).toBe(row.input);
      } else {
        expect(iso).toBe(row.expectedIso);
      }
    },
  );

  it('exact reported ticket crash scenario no longer throws', () => {
    expect(() => toIsoDay('08/19/2026')).not.toThrow();
    expect(toIsoDay('08/19/2026')).toBe('2026-08-19');
  });
});
