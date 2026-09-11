/**
 * AI-ROADMAP Phase 2 — the completion-rate metric.
 *
 * These pin the definition, because the definition is the whole point: §7 makes
 * this the north star and "everything else is diagnostic", so a number that
 * quietly means something different from the SQL views would be worse than no
 * number at all.
 */
import {
  buildCompletionRateReport,
  COMPLETION_RATE_TARGET,
  type CompletionCountable,
} from './ai-completion-rate.util.js';

const row = (
  overrides: Partial<CompletionCountable> = {},
): CompletionCountable => ({
  action: 'create_booking',
  surface: 'dashboard',
  outcome: 'executed',
  ...overrides,
});

const rows = (n: number, overrides: Partial<CompletionCountable> = {}) =>
  Array.from({ length: n }, () => row(overrides));

describe('buildCompletionRateReport', () => {
  it('reproduces the roadmap §1.1 distribution', () => {
    // The production shape the whole roadmap is argued from: 64.0% executed,
    // 27.0% failed. If this drifts, §7's north star has changed meaning.
    const report = buildCompletionRateReport([
      ...rows(3433, { outcome: 'executed' }),
      ...rows(1448, { outcome: 'failed' }),
      ...rows(377, { outcome: 'clarified' }),
      ...rows(77, { outcome: 'security_blocked' }),
      ...rows(27, { outcome: 'approval' }),
    ]);
    expect(report.overall.calls).toBe(5362);
    expect(report.overall.completionRate).toBe(64);
    expect(report.overall.failureRate).toBe(27);
  });

  describe('completion rate versus failure rate', () => {
    it('counts a clarify against completion but not as a failure', () => {
      // The distinction §18 insisted on: asking a good question is not breakage.
      const report = buildCompletionRateReport([
        row({ outcome: 'executed' }),
        row({ outcome: 'clarified' }),
      ]);
      expect(report.overall.completionRate).toBe(50);
      expect(report.overall.failureRate).toBe(0);
    });

    it('counts a security block against completion but not as a failure', () => {
      const report = buildCompletionRateReport([
        row({ outcome: 'executed' }),
        row({ outcome: 'security_blocked' }),
      ]);
      expect(report.overall.completionRate).toBe(50);
      expect(report.overall.failureRate).toBe(0);
    });

    it('does not let 1 - completionRate be read as the failure rate', () => {
      const report = buildCompletionRateReport([
        row({ outcome: 'executed' }),
        row({ outcome: 'failed' }),
        row({ outcome: 'clarified' }),
        row({ outcome: 'approval' }),
      ]);
      expect(report.overall.completionRate).toBe(25);
      expect(report.overall.failureRate).toBe(25);
      expect(100 - report.overall.completionRate).not.toBe(
        report.overall.failureRate,
      );
    });
  });

  describe('breakdowns', () => {
    it('splits by surface, worst first', () => {
      const report = buildCompletionRateReport([
        ...rows(5, { surface: 'customer', outcome: 'failed' }),
        ...rows(5, { surface: 'customer', outcome: 'executed' }),
        ...rows(9, { surface: 'provider', outcome: 'executed' }),
        ...rows(1, { surface: 'provider', outcome: 'failed' }),
      ]);
      expect(
        report.bySurface.map((s) => [s.surface, s.completionRate]),
      ).toEqual([
        ['customer', 50],
        ['provider', 90],
      ]);
    });

    it('keys actions by surface, so the same action on two surfaces stays apart', () => {
      // `mark_paid` behaves differently on dashboard and provider; merging them
      // would hide whichever is worse.
      const report = buildCompletionRateReport([
        row({ action: 'mark_paid', surface: 'dashboard', outcome: 'failed' }),
        row({ action: 'mark_paid', surface: 'provider', outcome: 'executed' }),
      ]);
      expect(report.byAction).toHaveLength(2);
    });

    it('reports the commonest failure reason per action', () => {
      const report = buildCompletionRateReport([
        row({ outcome: 'failed', failureReason: 'entity_unresolved' }),
        row({ outcome: 'failed', failureReason: 'entity_unresolved' }),
        row({ outcome: 'failed', failureReason: 'validation' }),
      ]);
      expect(report.byAction[0].topFailureReason).toBe('entity_unresolved');
    });

    it('reports no reason rather than guessing when none were recorded', () => {
      // Every historical row is in this state: `failure_reason` derives from
      // `result.details`, which the trace never persisted.
      const report = buildCompletionRateReport([
        row({ outcome: 'failed', failureReason: null }),
      ]);
      expect(report.byAction[0].topFailureReason).toBeNull();
    });
  });

  describe('worst actions', () => {
    it('ranks by absolute failures, not by rate', () => {
      // A command failing 100% of 40 calls loses fewer completions than one
      // failing 60% of 100. Rate-ranking would put the wrong one first.
      const report = buildCompletionRateReport([
        ...rows(40, { action: 'claim_referral_code', outcome: 'failed' }),
        ...rows(60, { action: 'create_booking', outcome: 'failed' }),
        ...rows(40, { action: 'create_booking', outcome: 'executed' }),
      ]);
      expect(report.worstActions.map((a) => a.action)).toEqual([
        'create_booking',
        'claim_referral_code',
      ]);
    });

    it('ignores actions below the volume floor', () => {
      // One call failing is not a 100%-failing command.
      const report = buildCompletionRateReport([
        row({ action: 'rare_thing', outcome: 'failed' }),
      ]);
      expect(report.worstActions).toEqual([]);
      // ...but it is still present in the full breakdown.
      expect(report.byAction.map((a) => a.action)).toContain('rare_thing');
    });

    it('omits actions that never failed', () => {
      const report = buildCompletionRateReport(
        rows(50, { action: 'list_packages', outcome: 'executed' }),
      );
      expect(report.worstActions).toEqual([]);
    });
  });

  describe('the target', () => {
    it('carries §7’s bar rather than a local guess', () => {
      // The pre-existing `/analytics` endpoint hardcodes 0.75, which is neither
      // the roadmap's target nor backed by a computed metric.
      expect(COMPLETION_RATE_TARGET).toBe(92);
      expect(buildCompletionRateReport([]).target.completionRate).toBe(92);
    });

    it('is not met at the current production rate', () => {
      const report = buildCompletionRateReport([
        ...rows(64, { outcome: 'executed' }),
        ...rows(36, { outcome: 'failed' }),
      ]);
      expect(report.meetsTarget).toBe(false);
    });

    it('is met at or above 92%', () => {
      const report = buildCompletionRateReport([
        ...rows(92, { outcome: 'executed' }),
        ...rows(8, { outcome: 'failed' }),
      ]);
      expect(report.meetsTarget).toBe(true);
    });
  });

  it('returns zeroes rather than NaN for an empty period', () => {
    const report = buildCompletionRateReport([]);
    expect(report.overall.completionRate).toBe(0);
    expect(report.overall.failureRate).toBe(0);
    expect(report.meetsTarget).toBe(false);
  });
});
