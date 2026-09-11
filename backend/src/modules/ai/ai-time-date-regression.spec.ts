/**
 * Regression tests for two live booking bugs, e2e-bug.363 and e2e-bug.364.
 *
 * Both shipped for months, both silently produced a *successful* booking at the
 * wrong time — so neither showed up in the completion-rate metric (§28). That is
 * why they are pinned here rather than left to the callers' own suites.
 */
import { extractTimeSlotFromPrompt } from './ai-structural-extractors.js';
import { resolveTomorrowDateKey } from './ai-payments.util.js';

describe('e2e-bug.364 — a space before the meridiem', () => {
  // `\b(\d{1,2}):(\d{2})\b` matched "3:30" inside "at 3:30 pm" because the
  // trailing \b is satisfied by the space, so the am/pm branch never ran.
  it.each([
    ['book me at 3:30 pm', '15:30'],
    ['book me at 3:30pm', '15:30'],
    ['book me 3:30 pm', '15:30'],
    ['book at 5 pm', '17:00'],
    // Dotted form: the old trailing \b could never match after a period.
    ['book for 6:45 p.m.', '18:45'],
    ['book for 6:45 a.m.', '06:45'],
  ])('%s -> %s', (prompt, want) => {
    expect(extractTimeSlotFromPrompt(prompt)).toBe(want);
  });

  it('does not turn midnight into noon, or noon into midnight', () => {
    expect(extractTimeSlotFromPrompt('at 12:00 am')).toBe('00:00');
    expect(extractTimeSlotFromPrompt('at 12:00 pm')).toBe('12:00');
  });

  it('still reads a plain 24-hour time', () => {
    // The fix reorders the branches; it must not break the case that worked.
    expect(extractTimeSlotFromPrompt('book me at 15:30')).toBe('15:30');
    expect(extractTimeSlotFromPrompt('book me at 9')).toBe('09:00');
  });
});

describe('e2e-bug.363 — "tomorrow" in the local evening', () => {
  // 05:00Z on the 8th is 22:00 on the 7th in Los Angeles. The old code did
  // `now + 24h` then `.toISOString()` — the UTC date — so it answered the 9th
  // and booked two days out.
  const evening = new Date('2026-08-08T05:00:00Z');

  it('is the local tomorrow, not the UTC one', () => {
    expect(resolveTomorrowDateKey('America/Los_Angeles', evening)).toBe(
      '2026-08-08',
    );
  });

  it('is still correct for a timezone where it is already the 8th', () => {
    expect(resolveTomorrowDateKey('UTC', evening)).toBe('2026-08-09');
    expect(resolveTomorrowDateKey('Asia/Yerevan', evening)).toBe('2026-08-09');
  });

  it('requires a timezone rather than defaulting to one', () => {
    // A default is what allowed every caller to reintroduce the bug by omission.
    expect(resolveTomorrowDateKey.length).toBeGreaterThanOrEqual(1);
  });
});
