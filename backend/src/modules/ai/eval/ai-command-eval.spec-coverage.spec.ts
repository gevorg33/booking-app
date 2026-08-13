/**
 * AI-ROADMAP Phase 8 — spec examples measured against the shipped detectors.
 *
 * §68 named `not_evaluated` as the blocker between Phase 8 and its exit. This
 * quantifies what is behind it, and the number is worse than "untested".
 *
 * 280 commands have no eval coverage. Their specs carry **559 hand-written
 * example phrasings** — the ones the registry documents as what a user would
 * say. Run against the deterministic harness, **110 pass and 449 fail**: 80% of
 * documented examples do not reach their own command.
 *
 * ## Why these are not registered as eval cases
 *
 * Two bad options were rejected:
 *
 * - registering all 559 puts 449 known-red cases into the corpus and breaks
 *   §25's accuracy ratchet on day one;
 * - registering only the 110 that pass makes a corpus that cannot fail, which
 *   is not a test.
 *
 * So this is a **measurement with a floor**, not a corpus addition. The floor
 * ratchets: 110 may rise and must not fall.
 *
 * ## What passing means here, and what it does not
 *
 * `expect.rescuedAction`, not `expect.action` — probed directly, the same prompt
 * scores 0/1 with `action` and 1/1 with `rescuedAction`, because the
 * deterministic harness evaluates the rescue path. 7,187 of the 8,509 existing
 * cases assert `rescuedAction` for the same reason.
 *
 * So a pass means **a detector routes it**. It is not evidence the planner can,
 * and it cannot become that: the deterministic path IS the detector path. Only
 * §19's shadow comparison can show planner readiness, which is the 7-day step
 * Phase 8 already specifies.
 */
import { AI_COMMAND_EVAL_SPEC_COVERAGE_CASES } from './ai-command-eval.spec-coverage.js';
import { buildDeterministicAccuracyReport } from './ai-command-eval.report.js';

const report = buildDeterministicAccuracyReport([
  ...AI_COMMAND_EVAL_SPEC_COVERAGE_CASES,
]);

/** Measured 2026-08-07. May only rise. */
const ROUTABLE_FLOOR = 113;

/**
 * Of the 449 failures, how many are a *different* command claiming the phrasing
 * rather than nothing claiming it — §132.
 *
 * The split is 343 unclaimed / 106 stolen, and the two are different defects
 * with different fixes: an unclaimed example needs routing built, a stolen one
 * needs a detector narrowed. Only the stolen half can regress by someone else's
 * change, so only it gets a ceiling. **May only fall.**
 *
 * A rise means a newly added or widened detector has started answering to
 * another command's documented phrasing, which is the failure mode §44's
 * miss→fixture pipeline is most likely to introduce.
 */
const STOLEN_CEILING = 101;

