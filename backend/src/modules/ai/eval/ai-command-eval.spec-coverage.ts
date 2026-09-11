/**
 * AI-ROADMAP Phase 8 — eval coverage derived from the specs.
 *
 * §68 measured what stands between Phase 8 and its exit, and it is not planner
 * accuracy: the dominant blocker across every unready domain is
 * `not_evaluated`. **310 of 696 commands have no eval case at all**, including
 * `update_bookings` — the T3 bulk command used as the worked example for
 * permission gating throughout this programme (§22, e2e-bug.355).
 *
 * The `CommandSpec` contract already says what `examples` are for:
 *
 * > "Natural phrasings. Seeds the planner's few-shots AND the eval goldens."
 *
 * The few-shot half shipped in §52. This is the other half, and it is *derived*
 * rather than transcribed: the cases are generated from `COMMAND_SPECS` at
 * module load, so a spec that gains an example gains a case, and a spec that
 * loses one cannot leave a stale golden behind.
 *
 * ## Only commands with no coverage
 *
 * A command the corpus already exercises is skipped. Hand-written cases are
 * better than generated ones — they were chosen to probe something — and adding
 * generated duplicates alongside them would inflate an intent's apparent
 * coverage without testing anything new, which is the rejection §44 already
 * enforces for mined misses.
 *
 * ## What these cases actually measure — and it is not the planner
 *
 * `expect.action` needs simulated classifier output; without it every case
 * fails. Probed directly: the same prompt scores 0/1 with `expect.action` and
 * 1/1 with `expect.rescuedAction`. The deterministic harness evaluates the
 * **rescue path**, which is why 7,187 of 8,509 existing cases assert
 * `rescuedAction` and only 57 assert `action`.
 *
 * So these are not evidence the planner can route the command. They pin what
 * the **detectors** currently do — and that makes them the regression net Phase
 * 8's bulk-delete needs: delete a detector and the cases for its command fail
 * by name, instead of the loss showing up as a quiet accuracy drift.
 *
 * ## This does not clear §68's `not_evaluated` blocker
 *
 * §68 named missing eval coverage as the thing standing between Phase 8 and its
 * exit, and implied §44's miss→fixture pipeline was the tool. That was only
 * half right. A deterministic case cannot show the planner routes a command
 * *without* its detector, because the deterministic path IS the detector path.
 * Only the §19 shadow comparison can, which is the 7-day step the phase already
 * specifies. Recorded so nobody mistakes 559 green cases for planner readiness.
 */
import { COMMAND_SPECS } from '../ai-command-spec.registry.js';
import type { AiCommandEvalCase } from './ai-command-eval.types.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './ai-command-eval.cases.js';

/**
 * Legacy action names the existing corpus already asserts on.
 *
 * Reads `AI_COMMAND_EVAL_DETERMINISTIC_CASES` (8,509 cases) — what the runner
 * and the §25 baseline actually measure. `AI_COMMAND_EVAL_CASES` is a 31-entry
 * subset and using it would report almost every command as uncovered.
 *
 * An expectation names its action through **several** fields, and counting only
 * `expect.action` finds 57 of 8,509. The corpus overwhelmingly asserts
 * `rescuedAction` (7,187) — that is, it tests the *rescue* path rather than the
 * classifier's own decision. Worth stating plainly because it is the thing
 * Phase 8 deletes: most of this corpus measures the detectors being retired,
 * not the planner replacing them.
 */
function coveredActions(): Set<string> {
  const covered = new Set<string>();
  const add = (v: unknown) => {
    if (typeof v === 'string' && v) covered.add(v);
  };
  for (const c of AI_COMMAND_EVAL_DETERMINISTIC_CASES) {
    const e = c.expect ?? {};
    add(e.action);
    add(e.rescuedAction);
    add(e.semanticMatchAction);
    add(e.validationAction);
    add(e.enrichedAction);
    for (const step of e.compoundSteps ?? []) add(step);
    for (const step of e.compoundActionsContains ?? []) add(step);
  }
  return covered;
}

/**
 * Build one case per example, for commands the corpus does not reach.
 *
 * Asserts **only** `action`. A spec example is evidence of which command a
 * phrasing means; it says nothing about which parameters should be extracted
 * from it, and inventing param expectations would create goldens nobody
 * verified — the same rule §44 applies to mined misses.
 */
function buildSpecCoverageCases(): AiCommandEvalCase[] {
  const covered = coveredActions();
  const cases: AiCommandEvalCase[] = [];
  const seenPrompts = new Set<string>();

  for (const spec of COMMAND_SPECS) {
    const legacy = spec.aliases[0];
    if (!legacy || covered.has(legacy) || covered.has(spec.id)) continue;

    spec.examples.forEach((prompt, i) => {
      const key = prompt.trim().toLowerCase();
      if (!key || seenPrompts.has(key)) return;
      seenPrompts.add(key);
      cases.push({
        id: `spec-coverage-${legacy}-${i}`,
        prompt,
        // The first surface the command is offered on. A spec example is not
        // surface-specific, and picking one keeps the case runnable.
        surface: spec.surfaces[0],
        expect: { rescuedAction: legacy },
      });
    });
  }
  return cases;
}

export const AI_COMMAND_EVAL_SPEC_COVERAGE_CASES: AiCommandEvalCase[] =
  buildSpecCoverageCases();

/**
 * The prompts used as goldens here, for §52's few-shot pool to exclude.
 *
 * Exported as a function rather than a constant so the caller cannot mutate the
 * set the eval corpus depends on.
 */
export function specCoveragePrompts(): Set<string> {
  return new Set(
    AI_COMMAND_EVAL_SPEC_COVERAGE_CASES.map((c) =>
      c.prompt.trim().toLowerCase(),
    ),
  );
}
