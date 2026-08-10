/**
 * AI-ROADMAP Phase 8 / e2e-bug.392 — giving the planner an execution path.
 *
 * Phase 8 retires paraphrase detectors slice by slice, and every slice ends in
 * "bulk-delete the slice's `legacy_paraphrase` detectors". §89 found the step
 * that recipe never wrote down: the planner has never routed a live request. It
 * is invoked in `ai-gateway.service.ts` *after* the response is built, behind an
 * unset flag, with the comment "it can never affect `opts.result`". Deleting the
 * detectors today would remove routing and replace it with nothing.
 *
 * This is the missing seam. It decides — purely, with no I/O — whether a
 * planner result may serve as the routing decision for one request.
 *
 * ## What it deliberately is not
 *
 * It does not execute anything. Phase 8 is about retiring *classification*, and
 * the planner's job here is to name the action; §33's executor and the existing
 * handler dispatch stay exactly as they are. That keeps the change reversible
 * and keeps the executor out of a cutover it does not need to be part of.
 *
 * ## The conditions, and why each one
 *
 * Numbered as originally written; 4 is struck through rather than renumbered so
 * the reasoning that removed it stays attached to the slot it occupied.
 *
 * Every rejection returns null, and null means "today's behaviour" — the
 * detector path runs untouched. That is the whole safety argument: this can add
 * a route, never remove one.
 *
 * 1. **the domain is enabled** — `AI_PLANNER_EXECUTE_DOMAINS` is a comma list,
 *    unset meaning none. Phase 8 is per-slice, so the flag is per-domain rather
 *    than a global on/off;
 * 2. **the plan is executable** — `validatePlan` already owns permission,
 *    surface, variables and confidence. Re-deciding any of that here would give
 *    two sources of truth for the same question;
 * 3. **exactly one step** — a multi-command plan needs the executor, which is
 *    explicitly out of scope above. A two-step plan is not "worse", it is a
 *    different feature, and silently running only its first step would be the
 *    dishonest reading;
 * 4. ~~**no confirmation required**~~ — **removed by e2e-bug.404.**
 *
 *    This condition declined every confirm-required plan, and §120 measured what
 *    that cost: `reject:needs_confirmation` on **24 of 121** rescue-dependent
 *    prompts, the binding constraint on the planner's entire mutating half.
 *
 *    It was never a *routing* question. §121 established that the execute gate
 *    keys on the action name, so a planner-routed action already meets the same
 *    handshake as any other — the real problem was that the handshake covers 59
 *    of the 210 commands `CommandSpec` says need it, leaving 151 (including
 *    `appointment.mark_paid`, T2 money) that the runtime would execute silently.
 *
 *    The fix is a confirmation path, not a refusal: `ai-planner-confirmation.util.ts`
 *    re-derives the spec requirement at the execute gate for planner-routed
 *    actions. So a confirm-required plan now routes *and* gets confirmed, and
 *    the 151-command gap is closed for exactly the traffic this seam creates.
 *    `requiresConfirmation` below reports the fact for the trace; it is **not**
 *    the enforcement point, deliberately (a boolean in flight can be dropped);
 * 5. **the command has a legacy alias** — the executor dispatches on legacy
 *    action names. A spec with no alias names nothing the handler layer knows.
 */
import type {
  CommandPlan,
  PlanValidationResult,
} from './ai-command-plan.types.js';
import type { CommandSpec } from './ai-command-spec.types.js';

/** Flag name, exported so tests and the trace use one spelling. */
export const PLANNER_EXECUTE_DOMAINS_KEY = 'AI_PLANNER_EXECUTE_DOMAINS';

/**
 * Domains whose `legacy_paraphrase` detectors have been deleted.
 *
 * These are **not** gated by the flag, and that is deliberate. Once a slice's
 * detectors are gone the planner is the only thing that routes it (§92 measured
 * the recovery at 33/34), so making that depend on an environment variable being
 * set correctly would mean a missing env var silently costs 20% of the slice's
 * traffic. Coupling the two in code makes the deletion and the routing a single
 * fact that cannot be half-deployed.
 *
 * A domain joins this list in the same commit that deletes its detectors, never
 * before.
 */
