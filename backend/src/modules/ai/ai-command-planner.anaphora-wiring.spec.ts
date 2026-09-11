/**
 * B4 / e2e-bug.370 — the anaphora pass is wired, not just written.
 *
 * The ticket's whole content is that `resolveAnaphora` and
 * `bindAnaphorToReference` existed with **no caller**. `ai-anaphora.util.spec.ts`
 * covers the resolver and the plan-level pass thoroughly; what no test can
 * cover behaviourally is the call site, because `AiCommandPlannerService`
 * reaches it only after a live OpenAI completion.
 *
 * These are source-shape assertions, deliberately — the same trade §129 made
 * for the confirmation gate (`ai-command.confirmation-gate-wiring.spec.ts`).
 * The invariant that matters here is *ordering and guarding*: the pass must run
 * after validation, only on a failing plan, and its result must be re-validated
 * rather than trusted. Those are properties of where the call sits, and they
 * are exactly what a future edit can break silently — an unwired util is what
 * this ticket is about in the first place.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// `__dirname`, not `import.meta.url`: the project resolves as nodenext but jest
// runs the CommonJS output, where `import.meta` is a syntax error.
const SRC = readFileSync(
  join(__dirname, 'ai-command-planner.service.ts'),
  'utf8',
);

describe('B4 — the planner calls the anaphora pass', () => {
  it('imports it at all — the thing the ticket says was missing', () => {
    expect(SRC).toMatch(
      // e2e-bug.370 widened this to a multi-line import that also brings in
      // `applyConversationRefsToPlan`. The claim is that the intra-plan pass is
      // imported, not the exact shape of the statement.
      /import \{[^}]*\bapplyAnaphoraToPlan\b[^}]*\} from '\.\/ai-anaphora\.util\.js';/,
    );
  });

  it('runs it after validation, not before', () => {
    // Resolution keys off `missing_variables`, which only exists once the plan
    // has been validated.
    const firstValidate = SRC.indexOf('validatePlan(');
    const apply = SRC.indexOf('applyAnaphoraToPlan(');
    expect(firstValidate).toBeGreaterThan(-1);
    expect(apply).toBeGreaterThan(firstValidate);
  });

  it('only runs on a plan that is already failing', () => {
    // The safety property. If this guard is dropped the pass could rewrite a
    // plan that already validated, turning an execution into something else.
    const apply = SRC.indexOf('applyAnaphoraToPlan(');
    const before = SRC.slice(0, apply);
    const guard = before.lastIndexOf('if (!validation.executable)');
    expect(guard).toBeGreaterThan(-1);
    // …and only for steps validation actually reported as short a variable.
    expect(before.slice(guard)).toContain(
      "problem.code === 'missing_variables'",
    );
  });

  it('re-validates the rewritten plan instead of trusting the rewrite', () => {
    const apply = SRC.indexOf('applyAnaphoraToPlan(');
    const after = SRC.slice(apply);
    const changed = after.indexOf('bound.changed');
    expect(changed).toBeGreaterThan(-1);
    expect(after.slice(changed)).toMatch(/validation = validatePlan\(/);
  });

  it('turns an ambiguous referent into a clarify, carrying the question', () => {
    const apply = SRC.indexOf('applyAnaphoraToPlan(');
    const after = SRC.slice(apply);
    const amb = after.indexOf('bound.ambiguous');
    expect(amb).toBeGreaterThan(-1);
    const branch = after.slice(amb, amb + 600);
    expect(branch).toContain("status: 'clarify'");
    expect(branch).toContain('bound.ambiguous.clarification');
  });

  it('returns the rewritten plan, not the decoded one', () => {
    // `decoded.plan` must not survive past the rewrite, or a bound plan would
    // be validated and then thrown away in favour of the original.
    const apply = SRC.indexOf('applyAnaphoraToPlan(');
    // Anchor first: without this, a missing call makes `apply` -1 and
    // `slice(-1)` is the last character, so the assertion below would pass
    // vacuously on exactly the code this ticket exists to prevent. Caught by
    // the negative control, which is what that control is for.
    expect(apply).toBeGreaterThan(-1);
    expect(SRC.slice(apply)).not.toContain('decoded.plan');
  });
});

/**
 * e2e-bug.370 — the cross-turn half is wired, not just written.
 *
 * Same shape as the B4 assertions above, for the same reason: the binder can
 * be perfectly correct and the planner can still hand it `null`, and no unit
 * test of the binder would notice. Negative-controlled by replacing the
 * argument with `null` — this fails, the binder's own tests do not.
 */
describe('e2e-bug.370 — the planner consults the conversation store', () => {
  const SRC = require('node:fs').readFileSync(
    require('node:path').join(__dirname, 'ai-command-planner.service.ts'),
    'utf8',
  ) as string;

  it('calls the cross-turn binder', () => {
    expect(SRC.indexOf('applyConversationRefsToPlan(')).toBeGreaterThan(-1);
  });

  it('passes the store from the planner context', () => {
    const at = SRC.indexOf('applyConversationRefsToPlan(');
    expect(SRC.slice(at, at + 400)).toContain('request.context.entityStore');
  });

  it('runs after the intra-plan pass, which is more specific', () => {
    // A referent inside this plan beats one from a previous turn.
    expect(SRC.indexOf('applyConversationRefsToPlan(')).toBeGreaterThan(
      SRC.indexOf('applyAnaphoraToPlan('),
    );
  });

  it('the pipeline threads the store into the planner context', () => {
    const pipeline = require('node:fs').readFileSync(
      require('node:path').join(
        __dirname,
        'command-understanding-pipeline.service.ts',
      ),
      'utf8',
    ) as string;
    expect(pipeline).toContain('_conversationEntityStore');
    expect(pipeline).toContain('_conversationTurnIndex');
  });
});
