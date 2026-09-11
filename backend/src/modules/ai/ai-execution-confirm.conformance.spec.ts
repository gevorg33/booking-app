/**
 * tech-debt E2 / e2e-bug.405 — reconciling the two confirmation models.
 *
 * There are two answers to "must this be confirmed?":
 *
 *   1. `CommandSpec.confirm` — hand-authored per command, three values
 *      (`never` 393, `always` 210, `if-ambiguous` 93).
 *   2. `DASHBOARD_EXECUTION_CONFIRM_ACTIONS` — the runtime gate for
 *      detector-routed dashboard traffic.
 *
 * §129 already made the *planner* re-derive requirement (1), so the new seam
 * cannot drift. Detector traffic still consults (2), and the two had diverged:
 * 13 commands with an explicit `confirm: 'always'` executed on the dashboard
 * without ever prompting (36 traces). Those 13 were reviewed and added.
 *
 * ## Why two models still exist
 *
 * Deriving the runtime gate wholesale from the specs would newly gate **every**
 * dashboard command declaring `confirm: 'always'` — hundreds, most of which
 * have never run. That is a behaviour change nobody has reviewed, so it is not
 * done implicitly. Instead this file pins the relationship:
 *
 *   - the runtime list may never contradict a spec (nothing gated at runtime
 *     may be declared `never`);
 *   - the set of spec-confirm dashboard commands *not* gated at runtime is a
 *     ratchet that may only shrink.
 *
 * So the divergence is measured and can only close, never widen.
 */
import { DASHBOARD_EXECUTION_CONFIRM_ACTIONS } from './ai-execution-confirm.util.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { requiresConfirmation } from './ai-command-spec.derive.js';

type Spec = (typeof COMMAND_SPECS)[number] & {
  aliases?: string[];
  confirm?: string;
  surfaces?: string[];
};

/** Every name a spec can appear under in the runtime (canonical id + aliases). */
function namesFor(spec: Spec): string[] {
  return [spec.id, ...(spec.aliases ?? [])];
}

const SPEC_BY_NAME = new Map<string, Spec>();
for (const spec of COMMAND_SPECS as unknown as Spec[]) {
  for (const name of namesFor(spec)) {
    if (!SPEC_BY_NAME.has(name)) SPEC_BY_NAME.set(name, spec);
  }
}

const RUNTIME: string[] = [...DASHBOARD_EXECUTION_CONFIRM_ACTIONS];

/** Dashboard commands whose spec says "always confirm". */
const SPEC_CONFIRM_DASHBOARD_NAMES = (COMMAND_SPECS as unknown as Spec[])
  // `ambiguous: false` = "required even when the request is unambiguous",
  // which is the only reading that makes a static audit meaningful.
  .filter((s) => requiresConfirmation(s as never, { ambiguous: false }))
  .filter((s) => (s.surfaces ?? []).includes('dashboard'))
  .flatMap(namesFor);

const NOT_GATED = [
  ...new Set(SPEC_CONFIRM_DASHBOARD_NAMES.filter((n) => !RUNTIME.includes(n))),
].sort();

describe('the runtime confirm list is internally sound', () => {
  it('has no duplicates', () => {
    expect(new Set(RUNTIME).size).toBe(RUNTIME.length);
  });

  /**
   * Runtime gates on commands whose spec says `confirm: 'never'`.
   *
   * `operations.staff_service_matrix` is described as *"Show which staff can
   * perform which services"* — a report — so the spec declares `never`, while
   * the runtime interrupts the user to confirm it.
   *
   * **Deliberately not removed.** The registry marks it `mutating: true`, which
   * `e2e-bug.376` records as a *suspected* mis-registration but has not
   * settled. Removing a confirmation gate is a loosening of safety, and doing
   * that on an unresolved contradiction is the wrong direction to guess in. It
   * is pinned here so the disagreement is visible and cannot grow, and it
   * resolves when e2e-bug.376 decides whether the command mutates.
   */
  const KNOWN_CONTRADICTIONS = ['staff_service_matrix'];

  it('gates nothing declared `never`, beyond the one known contradiction', () => {
    const contradictions = RUNTIME.filter(
      (action) => SPEC_BY_NAME.get(action)?.confirm === 'never',
    );
    expect(contradictions.sort()).toEqual([...KNOWN_CONTRADICTIONS].sort());
  });
});

describe('the 13 reviewed commands stay gated (e2e-bug.405)', () => {
  // These executed unprompted in production and were individually reviewed.
  const REVIEWED = [
    'optimize_schedule',
    'apply_schedule',
    'reassign_cancelled',
    'resolve_conflicts',
    'block_schedule',
    'record_expense',
    'delete_expense',
    'mark_paid',
    'create_commission_rule',
    'delete_inventory_product',
    'create_employee',
    'deactivate_promo_code',
    'export_analytics_report',
  ];

  it.each(REVIEWED)('%s requires confirmation at runtime', (action) => {
    expect(RUNTIME).toContain(action);
  });

  it.each(REVIEWED)('%s still declares confirm in its spec', (action) => {
    const spec = SPEC_BY_NAME.get(action);
    expect(spec).toBeDefined();
    expect(requiresConfirmation(spec as never, { ambiguous: false })).toBe(
      true,
    );
  });
});

describe('the divergence between the two models can only shrink', () => {
  /**
   * Spec-confirm dashboard commands not gated at runtime.
   *
   * Baseline taken 2026-08-04, immediately after the 13 reviewed commands were
   * added. Raising this number means a new command declares `confirm: 'always'`
   * while the runtime would execute it unprompted — the exact drift e2e-bug.405
   * is about. Lowering it is the goal.
   */
  const NOT_GATED_BASELINE = 239;

  it(`leaves at most ${NOT_GATED_BASELINE} spec-confirm dashboard commands ungated`, () => {
    expect(NOT_GATED.length).toBeLessThanOrEqual(NOT_GATED_BASELINE);
  });

  it('contains none of the commands known to have executed unprompted', () => {
    // The 13 were the entire observed population of the divergence. If any
    // reappears here, a runtime gate was removed without review.
    for (const action of [
      'optimize_schedule',
      'record_expense',
      'mark_paid',
      'delete_expense',
      'block_schedule',
    ]) {
      expect(NOT_GATED).not.toContain(action);
    }
  });
});
