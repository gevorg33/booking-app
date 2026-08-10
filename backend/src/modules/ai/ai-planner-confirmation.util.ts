/**
 * e2e-bug.404 — the confirmation path the planner routing seam was missing.
 *
 * ## Why this exists
 *
 * `decidePlannerRoute` used to decline every plan that required confirmation.
 * That was the right call at the time and the wrong shape for a fix: §120
 * measured `reject:needs_confirmation` at **24 of 121** rescue-dependent
 * prompts, which made it the binding constraint on the planner's whole mutating
 * half. Relaxing the condition on its own would have been unsafe, for the reason
 * §121 found:
 *
 * - `CommandSpec` requires confirmation for **210** commands (`requiresConfirmation`,
 *   which derives T2/T3 from the tier and cannot be talked down by the declared
 *   policy);
 * - the runtime's only gate, `DASHBOARD_EXECUTION_CONFIRM_ACTIONS`, names **59**
 *   of them.
 *
 * So 151 commands — `appointment.mark_paid` (T2, money) and
 * `catalog.assign_services_category_bulk` (T3) among them — are commands the spec
 * model says must be confirmed and the runtime would have executed silently.
 *
 * This module closes that gap **for planner-routed actions only**, which lets the
 * seam route them without widening anything.
 *
 * ## Why it re-derives instead of being told
 *
 * The obvious implementation is to have `decidePlannerRoute` return
 * `requiresConfirmation: true` and carry it to the execute gate. That makes the
 * safety property depend on a boolean surviving three hops — the route, the
 * `IntentCandidate`, the understand result — and a dropped field would fail
 * *open*, executing a T2 with no confirmation and no error anywhere.
 *
 * Re-deriving from the registry at the gate cannot be lost in transport, and it
 * reads the same source `validatePlan` read. An unknown action fails **closed**.
 *
 * ## Deliberately scoped to the planner
 *
 * Applying the spec model to every route would change detector traffic too:
 * §122 measured 211 executions of confirm-absent commands with 0 approvals, and
 * most of that is customer-surface payment where the checkout *is* the
 * confirmation and the specs over-declare. Which of those warrant interrupting a
 * user is a product decision (`e2e-bug.405`), not something to settle as a side
 * effect of unblocking the planner.
 */
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { requiresConfirmation } from './ai-command-spec.derive.js';
import { requiresDashboardExecutionConfirmation } from './ai-execution-confirm.util.js';
import type { IntentCandidateSource } from './command-understanding.types.js';
import type { CommandSpec } from './ai-command-spec.types.js';

/**
 * Does the spec model demand confirmation before this action may execute?
 *
 * `action` is a legacy flat action name (what the executor dispatches on), so
 * both the canonical id and the aliases are searched — `decidePlannerRoute`
 * hands back `spec.aliases[0]`, and a caller holding an id should get the same
 * answer.
 *
 * Fails **closed**: an action with no spec returns `true`. The planner only
 * produces actions that came from a spec, so no-match means the registry and the
 * route disagree, and asking the user is the safe side of that disagreement.
 */
export function actionRequiresSpecConfirmation(
  action: string,
  specs: readonly CommandSpec[] = COMMAND_SPECS,
): boolean {
  const spec = specs.find((s) => s.id === action || s.aliases.includes(action));
  if (!spec) return true;
  // `ambiguous: false` — ambiguity is the understand pipeline's judgement and it
  // has already resolved by the time a route exists. This asks only the standing
  // question: does this command always need confirming?
  return requiresConfirmation(spec, { ambiguous: false });
}

/**
 * The execute-time confirmation gate, as a decision rather than a condition
 * buried in `AiCommandService.executeSingleIntent`.
 *
 * It lives here because it is the safety property this whole ticket turns on and
 * nothing constructs `AiCommandService` in a test — a boolean expression inline
 * in a 3,000-line method is asserted by comment, not by anything that would fail.
 *
 * Behaviour for every non-planner source is **byte-identical to before**: the
 * `DASHBOARD_EXECUTION_CONFIRM_ACTIONS` list, and nothing else.
 */
export function shouldConfirmBeforeExecute(input: {
  action: string;
  /** Winning `IntentCandidate.source`; undefined when the pipeline did not run. */
  candidateSource: IntentCandidateSource | undefined;
  /** `isExecutionConfirmed(session)` — the user has already said yes. */
  alreadyConfirmed: boolean;
  specs?: readonly CommandSpec[];
}): boolean {
  if (input.alreadyConfirmed) return false;
  if (requiresDashboardExecutionConfirmation(input.action)) return true;
  if (input.candidateSource !== 'planner') return false;
  return actionRequiresSpecConfirmation(input.action, input.specs);
}
