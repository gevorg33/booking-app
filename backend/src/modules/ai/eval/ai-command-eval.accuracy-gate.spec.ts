/**
 * AI-ROADMAP Phase 2 — the accuracy gate, as a ratchet.
 *
 * This used to assert `report.failed === 0` against a corpus with 404 known
 * failures out of 8,464 cases. It had therefore never passed, which had two
 * consequences worth naming:
 *
 *   1. `exitCode` was pinned at 1, so every check behind `if (exitCode === 0)`
 *      — baseline staleness, per-intent regression — was unreachable code that
 *      had never run once.
 *   2. It is part of `npm test`, so CI was red before any change was made. A
 *      suite that is always red cannot report a regression (Phase 2, "make red
 *      mean red").
 *
 * The bar is now the committed baseline: failures may fall, never rise, and no
 * individual intent may get worse. The absolute 404 is debt to burn down in
 * Phase 9; this is what stops it growing meanwhile.
 */
import {
  evaluateAccuracyRatchet,
  runAiAccuracyGate,
} from './ai-command-eval.report.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './ai-command-eval.cases.js';

describe('AI accuracy gate (acc-2.8 / acc-2.9)', () => {
  const updateBaseline =
    process.env.UPDATE_AI_EVAL_BASELINE === '1' ||
    process.env.UPDATE_AI_EVAL_BASELINE === 'true';

  const { report, exitCode, baselineWritten, violations } = runAiAccuracyGate({
    cases: AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    updateBaseline,
  });

  it('does not regress against the committed baseline', () => {
    // The message carries the reason, so a failing CI run says which rule broke
    // rather than only that a number differed.
    expect(violations.map((v) => `[${v.code}] ${v.message}`)).toEqual([]);
    expect(exitCode).toBe(0);
  });

  it('ran the whole deterministic corpus', () => {
    expect(report.totalCases).toBeGreaterThanOrEqual(50);
    expect(report.byIntent.length).toBeGreaterThan(0);
  });

  it('is measured against a baseline rather than an aspiration', () => {
    if (updateBaseline) {
      expect(baselineWritten).toBe(true);
      return;
    }
    // Without this the ratchet has nothing to compare to and silently passes —
    // the failure mode that let the old gate's checks sit unreachable.
    expect(report.baseline).not.toBeNull();
    expect(report.baseline?.totalCases).toBe(report.totalCases);
  });

  it('reports the known failure debt without failing on it', () => {
    // Pins the intent of this change: a non-zero failure count is recorded, not
    // fatal. If someone reinstates "zero failures", this test says why not to.
    expect(report.failed).toBeGreaterThan(0);
    // `report.baseline` is the one loaded *before* an update wrote a new file,
    // so re-running the ratchet mid-update compares against the line that was
    // just deliberately moved.
    if (!updateBaseline) expect(evaluateAccuracyRatchet(report)).toEqual([]);
  });
});