/**
 * 2026-08-10 (§150, e2e-bug.426): 106 -> 107, and the guard did its job.
 *
 * `compound_intent` was unroutable on every surface until `e2e-bug.425`, so its
 * claims never showed up here. With it routing, one spec example moved from
 * unclaimed to stolen: `create_booking_subscription_credit`'s "book them using
 * their membership" now decomposes as a compound.
 *
 * The over-claim is **not new** — the decomposer has always read that phrasing
 * as two steps; the surface gate was discarding the result before anything could
 * observe it. Raised rather than reverted because the routing fix is worth 48
 * eval cases and this is one, but it is a real misroute and is filed as
 * `e2e-bug.426` rather than absorbed.
 *
 * 2026-08-04 (e2e-bug.426 closed): 107 -> **106**, and it took *two* fixes,
 * because the compound was hiding a second defect.
 *
 * 1. The decomposer over-claim, as filed. `extractServiceNameFromPrompt`
 *    returned `"them using their membership"` — a pronoun with the payment
 *    clause glued on — and nothing rejected it, so the subscription-first-visit
 *    cue fired. Narrowed in `ai-subscription-first-visit-cue.util.ts`.
 *
 * 2. That alone did **not** move this number. It only changed the thief: the
 *    example went from `got compound_intent` to `got create_booking`.
 *    `isSubscriptionCreditBookingPrompt` matched "using their *subscription*"
 *    but not "using their *membership*", so the command's own documented
 *    phrasing never reached it and fell through to a plain booking. The
 *    compound had been masking that the whole time.
 *
 * The lesson is the one §153/§155 already recorded: measure after each fix, not
 * after both. Fix 1 looked complete and changed nothing here.
 *
 * 2026-08-11 (tech-debt A7): **106 -> 101**, `ROUTABLE_FLOOR` 110 -> 113. Two
 * narrowings, measured one at a time as the lesson above demands.
 *
 * 1. `isExplainProviderAvailabilityPrompt` was answering *"sign in with Apple"*
 *    and *"sign in with Google"* — e2e-bug.334's shape again, the named-schedule
 *    cue reading `with <X>` as a provider. **106 -> 104, and `passed` did not
 *    move**: those two commands have no detector of their own, so the examples
 *    went from stolen to *unclaimed*. That is still the right outcome — the
 *    classifier has explicit rules for both, and the detector was overriding
 *    them — but it is a smaller claim than "fixed".
 *
 * 2. `isMarkPaidPrompt` ended with `mark` + `done|complete|finished` and **no
 *    payment word anywhere**, so *"mark Karo's 10am as completed"* and *"mark
 *    the 3pm massage as done"* — `update_bookings`' own examples — routed to a
 *    T2 money command. **104 -> 101, and `passed` rose 111 -> 113**: here the
 *    victim does have a detector, so the examples actually reach it now.
 *
 * The remaining 101 are a long tail: the largest thief holds 10, spread across
 * 10 different victims. There is no third cluster of this size to take.
 */

/** `rescuedAction: expected X, got Y` — `none` meaning nothing routed it. */
function routedElsewhere(errors: readonly string[]): boolean {
  const got = /got ([a-z_0-9.]+)/i.exec(errors.join(' '))?.[1];
  return got !== undefined && got !== 'none';
}

describe('spec examples for uncovered commands', () => {
  it('generates one case per example, for uncovered commands only', () => {
    // A command the corpus already exercises is skipped: a generated duplicate
    // inflates apparent coverage without testing anything new (§44).
    expect(AI_COMMAND_EVAL_SPEC_COVERAGE_CASES.length).toBeGreaterThan(500);
    const actions = new Set(
      AI_COMMAND_EVAL_SPEC_COVERAGE_CASES.map((c) => c.expect.rescuedAction),
    );
    expect(actions.size).toBeGreaterThan(250);
  });

  it('has not gone backwards on how many examples route', () => {
    // Down means a detector was deleted without the planner covering it, or a
    // spec gained an example nothing routes.
    expect(report.passed).toBeGreaterThanOrEqual(ROUTABLE_FLOOR);
  });

  it('records that most documented examples do not route', () => {
    // The finding, pinned so it cannot quietly stop being true in either
    // direction. If this ever inverts, the floor above should be raised and
    // this assertion rewritten.
    expect(report.failed).toBeGreaterThan(report.passed);
  });

  it('separates unclaimed examples from stolen ones', () => {
    // §132 — "80% of examples fail" hides two unrelated problems. 343 of the
    // 449 route to nothing at all: those commands are unreachable from natural
    // language, and deleting their detectors costs nothing because there is
    // nothing there. The other 106 are contested, and those are where detector
    // retirement can actually lose something.
    const stolen = report.failures.filter((f) => routedElsewhere(f.errors));
    const unclaimed = report.failures.length - stolen.length;
    expect(stolen.length + unclaimed).toBe(report.failed);
    expect(stolen.length).toBeLessThanOrEqual(STOLEN_CEILING);
    // The unclaimed half should stay the dominant one; if it stops being so,
    // the shape of the problem has changed and §132's reading needs revisiting.
    expect(unclaimed).toBeGreaterThan(stolen.length);
  });

  it('asserts the rescue path, because that is what the harness measures', () => {
    // Guards against someone "fixing" these to `expect.action`, which scores
    // zero — the mistake this file was built from and corrected.
    for (const c of AI_COMMAND_EVAL_SPEC_COVERAGE_CASES.slice(0, 20)) {
      expect(c.expect.rescuedAction).toBeTruthy();
      expect(c.expect.action).toBeUndefined();
    }
  });
});
