/**
 * AI-ROADMAP Phase 7 — propose-only until the accuracy bar is cleared.
 *
 * The bar existed as a number (§25's baseline, 527 intents) and as a rule in the
 * roadmap. Nothing joined them, so a command with no eval coverage executed
 * exactly like one measured at 100%.
 */
import {
  isProposeOnly,
  PROPOSE_ONLY_ACCURACY_BAR,
  PROPOSE_ONLY_MIN_CASES,
  resolveExecutionMode,
  summarizeExecutionModes,
} from './ai-propose-only.util.js';
import committedBaseline from './eval/ai-command-eval.baseline.json';

const baseline = {
  byIntent: {
    solid: { passed: 20, failed: 0, total: 20, accuracyPct: 100 },
    borderline: { passed: 9, failed: 1, total: 10, accuracyPct: 90 },
    weak: { passed: 5, failed: 5, total: 10, accuracyPct: 50 },
    barely_measured: { passed: 1, failed: 0, total: 1, accuracyPct: 100 },
  },
};

describe('resolveExecutionMode', () => {
  it('clears a command that is measured and accurate', () => {
    const verdict = resolveExecutionMode('solid', baseline);
    expect(verdict.mode).toBe('autonomous');
    expect(verdict.reason).toBe('cleared');
  });

  it('clears a command exactly on the bar', () => {
    // "Clear the bar" means reach it, not beat it.
    expect(resolveExecutionMode('borderline', baseline).mode).toBe(
      'autonomous',
    );
  });

  describe('proposes rather than executes', () => {
    it('when the command has no eval coverage at all', () => {
      // You cannot clear a bar you were never measured against.
      const verdict = resolveExecutionMode('brand_new_command', baseline);
      expect(verdict.mode).toBe('propose_only');
      expect(verdict.reason).toBe('no_coverage');
      expect(verdict.accuracyPct).toBeNull();
    });

    it('when there are too few cases for the percentage to mean anything', () => {
      // 1 of 1 is 100% and tells you nothing. The fix is eval cases, not a
      // lower threshold — and the explanation says so.
      const verdict = resolveExecutionMode('barely_measured', baseline);
      expect(verdict.mode).toBe('propose_only');
      expect(verdict.reason).toBe('insufficient_evidence');
      expect(verdict.accuracyPct).toBe(100);
      expect(verdict.explanation).toContain('Add cases');
    });

    it('when the command is measured and below the bar', () => {
      const verdict = resolveExecutionMode('weak', baseline);
      expect(verdict.mode).toBe('propose_only');
      expect(verdict.reason).toBe('below_bar');
      expect(verdict.explanation).toContain('50%');
    });
  });

  it('distinguishes "unmeasured" from "inaccurate", because the fix differs', () => {
    // One needs eval cases; the other needs the command fixed. Collapsing them
    // into a single "not allowed" would hide which.
    expect(resolveExecutionMode('barely_measured', baseline).reason).not.toBe(
      resolveExecutionMode('weak', baseline).reason,
    );
  });

  describe('the override allowlist', () => {
    it('lets a named command run despite the data', () => {
      const verdict = resolveExecutionMode('weak', baseline, {
        overrides: new Set(['weak']),
      });
      expect(verdict.mode).toBe('autonomous');
      expect(verdict.explanation).toContain('allowlisted');
    });

    it('does not affect commands that are not named', () => {
      expect(
        resolveExecutionMode('weak', baseline, {
          overrides: new Set(['other']),
        }).mode,
      ).toBe('propose_only');
    });
  });

  it('accepts a caller-supplied bar', () => {
    expect(resolveExecutionMode('weak', baseline, { bar: 40 }).mode).toBe(
      'autonomous',
    );
  });

  it('reports the bar it applied, so a refusal is arguable', () => {
    const verdict = resolveExecutionMode('weak', baseline);
    expect(verdict.bar).toBe(PROPOSE_ONLY_ACCURACY_BAR);
    expect(verdict.cases).toBe(10);
  });
});

describe('isProposeOnly', () => {
  it('is the inverse of an autonomous verdict', () => {
    expect(isProposeOnly('solid', baseline)).toBe(false);
    expect(isProposeOnly('weak', baseline)).toBe(true);
  });
});

describe('against the committed baseline', () => {
  const real = committedBaseline as unknown as {
    byIntent: Record<
      string,
      { passed: number; failed: number; total: number; accuracyPct: number }
    >;
  };

  it('holds compound_intent back — its coverage measures routing, not execution', () => {
    // Was `below_bar` at 0% of 48 cases. `e2e-bug.425` took it to 100% by
    // fixing the surface gate that discarded its rescues — nothing about
    // *executing* a compound changed, so the accuracy rule alone would have
    // promoted a multi-step command to autonomous on a routing measurement.
    //
    // §135: compound failures on real traffic are dominated by one constituent
    // step, which no `rescuedAction` assertion can see.
    const verdict = resolveExecutionMode('compound_intent', real);
    expect(verdict.mode).toBe('propose_only');
    expect(verdict.reason).toBe('execution_unproven');
    expect(verdict.accuracyPct).toBe(100);
  });

  it('says so in the explanation rather than understating the accuracy', () => {
    const verdict = resolveExecutionMode('compound_intent', real);
    expect(verdict.explanation).toContain('routing, not execution');
    expect(verdict.cases).toBe(48);
  });

  it('clears a well-measured, accurate command', () => {
    // 30 of 30 in the corpus. `accept_hipaa_baa` is also 100% but has only 4
    // cases, so it is held back as insufficient evidence rather than cleared —
    // which is the distinction the minimum exists to make.
    expect(resolveExecutionMode('add_booking_to_calendar', real).mode).toBe(
      'autonomous',
    );
    expect(resolveExecutionMode('accept_hipaa_baa', real).reason).toBe(
      'insufficient_evidence',
    );
  });

  it('reports the portfolio split the bar produces', () => {
    const summary = summarizeExecutionModes(Object.keys(real.byIntent), real);

    console.log(
      `[AI-ROADMAP propose-only] bar ${PROPOSE_ONLY_ACCURACY_BAR}% / min ${PROPOSE_ONLY_MIN_CASES} cases · ` +
        `autonomous ${summary.autonomous} · propose-only ${summary.proposeOnly} ` +
        `(below bar ${summary.byReason.below_bar}, too few cases ${summary.byReason.insufficient_evidence})`,
    );
    expect(summary.autonomous + summary.proposeOnly).toBe(
      Object.keys(real.byIntent).length,
    );
    // The majority clear; this is a gate on the tail, not a shutdown.
    expect(summary.autonomous).toBeGreaterThan(summary.proposeOnly);
  });
});

describe('summarizeExecutionModes', () => {
  it('counts every command exactly once', () => {
    const summary = summarizeExecutionModes(
      ['solid', 'weak', 'barely_measured', 'unknown_one'],
      baseline,
    );
    expect(summary.autonomous).toBe(1);
    expect(summary.proposeOnly).toBe(3);
    expect(summary.byReason).toEqual({
      cleared: 1,
      below_bar: 1,
      insufficient_evidence: 1,
      no_coverage: 1,
    });
  });

  it('handles an empty command list', () => {
    const summary = summarizeExecutionModes([], baseline);
    expect(summary.autonomous).toBe(0);
    expect(summary.proposeOnly).toBe(0);
  });
});
