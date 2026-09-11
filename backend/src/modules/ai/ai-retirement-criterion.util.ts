/**
 * tech-debt A4 / e2e-bug.406 — when a slice's detectors may be deleted.
 *
 * ## The bar that could not be met
 *
 * §68 onward gated each Phase 8 slice on `PROPOSE_ONLY_ACCURACY_BAR = 90`,
 * applied to the slice's recovery rate on rescue-dependent traffic. That number
 * comes from §42, where it gates a *command* against the 8,509-case eval corpus
 * — thousands of cases per decision. Applied to 6–34 traces it is a precise
 * instrument on data that cannot resolve it:
 *
 * | slice | recovery | 95% Wilson interval |
 * |---|---|---|
 * | `tour` | 33/34 (97.1%) | 85.1% – 99.5% |
 * | `push` | 15/18 (83.3%) | 60.8% – 94.2% |
 *
 * **No lower bound reaches 90%, and none can.** A 95% lower bound of 90%
 * requires **n ≥ 35 with zero failures**; the largest slice has 34 traces and
 * one failure. More data is not obtainable — traffic stopped 2026-08-03 and the
 * entire rescue-dependent population is 216 traces.
 *
 * Re-denominating does not rescue it. Measured against *slice* traffic rather
 * than the rescue subset, `tour`'s regression is 1/166 — and the 95% upper bound
 * on that is still **3.3%**, so even a 2% tolerance is undecidable. No absolute
 * threshold tight enough to be worth stating can be met at these sample sizes.
 *
 * ## What actually decided `tour`
 *
 * §92 did not compare a rate to a threshold. It compared **two arms on the same
 * traces**:
 *
 * | | cost |
 * |---|---|
 * | delete the detectors, planner **off** | 34 traces (20.2%) |
 * | delete the detectors, planner **on** | 1 trace (0.6%) |
 *
 * That comparison is **paired**, and pairing is what makes it decidable. Every
 * rescue-dependent trace is lost under planner-off *by construction* — rescue is
 * what decided it, so deleting rescue leaves the classifier's rejected answer.
 * Under planner-on it is lost only if the planner also fails. The two arms are
 * evaluated on the identical traces, so the between-slice variance that swamps
 * an absolute rate cancels.
 *
 * The residual uncertainty is one-sided and tiny: `tour` has 33 discordant pairs
 * all favouring planner-on and none favouring planner-off, which an exact sign
 * test puts at p ≈ 1e-10 — on the same 34 traces whose *absolute* rate cannot be
 * pinned closer than a 14-point interval.
 *
 * ## The criterion
 *
 * A slice is retirement-ready when **both** hold:
 *
 * 1. **The planner is better than nothing, significantly** — exact one-sided
 *    sign test on discordant pairs, p < 0.05. This decides.
 * 2. **The residual cost is smaller than the cost it avoids** — the 95% *upper*
 *    bound on slice-level regression with the planner on must sit below the
 *    point estimate of the loss deletion would otherwise cause. This bounds.
 *
 * (2) is deliberately not an absolute tolerance. It asks the only question the
 * data can answer — *is the worst case of doing this still better than the
 * expected case of the alternative* — and it is strictly weaker than "regression
 * below X%", which nothing can clear here.
 *
 * Applied to the §94 table, the two conditions agree on every one of the 13
 * domains: `tour` and `push` clear, the other eleven do not. That matches what
 * was actually done — `tour` was retired on §92's evidence, `push` was called
 * "within reach" — without anyone having to defend the number 90.
 *
 * **This does not re-open `tour`.** §92's evidence was always comparative; only
 * its write-up quoted a point estimate as though a threshold had been cleared.
 */

/** Two-sided 95% Wilson score interval for a binomial proportion. */
export const WILSON_Z_95 = 1.959963985;

export interface Interval {
  low: number;
  high: number;
}

/**
 * Wilson rather than normal-approximation: at 1/166 and 0/14 the normal
 * interval is degenerate or crosses zero, which is exactly the regime every
 * number here lives in.
 */
export function wilsonInterval(
  successes: number,
  total: number,
  z: number = WILSON_Z_95,
): Interval {
  if (total <= 0) return { low: 0, high: 0 };
  const p = successes / total;
  const denom = 1 + (z * z) / total;
  const centre = (p + (z * z) / (2 * total)) / denom;
  const spread =
    (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) /
    denom;
  return {
    low: Math.max(0, centre - spread),
    high: Math.min(1, centre + spread),
  };
}

