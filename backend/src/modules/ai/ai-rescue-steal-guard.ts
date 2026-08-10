/**
 * AI-ROADMAP Phase 3 — the steal guard.
 *
 * The requirement this exists for, stated bluntly: *no wrong command may be
 * stolen from a right command.*
 *
 * Production evidence (`ai_command_trace`, 5,362 rows): the `rescue` stage
 * changes the action on 216 messages. Only 48 of those rescue an `unknown` —
 * the legitimate job. The other 168 **overrode a real classification**, and 57
 * of those swapped one command for another where at least one side *writes*:
 *
 * | classifier said | rescue ran instead | n | note |
 * | --- | --- | --- | --- |
 * | `bulk_create_catalog` | `create_service_category` | 16 | this is e2e-bug.347 |
 * | `update_bookings` | `mark_paid` | 11 | money |
 * | `create_service` | `create_employee` | 3 | wrong entity entirely |
 * | `create_booking` | `create_employee` | 2 | wrong entity entirely |
 * | `adjust_gift_card_balance` | `validate_gift_card` | 2 | money |
 *
 * Every one of those is a user asking for one write and getting a different
 * one. `bulk_create_catalog → create_service_category` is precisely the
 * reported bug where a category is created and its services silently vanish:
 * the classifier had it right and rescue took it away.
 *
 * ## The rule
 *
 * Rescue may not change the action when **all** of these hold:
 *
 *   1. the classifier produced a real action (not `unknown` / `clarify`), and
 *   2. rescue wants a different action, and
 *   3. either side is a mutating command.
 *
 * Read-only → read-only changes are left alone for now; they are wrong but
 * they cannot damage anything, and they retire with their detectors in Phase 8.
 * Rescuing an `unknown` is untouched — that is rescue doing its actual job.
 *
 * Blocking the *action* never blocks the *params*. Structural enrichment is
 * the part of rescue that survives the roadmap, so a blocked rescue still
 * contributes everything it extracted.
 *
 * ## Why there is an allowlist
 *
 * Some rescues currently correct a genuinely wrong classification into the
 * right mutating command, and the eval suite depends on them. Deleting those
 * outright would trade one broken behaviour for another. So they are
 * grandfathered **by name**, and the list is a ratchet: it may only shrink.
 * A newly added rescue can never steal, which is the property that stops this
 * class of bug from growing back while the planner takes over domain by
 * domain (Phase 8).
 */
import { isDashboardPipelineMutatingAction } from './command-pipeline-mutating-actions.util.js';

/** Classifier outputs that mean "no decision" — rescuing these is legitimate. */
export const NON_DECISION_ACTIONS = new Set<string>(['unknown', 'clarify', '']);

/**
 * Rescue reasons permitted to change the action into/out of a mutating command
 * despite a real classification, because today's evals depend on them.
 *
 * **This list may only shrink.** `ai-rescue-steal-guard.boundary.spec.ts`
 * ratchets it. Each entry is a Phase 8 deletion candidate: when the planner
 * covers that domain, the entry and its detector go together.
 */
export const GRANDFATHERED_MUTATING_RESCUES: readonly string[] = [];

/**
 * Domains where rescue may not change the action **at all**, not even
 * read→read.
 *
 * Phase 8's exit condition is "rescue cannot alter `action`" without
 * qualification. Today's guard only blocks changes that touch a mutating
 * command, and measurement says that leaves a real gap: of 307 action changes
 * in `ai_command_trace`, **105 are read→read** and pass unchallenged —
 * `list_services` → `explain_clinic_services` (20 occurrences),
 * `list_upcoming_tour_departures` → `list_tour_calendar_week` (34). Those
 * change what the user is shown.
 *
 * The list is empty because flipping this on globally would be wrong *now*: the
 * planner is still shadow-only (§19), so rescue is currently compensating for
 * classifier mistakes as well as causing them. Blocking it everywhere would
 * remove the compensation before the replacement is live.
 *
 * **This list may only grow** — the mirror of `GRANDFATHERED_MUTATING_RESCUES`,
 * which may only shrink. Phase 8's exit is reached when every domain is in here
 * and that one is empty. A domain is added when its eval accuracy clears the
 * §42 bar, which is Phase 8's own per-slice gate.
 */
