/**
 * AI-ROADMAP Phase 4 — relative date ranges.
 *
 * Unlike the `tomorrow` and time-of-day resolvers (§30, §31), this one did not
 * need replacing. `resolveDateRange` is already timezone-correct — it resolves
 * "today" through `getTodayDateKey(tz)` and does its arithmetic in `dayjs.tz`,
 * so it has none of the UTC exposure that made e2e-bug.363 a day-late bug.
 *
 * What it had were **coverage gaps**: "next 3 weeks", "the next fortnight",
 * "next 2 months" and "the rest of the month" all returned `null`, so the
 * caller fell back to whatever default it had. Those are added here, to the
 * existing resolver rather than a new one — a second range parser would be the
 * fifth re-parser Phase 4 exists to remove.
 *
 * The tests below therefore cover both the additions and the behaviour that
 * must not have changed.
 */
import { resolveDateRange } from './ai-orchestration.helpers.js';

const TZ = 'America/New_York';

/** Resolve against a fixed "today" so the expectations are stable. */
function range(prompt: string): string | null {
  const r = resolveDateRange({}, prompt, TZ);
  return r ? `${r.start}..${r.end}` : null;
}

/** Days between two ISO dates, inclusive of both ends. */
function inclusiveDays(span: string): number {
  const [start, end] = span.split('..');
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return ms / 86_400_000 + 1;
}

describe('resolveDateRange — multi-unit relative ranges', () => {
  describe('spans that used to return null', () => {
    it('resolves "next N weeks" as a rolling window from today', () => {
      const span = range('show me the next 3 weeks');
      expect(span).not.toBeNull();
      expect(inclusiveDays(span!)).toBe(21);
    });

    it('resolves "the next fortnight" as fourteen days', () => {
      expect(inclusiveDays(range('the next fortnight')!)).toBe(14);
    });

    it('resolves "next N months" by calendar month, not by 30-day blocks', () => {
      // The span is start + N months − 1 day, so its length follows the real
      // month lengths rather than a fixed 30 or 31.
      const [start, end] = range('next 2 months')!.split('..');
      const [sy, sm, sd] = start.split('-').map(Number);
      const expected = new Date(Date.UTC(sy, sm - 1 + 2, sd));
      expected.setUTCDate(expected.getUTCDate() - 1);
      expect(end).toBe(expected.toISOString().slice(0, 10));
    });

    it('a two-month span is not simply 60 days', () => {
      const days = inclusiveDays(range('next 2 months')!);
      expect([60, 61, 62]).toContain(days);
    });

    it('accepts number words as well as digits', () => {
      expect(inclusiveDays(range('next three days')!)).toBe(3);
      expect(inclusiveDays(range('next 3 days')!)).toBe(3);
    });

    it('starts "the rest of the month" today, not on the 1st', () => {
      const [start, end] = range('the rest of the month')!.split('..');
      const today = resolveDateRange({}, 'today', TZ);
      expect(start).toBe(today?.start);
      expect(end.slice(8)).not.toBe('01');
      // ...and ends on the last day of that month.
      const [y, m] = end.split('-').map(Number);
      expect(end.slice(8)).toBe(
        String(new Date(Date.UTC(y, m, 0)).getUTCDate()),
      );
    });

    it('starts "the rest of the week" today but keeps the week end', () => {
      // e2e-bug.423 — asserted against `today`, not against "different from the
      // start of this week".
      //
      // The previous assertion was `rest.start !== thisWeek.start`, which fails
      // every Monday — and correctly, because on the first day of the week the
      // rest of the week *is* the whole week. The test encoded an assumption
      // that today is not a Monday, and would have failed one day in seven
      // without anything changing in the resolver. Found by
      // `TIME_TRAVEL_DAYS=1`.
      const rest = range('rest of the week')!;
      const thisWeek = range('this week')!;
      const today = resolveDateRange({}, 'today', TZ);
      expect(rest.split('..')[0]).toBe(today?.start);
      expect(rest.split('..')[1]).toBe(thisWeek.split('..')[1]);
    });

    it('on a Monday, "the rest of the week" is the whole week', () => {
      // The case the old assertion forbade, pinned explicitly rather than left
      // to whichever day the suite happens to run on.
      jest.useFakeTimers({
        now: new Date('2026-08-10T15:00:00.000Z'),
        doNotFake: ['nextTick'],
      });
      try {
        const rest = range('rest of the week')!;
        const thisWeek = range('this week')!;
        expect(rest).toBe(thisWeek);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('existing behaviour is unchanged', () => {
    it('"next week" is still the following calendar week, not a rolling window', () => {
      // The distinction matters: "next week" names a week; "the next 3 weeks"
      // names a span starting now. Both readings are correct English.
      const nextWeek = range('next week')!;
      expect(inclusiveDays(nextWeek)).toBe(7);
      const thisWeek = range('this week')!;
      expect(nextWeek.split('..')[0] > thisWeek.split('..')[1]).toBe(true);
    });

    it.each([
      ['this week', 7],
      ['last week', 7],
      ['the next 7 days', 7],
    ])('%s still spans %i days', (prompt, days) => {
      expect(inclusiveDays(range(prompt)!)).toBe(days);
    });

    it('"this month" still starts on the 1st', () => {
      expect(range('this month')!.split('..')[0].slice(8)).toBe('01');
    });

    it('a named month still resolves to that whole month', () => {
      const span = range('in June')!;
      expect(span.split('..')[0].slice(5)).toBe('06-01');
      expect(span.split('..')[1].slice(5)).toBe('06-30');
    });

    it('an unrecognised phrase still returns null rather than a guess', () => {
      expect(range('whenever you like')).toBeNull();
    });
  });

  it('never returns an inverted range', () => {
    for (const prompt of [
      'next 3 weeks',
      'the next fortnight',
      'next 2 months',
      'rest of the month',
      'rest of the week',
      'this week',
      'next week',
      'last week',
      'this month',
    ]) {
      const span = range(prompt);
      if (!span) continue;
      const [start, end] = span.split('..');
      expect(start <= end).toBe(true);
    }
  });
});
