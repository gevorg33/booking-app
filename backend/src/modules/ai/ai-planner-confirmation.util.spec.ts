import {
  actionRequiresSpecConfirmation,
  shouldConfirmBeforeExecute,
} from './ai-planner-confirmation.util.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { requiresConfirmation } from './ai-command-spec.derive.js';
import { DASHBOARD_EXECUTION_CONFIRM_ACTIONS } from './ai-execution-confirm.util.js';
import type { CommandSpec } from './ai-command-spec.types.js';

const RUNTIME = new Set<string>(DASHBOARD_EXECUTION_CONFIRM_ACTIONS);

const specsNeedingConfirmation = COMMAND_SPECS.filter((s) =>
  requiresConfirmation(s, { ambiguous: false }),
);

/** The 151 `e2e-bug.404` exists for: spec says confirm, runtime list does not. */
const gapSpecs = specsNeedingConfirmation.filter(
  (s) => !s.aliases.some((a) => RUNTIME.has(a)) && !RUNTIME.has(s.id),
);

describe('actionRequiresSpecConfirmation', () => {
  it('fails closed on an action with no spec', () => {
    // The planner derives its action from a spec, so no match means the route
    // and the registry disagree. Asking the user is the safe side of that.
    expect(actionRequiresSpecConfirmation('no_such_action_at_all')).toBe(true);
  });

  it('answers by alias and by canonical id alike', () => {
    const withAlias = specsNeedingConfirmation.find(
      (s) => s.aliases.length > 0,
    ) as CommandSpec;
    expect(actionRequiresSpecConfirmation(withAlias.id)).toBe(true);
    expect(actionRequiresSpecConfirmation(withAlias.aliases[0])).toBe(true);
  });

  it('does not demand confirmation for a T0 read', () => {
    const read = COMMAND_SPECS.find(
      (s) => s.risk === 'T0' && s.confirm !== 'always' && s.aliases.length > 0,
    ) as CommandSpec;
    expect(actionRequiresSpecConfirmation(read.aliases[0])).toBe(false);
  });

  it('derives T2/T3 from the tier even when the spec declares otherwise', () => {
    // `ALWAYS_CONFIRM_TIERS` cannot be talked down by `confirm: 'never'` — the
    // tier is the boundary, the declaration is a convenience.
    const misdeclared: CommandSpec = {
      ...COMMAND_SPECS[0],
      id: 'zz.misdeclared',
      aliases: ['zz_misdeclared'],
      risk: 'T2',
      confirm: 'never',
    };
    expect(
      actionRequiresSpecConfirmation('zz_misdeclared', [misdeclared]),
    ).toBe(true);
  });

  it('covers every command the runtime confirm list misses — the e2e-bug.404 gap', () => {
    // The point of the whole change: for planner-routed actions, the commands
    // `DASHBOARD_EXECUTION_CONFIRM_ACTIONS` does not name are now confirmed
    // anyway. If this ever finds an uncovered one, the seam is routing a
    // mutation the runtime would execute silently.
    expect(gapSpecs.length).toBeGreaterThan(0);
    const uncovered = gapSpecs.filter(
      (s) => !actionRequiresSpecConfirmation(s.aliases[0] ?? s.id),
    );
    expect(uncovered.map((s) => s.id)).toEqual([]);
  });

  it('the gap is real and large enough to be worth closing', () => {
    // Guards the premise rather than the code: if the two models are ever
    // reconciled (e2e-bug.405) this number collapses and the scoping comment in
    // `ai-command.service.ts` needs rereading.
    expect(specsNeedingConfirmation.length).toBeGreaterThanOrEqual(200);
    expect(gapSpecs.length).toBeGreaterThanOrEqual(100);
  });
});

describe('shouldConfirmBeforeExecute', () => {
  const gapAction = gapSpecs[0].aliases[0] ?? gapSpecs[0].id;
  const listedAction = DASHBOARD_EXECUTION_CONFIRM_ACTIONS[0];

  it('confirms a planner-routed command the runtime list does not name', () => {
    // The behaviour e2e-bug.404 exists to create. Without it the seam would
    // route this command straight into execution.
    expect(
      shouldConfirmBeforeExecute({
        action: gapAction,
        candidateSource: 'planner',
        alreadyConfirmed: false,
      }),
    ).toBe(true);
  });

  it('leaves every non-planner source exactly as it was', () => {
    // The scoping promise. `e2e-bug.405` measured 211 executions of
    // confirm-absent commands on detector traffic; if this ever flips, users
    // start getting interrupted on flows that never asked for it.
    for (const source of [
      'classifier',
      'rescue',
      'semantic_match',
      'fast_heuristic',
      undefined,
    ] as const) {
      expect(
        shouldConfirmBeforeExecute({
          action: gapAction,
          candidateSource: source,
          alreadyConfirmed: false,
        }),
      ).toBe(false);
    }
  });

  it('still confirms the runtime list whatever the source', () => {
    for (const source of ['classifier', 'planner', undefined] as const) {
      expect(
        shouldConfirmBeforeExecute({
          action: listedAction,
          candidateSource: source,
          alreadyConfirmed: false,
        }),
      ).toBe(true);
    }
  });

  it('does not re-ask once the user has confirmed', () => {
    for (const source of ['planner', 'classifier'] as const) {
      expect(
        shouldConfirmBeforeExecute({
          action: gapAction,
          candidateSource: source,
          alreadyConfirmed: true,
        }),
      ).toBe(false);
      expect(
        shouldConfirmBeforeExecute({
          action: listedAction,
          candidateSource: source,
          alreadyConfirmed: true,
        }),
      ).toBe(false);
    }
  });

  it('does not confirm a planner-routed T0 read', () => {
    const read = COMMAND_SPECS.find(
      (s) => s.risk === 'T0' && s.confirm !== 'always' && s.aliases.length > 0,
    ) as CommandSpec;
    expect(
      shouldConfirmBeforeExecute({
        action: read.aliases[0],
        candidateSource: 'planner',
        alreadyConfirmed: false,
      }),
    ).toBe(false);
  });

  it('confirms a planner route naming an action with no spec', () => {
    expect(
      shouldConfirmBeforeExecute({
        action: 'no_such_action_at_all',
        candidateSource: 'planner',
        alreadyConfirmed: false,
      }),
    ).toBe(true);
  });
});
