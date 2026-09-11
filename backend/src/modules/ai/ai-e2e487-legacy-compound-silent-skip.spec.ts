/**
 * e2e-bug.487 — the legacy compound path no longer drops a mutating step in
 * silence.
 *
 * `compound-command-graph.service.ts` has answered a null plan for a step in
 * `MUST_NOT_SILENTLY_SKIP_ACTIONS` with a stop-and-ask since e2e-bug.329. The
 * legacy `executeCompoundIntents` path never got that branch: it was
 * `if (plan) { plans.push(plan) }` with no `else`, so a step whose plan could
 * not be built was skipped and the compound reported on the steps that did
 * build. Only `plans.length === 0` produced a message — so "cancel my 2pm and
 * rebook it Friday" could cancel and then quietly not rebook.
 *
 * These are source-shape assertions, the same trade §129 and B4 made: reaching
 * that branch behaviourally needs a live classification plus a completion
 * handoff stubbed into exact internal shapes, and the property that matters is
 * structural — that the `else` exists, that it uses the shared rule set rather
 * than a second copy, and that it returns instead of falling through.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MUST_NOT_SILENTLY_SKIP_ACTIONS,
  COMPOUND_MUTATE_ACTION_LABELS,
} from './compound-command-graph.service.js';

const SRC = readFileSync(join(__dirname, 'ai-command.service.ts'), 'utf8');

describe('e2e-bug.487 — legacy compound stops instead of skipping', () => {
  it('has an else branch guarding the must-not-skip actions', () => {
    expect(SRC).toContain(
      'else if (MUST_NOT_SILENTLY_SKIP_ACTIONS.has(parsed.action))',
    );
  });

  it('returns from that branch rather than continuing the loop', () => {
    const at = SRC.indexOf(
      'else if (MUST_NOT_SILENTLY_SKIP_ACTIONS.has(parsed.action))',
    );
    expect(at).toBeGreaterThan(-1);
    const branch = SRC.slice(at, at + 1400);
    expect(branch).toContain('return {');
    expect(branch).toContain('needsClarification: true');
  });

  it('imports the rule set instead of restating it', () => {
    // A second copy of "which actions must not be skipped" is exactly the
    // drift that let the two paths disagree for as long as they did.
    expect(SRC).toMatch(
      /import \{\s*MUST_NOT_SILENTLY_SKIP_ACTIONS,\s*COMPOUND_MUTATE_ACTION_LABELS,\s*\} from '\.\/compound-command-graph\.service\.js'/,
    );
    expect(SRC).not.toContain('MUST_NOT_SILENTLY_SKIP_ACTIONS = new Set');
  });

  it('the shared rule set still covers the mutating booking actions', () => {
    // Guards the import being pointed at an emptied or renamed set.
    for (const action of [
      'create_booking',
      'cancel_bookings',
      'reschedule_booking',
    ]) {
      expect(MUST_NOT_SILENTLY_SKIP_ACTIONS.has(action)).toBe(true);
      expect(COMPOUND_MUTATE_ACTION_LABELS[action]).toBeTruthy();
    }
  });
});
