/**
 * tech-debt A4 / e2e-bug.406 — the retirement criterion, checked against the
 * real slices.
 *
 * Two things need pinning. The statistics have to be right — a sign test and a
 * Wilson interval are easy to write subtly wrong, and every Phase 8 deletion
 * decision would inherit the error. And the criterion has to reproduce the
 * decisions that were actually made on evidence: `tour` retired, `push` "within
 * reach", eleven domains held.
 */
import {
  assessSliceRetirement,
  minimumSampleForLowerBound,
  signTestPValue,
  wilsonInterval,
  type SliceEvidence,
} from './ai-retirement-criterion.util.js';

describe('wilsonInterval', () => {
  it('reproduces the two intervals e2e-bug.406 was filed on', () => {
    const tour = wilsonInterval(33, 34);
    expect(tour.low * 100).toBeCloseTo(85.1, 1);
    expect(tour.high * 100).toBeCloseTo(99.5, 1);

    const push = wilsonInterval(15, 18);
    expect(push.low * 100).toBeCloseTo(60.8, 1);
    expect(push.high * 100).toBeCloseTo(94.2, 1);
  });

  it('stays inside [0,1] at the degenerate ends', () => {
    expect(wilsonInterval(0, 5).low).toBe(0);
    expect(wilsonInterval(5, 5).high).toBe(1);
    expect(wilsonInterval(0, 0)).toEqual({ low: 0, high: 0 });
  });

  it('narrows as n grows, which is the whole argument', () => {
    const small = wilsonInterval(9, 10);
    const large = wilsonInterval(900, 1000);
    expect(large.high - large.low).toBeLessThan(small.high - small.low);
  });
});

describe('the 90% bar is unmeetable, not merely unmet', () => {
  it('needs 35 all-correct traces, and the largest slice has 34', () => {
    expect(minimumSampleForLowerBound(0.9)).toBe(35);
  });

  it('no slice reaches a 90% lower bound even at its measured best', () => {
    // `tour` is the best slice there has ever been. It still cannot clear it.
    expect(wilsonInterval(33, 34).low).toBeLessThan(0.9);
    expect(wilsonInterval(34, 34).low).toBeLessThan(0.9);
  });

  it('a 70% bar would be reachable, which is why it was the alternative', () => {
    expect(minimumSampleForLowerBound(0.7)).toBe(9);
    expect(wilsonInterval(33, 34).low).toBeGreaterThan(0.7);
    // …but `push`, the second-best slice, still fails it. A lower absolute
    // threshold moves the line; it does not make small samples informative.
    expect(wilsonInterval(15, 18).low).toBeLessThan(0.7);
  });
});

describe('signTestPValue', () => {
  it('is the exact binomial tail, not an approximation', () => {
    // All wins: P(X >= n) = 2^-n.
    expect(signTestPValue(33, 0)).toBeCloseTo(Math.pow(0.5, 33), 15);
    expect(signTestPValue(15, 0)).toBeCloseTo(Math.pow(0.5, 15), 12);
    // 2 of 2 is p=0.25 — nowhere near significant, which is the point for the
    // slices sitting at 2 recoveries.
    expect(signTestPValue(2, 0)).toBeCloseTo(0.25, 12);
    expect(signTestPValue(1, 0)).toBeCloseTo(0.5, 12);
  });

  it('handles a mixed split symmetrically', () => {
    expect(signTestPValue(5, 5)).toBeGreaterThan(0.5);
    expect(signTestPValue(0, 0)).toBe(1);
    // Complementary tails of the same distribution must exceed 1 by exactly
    // the shared central term, never be nonsense.
    expect(signTestPValue(6, 4)).toBeLessThan(signTestPValue(4, 6));
  });

  it('does not overflow on a large n where factorials would', () => {
    const p = signTestPValue(500, 500);
    expect(Number.isFinite(p)).toBe(true);
    expect(p).toBeGreaterThan(0.4);
    expect(p).toBeLessThanOrEqual(1);
  });
});

/**
 * The §94 recovery table joined to slice totals from `ai_command_trace`.
 *
 * `sliceTraces` is every trace whose action maps to that domain (5,362-row
 * corpus, traffic stopped 2026-08-03). §92 quotes 168 for `tour` against 166
 * here: §92's slice was the 15 detectors it was deleting, this is the domain.
 * The one-trace difference changes no verdict and the discrepancy is recorded
 * rather than smoothed.
 */
