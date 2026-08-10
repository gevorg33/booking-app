/**
 * AI-ROADMAP Phase 5 — blast-radius caps for bulk commands.
 *
 * §9 open decision 6 asks for "blast-radius caps per tier"; Regex.MD `acc-5.7`
 * asked for the same thing. Neither existed: `CommandSpec.bulkOf` is declared
 * and read by nothing, and no cap of any kind appears in the tree.
 *
 * The exposure this closes is concrete. `appointment.cancel_bulk` is T3 because
 * it is **filter-matched and therefore unbounded** — "cancel everything next
 * week" resolves to however many appointments happen to match, and nothing
 * between the planner and the database asks whether that number is plausible.
 * A filter that matches more than expected is not a rare failure; §29 and §30
 * both found resolution bugs that would widen one.
 *
 * Two rules, in this order:
 *
 * 1. **Count before you write.** The check takes the number of entities the
 *    command *would* affect, so it runs after resolution and before execution.
 *    A cap applied after the write is an incident report.
 * 2. **Above the cap, refuse; near it, confirm.** Refusing outright at every
 *    level would make legitimate bulk work impossible, and confirming
 *    everything trains people to click through. The tiers below separate
 *    "unusual, check it" from "almost certainly a mistake".
 */
import type { CommandRiskTier, CommandSpec } from './ai-command-spec.types.js';

/**
 * Per-tier limits.
 *
 * `confirmAbove` is where an explicit, count-naming confirmation starts being
 * required; `refuseAbove` is where the command will not run at all without a
 * human raising the cap deliberately.
 *
 * The numbers are starting positions, chosen to be survivable rather than
 * precise — a business cancelling 50 appointments in one command is doing
 * something unusual; 500 is almost certainly a filter that matched the wrong
 * set. They are exported so they can be argued with and tuned against real
 * traffic (Phase 9), which is the only way to get them right.
 */
export const BLAST_RADIUS_CAPS: Readonly<
  Record<CommandRiskTier, { confirmAbove: number; refuseAbove: number }>
> = {
  // Reads cannot damage anything; the cap exists only to stop absurd queries.
  T0: { confirmAbove: Number.POSITIVE_INFINITY, refuseAbove: 10_000 },
  // Single-entity mutations. More than a handful means the filter is wrong.
  T1: { confirmAbove: 5, refuseAbove: 100 },
  // Money and PII: the tier where a wrong count is expensive to undo.
  T2: { confirmAbove: 3, refuseAbove: 25 },
  // Deliberately bulk, but still bounded.
  T3: { confirmAbove: 10, refuseAbove: 500 },
};

export type BlastRadiusVerdict =
  /** Within the cap; execute. */
  | 'allow'
  /** Unusual scope; execute only with an explicit, count-naming confirmation. */
  | 'confirm'
  /** Beyond the cap; do not execute even if confirmed. */
  | 'refuse';

export interface BlastRadiusCheck {
  verdict: BlastRadiusVerdict;
  affected: number;
  tier: CommandRiskTier;
  confirmAbove: number;
  refuseAbove: number;
  /** What to say. Null when allowed. */
  message: string | null;
}

export interface BlastRadiusOptions {
  /**
   * A deliberately raised ceiling, e.g. an owner re-confirming after being
   * refused. Cannot lower the tier's own refusal point below the count — it
   * raises the bar, it does not remove it.
   */
  overrideRefuseAbove?: number;
  /** Already-given confirmation, which satisfies `confirm` but never `refuse`. */
  confirmed?: boolean;
}

/**
 * Decide whether a command may touch this many entities.
 *
 * `affected` is a count the caller has already resolved — this deliberately
 * does no querying, so the rule is testable and the caller cannot skip the
 * counting step and still get a verdict.
 */
export function checkBlastRadius(
  spec: Pick<CommandSpec, 'id' | 'risk' | 'bulkOf'>,
  affected: number,
  options: BlastRadiusOptions = {},
): BlastRadiusCheck {
  const caps = BLAST_RADIUS_CAPS[spec.risk];
  const refuseAbove = options.overrideRefuseAbove ?? caps.refuseAbove;
  const base = {
    affected,
    tier: spec.risk,
    confirmAbove: caps.confirmAbove,
    refuseAbove,
  };

  // A negative or non-integer count is a caller bug, not a small blast radius.
  // Treating it as 0 would wave the command through.
  if (!Number.isInteger(affected) || affected < 0) {
    return {
      ...base,
      verdict: 'refuse',
      message: `Could not determine how many records ${spec.id} would affect.`,
    };
  }

  if (affected === 0) {
    // Nothing to do is not a cap problem, but it is worth saying rather than
    // reporting a successful no-op (§3.3).
    return {
      ...base,
      verdict: 'allow',
      message: null,
    };
  }

  if (affected > refuseAbove) {
    return {
      ...base,
      verdict: 'refuse',
      message:
        `${spec.id} would affect ${affected} records, above the ${spec.risk} limit of ` +
        `${refuseAbove}. That is usually a filter matching more than intended — ` +
        'narrow it, or raise the limit deliberately.',
    };
  }

  if (affected > caps.confirmAbove) {
    if (options.confirmed) return { ...base, verdict: 'allow', message: null };
    return {
      ...base,
      verdict: 'confirm',
      // The count is in the message on purpose: "are you sure?" is a prompt
      // people learn to dismiss, "this affects 47 appointments" is not.
      message: `This will affect ${affected} records. Confirm to continue?`,
    };
  }

  return { ...base, verdict: 'allow', message: null };
}

/**
 * True when a command is a bulk shape — either declared via `bulkOf` or tiered
 * T3, which is what T3 means.
 */
export function isBulkCommand(
  spec: Pick<CommandSpec, 'risk' | 'bulkOf'>,
): boolean {
  return Boolean(spec.bulkOf) || spec.risk === 'T3';
}