export const RESCUE_ACTION_LOCKED_DOMAINS: readonly string[] = [
  // Phase 8 slice 1, locked 2026-08-08 (§93). The precondition this list was
  // waiting on — "the planner is still shadow-only, so rescue is currently
  // compensating for classifier mistakes as well as causing them" — is no longer
  // true for these two domains:
  //
  //   - the planner routes them for real (`RETIRED_DETECTOR_DOMAINS`, §90);
  //   - it clears §42's bar on the slice: 93% held-in, 100% held-out (§88);
  //   - and on the traffic that actually depends on rescue it recovers
  //     **33 of 34** (§92).
  //
  // The 34 in that measurement are the `list_upcoming_tour_departures ->
  // list_tour_calendar_week` changes this file's own comment cites above. This
  // lock is what stops them; the planner is what replaces them.
  'tour',
  'guide',
];

export type RescueStealDecision = {
  /** True when rescue's action change must be discarded. */
  blocked: boolean;
  /** Why — used for the pipeline trace and the telemetry bucket. */
  reason:
    | 'no_action_change'
    | 'classifier_had_no_decision'
    | 'read_only_change'
    | 'domain_locked'
    | 'grandfathered'
    | 'mutating_action_steal';
};

export type RescueStealInput = {
  /** Action the classifier decided on, before rescue ran. */
  classifiedAction: string | null | undefined;
  /** Action rescue wants to run instead. */
  rescuedAction: string;
  /** Stable rescue reason, for the grandfather allowlist. */
  rescueReason?: string;
  /**
   * Domain of the classified command, for `RESCUE_ACTION_LOCKED_DOMAINS`.
   * Omitted means unlocked — a caller that cannot determine the domain gets
   * today's behaviour rather than an accidental global lock.
   */
  domain?: string;
  /** Override for tests and for staged per-domain rollout. */
  lockedDomains?: readonly string[];
};

/**
 * Decide whether a rescue may replace the classifier's action.
 *
 * Pure and total: no I/O, no throwing, same answer for the same input. The
 * pipeline stage stays a thin caller so this rule can be reasoned about — and
 * tested — on its own.
 */
export function evaluateRescueActionChange(
  input: RescueStealInput,
): RescueStealDecision {
  const classified = (input.classifiedAction ?? '').trim();
  const rescued = input.rescuedAction.trim();

  if (classified === rescued) {
    return { blocked: false, reason: 'no_action_change' };
  }
  if (NON_DECISION_ACTIONS.has(classified)) {
    // Nothing was stolen — there was nothing to steal.
    return { blocked: false, reason: 'classifier_had_no_decision' };
  }

  // Phase 8: a locked domain forbids ANY action change, read or write.
  //
  // `lockedDomains` is injectable so the locked path is testable while the
  // shipped list is still empty. A rule whose only data is `[]` is a rule that
  // can be broken without any test noticing.
  const locked = input.lockedDomains ?? RESCUE_ACTION_LOCKED_DOMAINS;
  if (input.domain !== undefined && locked.includes(input.domain)) {
    return { blocked: true, reason: 'domain_locked' };
  }

  const touchesMutation =
    isDashboardPipelineMutatingAction(classified) ||
    isDashboardPipelineMutatingAction(rescued);
  if (!touchesMutation) {
    return { blocked: false, reason: 'read_only_change' };
  }

  if (
    input.rescueReason &&
    GRANDFATHERED_MUTATING_RESCUES.includes(input.rescueReason)
  ) {
    return { blocked: false, reason: 'grandfathered' };
  }

  return { blocked: true, reason: 'mutating_action_steal' };
}

/** Trace detail for a blocked steal — names both sides so triage is possible. */
export function describeBlockedSteal(
  input: RescueStealInput & { decision: RescueStealDecision },
): string {
  return [
    `rescue blocked: would have replaced ${input.classifiedAction ?? 'unknown'}`,
    `with ${input.rescuedAction}`,
    input.rescueReason ? `(reason=${input.rescueReason})` : '(reason=unnamed)',
    '— mutating action steal; params kept, action restored',
  ].join(' ');
}