const SLICES: readonly SliceEvidence[] = [
  {
    domain: 'tour',
    sliceTraces: 166,
    rescueDependentTraces: 34,
    recoveredTraces: 33,
  },
  {
    domain: 'push',
    sliceTraces: 41,
    rescueDependentTraces: 18,
    recoveredTraces: 15,
  },
  {
    domain: 'commerce',
    sliceTraces: 50,
    rescueDependentTraces: 11,
    recoveredTraces: 2,
  },
  {
    domain: 'catalog',
    sliceTraces: 120,
    rescueDependentTraces: 22,
    recoveredTraces: 2,
  },
  {
    domain: 'booking',
    sliceTraces: 1634,
    rescueDependentTraces: 34,
    recoveredTraces: 2,
  },
  {
    domain: 'operations',
    sliceTraces: 653,
    rescueDependentTraces: 30,
    recoveredTraces: 1,
  },
  {
    domain: 'business',
    sliceTraces: 99,
    rescueDependentTraces: 14,
    recoveredTraces: 0,
  },
  {
    domain: 'clinic',
    sliceTraces: 82,
    rescueDependentTraces: 23,
    recoveredTraces: 0,
  },
  {
    domain: 'customer',
    sliceTraces: 400,
    rescueDependentTraces: 11,
    recoveredTraces: 0,
  },
  {
    domain: 'marketing',
    sliceTraces: 72,
    rescueDependentTraces: 8,
    recoveredTraces: 0,
  },
  {
    domain: 'payment',
    sliceTraces: 584,
    rescueDependentTraces: 8,
    recoveredTraces: 0,
  },
  {
    domain: 'guide',
    sliceTraces: 245,
    rescueDependentTraces: 2,
    recoveredTraces: 0,
  },
  {
    domain: 'compliance',
    sliceTraces: 6,
    rescueDependentTraces: 1,
    recoveredTraces: 0,
  },
];

describe('assessSliceRetirement against the measured slices', () => {
  const verdicts = new Map(
    SLICES.map((s) => [s.domain, assessSliceRetirement(s)]),
  );

  it('clears exactly `tour` and `push`', () => {
    const ready = [...verdicts.values()]
      .filter((v) => v.ready)
      .map((v) => v.domain);
    expect(ready.sort()).toEqual(['push', 'tour']);
  });

  it('reproduces §92 for `tour` — the decision this criterion has to agree with', () => {
    const tour = verdicts.get('tour')!;
    // §92: 34 traces lost without the planner, 1 with it.
    expect(tour.lossWithoutPlanner * 100).toBeCloseTo(20.5, 1);
    expect(tour.regressionWithPlanner * 100).toBeCloseTo(0.6, 1);
    expect(tour.signTestP).toBeLessThan(1e-9);
    expect(tour.ready).toBe(true);
  });

  it('the two conditions never disagree on real data', () => {
    // If they ever split, the criterion is doing two different jobs and the
    // write-up claiming they agree is stale.
    for (const v of verdicts.values()) {
      expect(v.beatsNothing).toBe(v.worstCaseBeatsAlternative);
    }
  });

  it('holds a slice whose recovery is indistinguishable from chance', () => {
    const catalog = verdicts.get('catalog')!;
    expect(catalog.beatsNothing).toBe(false);
    expect(catalog.signTestP).toBeCloseTo(0.25, 6);
    expect(catalog.explanation).toContain('not distinguishable from chance');
  });

  it('holds every zero-recovery slice without dividing by zero', () => {
    for (const domain of [
      'business',
      'clinic',
      'customer',
      'marketing',
      'payment',
      'guide',
      'compliance',
    ]) {
      const v = verdicts.get(domain)!;
      expect(v.ready).toBe(false);
      expect(v.signTestP).toBe(1);
      // With no recovery, deleting costs exactly what it costs without a planner.
      expect(v.regressionWithPlanner).toBeCloseTo(v.lossWithoutPlanner, 12);
    }
  });

  it('is not just re-deriving a 90% recovery rate under another name', () => {
    // `push` recovers 83.3%, below the old bar, and is ready here. If the new
    // criterion agreed with the old one everywhere it would not be worth having.
    const evidence = SLICES.find((s) => s.domain === 'push')!;
    const oldBarVerdict =
      (evidence.recoveredTraces / evidence.rescueDependentTraces) * 100;
    expect(oldBarVerdict).toBeLessThan(90);
    expect(verdicts.get('push')!.ready).toBe(true);
  });

  it('would refuse a slice that recovers well but leaves a worse worst case', () => {
    // Constructed, not measured: 4/4 recovered is p=0.0625 — not significant —
    // even though the point estimate is a perfect 100%. A criterion that reads
    // only the rate would retire this.
    const tiny = assessSliceRetirement({
      domain: 'tiny',
      sliceTraces: 10,
      rescueDependentTraces: 4,
      recoveredTraces: 4,
    });
    expect(tiny.regressionWithPlanner).toBe(0);
    expect(tiny.beatsNothing).toBe(false);
    expect(tiny.ready).toBe(false);
  });
});

describe('the criterion is stated in terms nothing else can quietly change', () => {
  it('does not import the propose-only accuracy bar', () => {
    // e2e-bug.406 is that §42's command-level bar was reused for slices. The
    // fix is worthless if this file reaches for it again.
    const source = require('node:fs').readFileSync(
      require('node:path').join(__dirname, 'ai-retirement-criterion.util.ts'),
      'utf8',
    ) as string;
    expect(source).not.toMatch(/import[^;]*PROPOSE_ONLY_ACCURACY_BAR/);
  });
});