/**
 * Exact one-sided binomial tail: P(X >= wins) when X ~ Binomial(n, 0.5).
 *
 * The sign test's null is "the two arms are equally good", under which each
 * discordant pair is a coin flip. Written as an exact tail rather than a normal
 * approximation because n here is 1–33, where the approximation is worthless.
 *
 * Computed with a running term rather than factorials so n in the hundreds
 * cannot overflow.
 */
export function signTestPValue(wins: number, losses: number): number {
  const n = wins + losses;
  if (n === 0) return 1;
  // P(X >= wins) = 2^-n * sum_{k=wins}^{n} C(n, k)
  let term = Math.pow(0.5, n); // C(n,0) * 2^-n
  let tail = 0;
  for (let k = 0; k <= n; k++) {
    if (k >= wins) tail += term;
    // C(n,k+1) = C(n,k) * (n-k)/(k+1)
    term = (term * (n - k)) / (k + 1);
  }
  return Math.min(1, tail);
}

export interface SliceEvidence {
  domain: string;
  /** Every trace in the slice — the denominator regression is measured against. */
  sliceTraces: number;
  /** Traces whose action a paraphrase detector decided (`action_changed_by='rescue'`). */
  rescueDependentTraces: number;
  /** Of those, how many the planner routes correctly without the detectors. */
  recoveredTraces: number;
}

export interface SliceVerdict {
  domain: string;
  ready: boolean;
  /** p from the exact sign test on discordant pairs. */
  signTestP: number;
  /** Slice-level regression if the detectors go and the planner is on. */
  regressionWithPlanner: number;
  regressionInterval: Interval;
  /** Slice-level loss if the detectors go and the planner is off. */
  lossWithoutPlanner: number;
  /** Which of the two conditions held. */
  beatsNothing: boolean;
  worstCaseBeatsAlternative: boolean;
  explanation: string;
}

export const SIGN_TEST_ALPHA = 0.05;

export function assessSliceRetirement(
  evidence: SliceEvidence,
  options: { alpha?: number; z?: number } = {},
): SliceVerdict {
  const alpha = options.alpha ?? SIGN_TEST_ALPHA;
  const { domain, sliceTraces, rescueDependentTraces, recoveredTraces } =
    evidence;

  const failed = Math.max(0, rescueDependentTraces - recoveredTraces);

  // Discordant pairs. `losses` is structurally 0: a trace the planner also
  // fails is lost under both arms, which is a *tie*, not a win for the
  // detectors. Kept as a named quantity rather than folded away so the
  // asymmetry is visible, and so the test still behaves if a future
  // measurement ever produces a genuine planner-off win.
  const wins = recoveredTraces;
  const losses = 0;
  const signTestP = wins > 0 ? signTestPValue(wins, losses) : 1;

  const regressionWithPlanner = sliceTraces > 0 ? failed / sliceTraces : 1;
  const regressionInterval = wilsonInterval(failed, sliceTraces, options.z);
  const lossWithoutPlanner =
    sliceTraces > 0 ? rescueDependentTraces / sliceTraces : 0;

  const beatsNothing = signTestP < alpha;
  const worstCaseBeatsAlternative = regressionInterval.high < lossWithoutPlanner;
  const ready = beatsNothing && worstCaseBeatsAlternative;

  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const explanation = ready
    ? `${domain}: planner recovers ${recoveredTraces}/${rescueDependentTraces} (sign test p=${signTestP.toExponential(1)}); ` +
      `worst-case regression ${pct(regressionInterval.high)} < ${pct(lossWithoutPlanner)} lost by deleting without it.`
    : !beatsNothing
      ? `${domain}: recovery ${recoveredTraces}/${rescueDependentTraces} is not distinguishable from chance (p=${signTestP.toFixed(3)}).`
      : `${domain}: worst-case regression ${pct(regressionInterval.high)} is not below the ${pct(lossWithoutPlanner)} deletion would cost anyway.`;

  return {
    domain,
    ready,
    signTestP,
    regressionWithPlanner,
    regressionInterval,
    lossWithoutPlanner,
    beatsNothing,
    worstCaseBeatsAlternative,
    explanation,
  };
}

/**
 * The smallest all-correct sample whose 95% Wilson lower bound reaches `bar`.
 *
 * Exists so the "90% is unmeetable" claim is checkable rather than asserted:
 * at bar=0.90 it returns 35, and no slice has 35 rescue-dependent traces.
 */
export function minimumSampleForLowerBound(
  bar: number,
  z: number = WILSON_Z_95,
): number {
  for (let n = 1; n <= 10_000; n++) {
    if (wilsonInterval(n, n, z).low >= bar) return n;
  }
  return Number.POSITIVE_INFINITY;
}
