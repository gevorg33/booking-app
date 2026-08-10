/**
 * e2e-bug.422 — run the suite from a different day, to find tests that depend
 * on today's date.
 *
 * §145 fixed four `provider-mobile` suites that broke purely because time
 * passed: fixtures naming `2026-06-20` against validators comparing to
 * `Date.now()`, and a `win_back` badge that appeared once a `2026-05-01` visit
 * crossed a 90-day threshold. None of them failed when written. They failed
 * months later, as mystery failures, in a directory no gate watched.
 *
 * A lint cannot find these. 340 files under `modules/ai` and
 * `modules/provider-mobile` contain an ISO date literal and only 8 freeze the
 * clock, because the overwhelming majority of those dates are inert — expected
 * output, fixture identifiers, values never compared to `now`. Flagging all of
 * them would report 332 non-problems.
 *
 * So this detects rather than guesses: shift what the process believes "now" is,
 * re-run, and anything that changes verdict was reading the calendar.
 *
 *     TIME_TRAVEL_DAYS=400 npm run test:ai-known-failures
 *
 * Unset or `0` makes this a no-op, which is the default for every normal run.
 *
 * ## Why it shifts `Date` rather than using fake timers
 *
 * `jest.useFakeTimers()` also replaces `setTimeout` and friends, which changes
 * how asynchronous code runs and would produce failures that are about timers
 * rather than about dates — exactly the confound this is meant to avoid. This
 * subclass moves only the clock: `new Date()` and `Date.now()` answer from the
 * shifted point, and an explicit `new Date('2026-06-20')` is untouched, because
 * a fixture's literal must keep meaning what it says.
 */
const days = Number(process.env.TIME_TRAVEL_DAYS ?? '0');

if (Number.isFinite(days) && days !== 0) {
  const offsetMs = days * 24 * 60 * 60 * 1000;
  const RealDate = Date;

  class ShiftedDate extends RealDate {
    constructor(...args) {
      // Only the zero-argument form means "now". Every other form is an
      // explicit instant the caller named, and shifting it would rewrite the
      // fixture rather than the clock.
      if (args.length === 0) {
        super(RealDate.now() + offsetMs);
        return;
      }
      super(...args);
    }

    static now() {
      return RealDate.now() + offsetMs;
    }
  }

  global.Date = ShiftedDate;
}