export const RETIRED_DETECTOR_DOMAINS: readonly string[] = ['tour', 'guide'];

/**
 * Domains the planner may route for.
 *
 * Unset, empty or whitespace all mean **none**: the feature is off unless
 * somebody names a slice. Read per call rather than cached at import so a test
 * can set it without module surgery.
 */
export function plannerExecuteDomains(
  env: NodeJS.ProcessEnv = process.env,
): Set<string> {
  // Retired domains are always on; the flag only ever *adds* to them. A slice
  // whose detectors are deleted cannot be turned off by configuration, because
  // there is nothing left to fall back to.
  const domains = new Set(RETIRED_DETECTOR_DOMAINS);
  const raw = env[PLANNER_EXECUTE_DOMAINS_KEY];
  if (typeof raw !== 'string') return domains;
  for (const d of raw.split(',')) {
    const trimmed = d.trim().toLowerCase();
    if (trimmed) domains.add(trimmed);
  }
  return domains;
}

export interface PlannerRoute {
  /** Legacy action name the executor dispatches on. */
  action: string;
  /** Command id the plan named, for the trace. */
  command: string;
  /** The plan's own confidence for this step. */
  confidence: number;
  /** Variables the planner resolved, merged as params downstream. */
  params: Record<string, unknown>;
  domain: string;
  /**
   * Whether the spec model demands confirmation for this command.
   *
   * **Reporting only.** Enforcement is `actionRequiresSpecConfirmation` at the
   * execute gate, which re-derives this from the registry rather than trusting
   * the value here — a flag that travels can be dropped, and dropping this one
   * fails open on a T2. Use it for traces and telemetry, never as the reason to
   * skip a check (e2e-bug.404).
   */
  requiresConfirmation: boolean;
}

/** Why a plan was not used, for the trace. Null route always has one. */
export type PlannerRouteRejection =
  | 'disabled'
  | 'not_executable'
  | 'not_single_step'
  | 'unknown_command'
  | 'domain_not_enabled'
  | 'no_legacy_alias';

export type PlannerRouteDecision =
  | { routed: true; route: PlannerRoute }
  | { routed: false; reason: PlannerRouteRejection };

/**
 * Decide whether this plan may route this request.
 *
 * `specs` is the full registry rather than the shortlist: the shortlist is a
 * retrieval artefact, and a command's domain and alias are properties of the
 * command, not of whether retrieval happened to surface it.
 */
export function decidePlannerRoute(
  plan: CommandPlan,
  validation: PlanValidationResult,
  specs: readonly CommandSpec[],
  enabledDomains: Set<string>,
): PlannerRouteDecision {
  if (enabledDomains.size === 0) {
    return { routed: false, reason: 'disabled' };
  }
  if (!validation.executable) {
    return { routed: false, reason: 'not_executable' };
  }
  if (plan.steps.length !== 1) {
    return { routed: false, reason: 'not_single_step' };
  }
  // Condition 4 used to live here, declining every confirm-required plan. It is
  // gone — see `requiresConfirmation` on the returned route and
  // `ai-planner-confirmation.util.ts` for what replaced it (e2e-bug.404).

  const step = plan.steps[0];
  const spec = specs.find((s) => s.id === step.command);
  if (!spec) {
    // `validatePlan` should have caught this as `unknown_command`; if it did
    // not, refusing here is the safe disagreement.
    return { routed: false, reason: 'unknown_command' };
  }
  if (!enabledDomains.has(spec.domain.toLowerCase())) {
    return { routed: false, reason: 'domain_not_enabled' };
  }

  const action = spec.aliases[0];
  if (!action) {
    return { routed: false, reason: 'no_legacy_alias' };
  }

  return {
    routed: true,
    route: {
      action,
      command: spec.id,
      confidence: step.confidence,
      params: { ...step.variables },
      domain: spec.domain,
      requiresConfirmation: validation.requiresConfirmation,
    },
  };
}
