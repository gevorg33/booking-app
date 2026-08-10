/**
 * AI-ROADMAP §3.1 — the CommandSpec contract.
 *
 * Today a command's definition is smeared across ~6 places: the registry seed,
 * a dispatch map, the classifier schema, a coverage list, a promotion list, and
 * a domain util. Any one of them can be forgotten — which is exactly how
 * e2e-bug.342 made two actions permanently unreachable with no error anywhere.
 *
 * A `CommandSpec` is the single place a command is declared. Everything else —
 * the planner's shortlist, the tool/function definition, variable validation,
 * surface gating, docs, eval fixtures — is DERIVED from it (see
 * `ai-command-spec.derive.ts`). Adding a command should touch one file.
 *
 * This is introduced alongside the existing `CommandRegistryEntry`, not as a
 * replacement: `ai-command-spec.conformance.spec.ts` asserts the two agree, so
 * the migration can proceed command-by-command without a flag day.
 */
import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';

export type { CommandSurface };

/**
 * Which access tiers may run this command, **per surface**.
 *
 * Per-surface and not a flat list, because a flat list cannot express what the
 * platform actually does. `update_bookings` is `manager`/`owner` on the
 * dashboard but `staff`/`manager`/`owner` on provider — the registry's flat
 * `tiers: ['manager','owner','staff']` therefore grants dashboard access to
 * `staff`, which the live gate refuses. One of the two has to be wrong, and a
 * shape that cannot represent the truth guarantees it will be.
 *
 * A surface absent from this map means the command is not available there at
 * all; it must agree with `CommandSpec.surfaces`.
 */
export type CommandTierMap = Readonly<
  Partial<Record<CommandSurface, readonly AccessTier[]>>
>;

/**
 * Risk tier — determines which safety gates must pass before execution
 * (AI-ROADMAP §6 Phase 7, adopted from Regex.MD §8.5).
 *
 * The existing registry only has a boolean `mutating`, which cannot distinguish
 * "reschedule one appointment" from "cancel every appointment this week" or
 * "issue a refund". Those need different gates.
 */
export type CommandRiskTier =
  /** Read-only. Wrong answer is recoverable by asking again. */
  | 'T0'
  /** Single-entity mutation. Self-verify + resolution confidence required. */
  | 'T1'
  /** Money, PII, or privacy. Preview + confirm always; post-exec check. */
  | 'T2'
  /** Bulk or schedule-wide blast radius. Confirm + cap + rollback path. */
  | 'T3';

/** When the user must confirm before the command executes. */
export type CommandConfirmPolicy =
  | 'never'
  /** Confirm when the plan is ambiguous or entities resolved with low confidence. */
  | 'if-ambiguous'
  /** Always preview and confirm, regardless of confidence. */
  | 'always';

/**
 * Named resolver responsible for turning the user's words into an id/ISO value.
 * Declaring it here is what lets one `EntityResolutionService` (Phase 4) own
 * resolution instead of ≥4 code paths re-parsing names and dates independently.
 */
export type CommandVariableResolver =
  | 'appointment'
  | 'customer'
  | 'employee'
  | 'service'
  | 'datetime'
  | 'date'
  | 'money'
  | 'none';

export type CommandVariableSpec = {
  /**
   * `object` / `object[]` exist because real commands take structured input:
   * `bulk_create_catalog` receives a category plus its service lines as one
   * draft. Flattening that would lose the grouping the handler depends on, and
   * the tool/function schema has to express it for the model to fill it in.
   */
  type: 'string' | 'number' | 'boolean' | 'string[]' | 'object' | 'object[]';
  description: string;
  required: boolean;
  resolver: CommandVariableResolver;
  /** Allowed values, when the variable is a closed set. */
  enum?: readonly string[];
  /** Shape of the object (or of each array item) for `object` / `object[]`. */
  properties?: Readonly<Record<string, CommandVariableSpec>>;
};

/**
 * How a command is undone when a later step in the same plan fails.
 *
 * AI-ROADMAP Phase 5 asks for "saga + compensation cross-aggregate", and Phase
 * 7's rollback waits on this model. The shape is a tagged union rather than an
 * optional `compensatedBy: string` because the interesting cases are the ones a
 * bare command id cannot express, and every one of them is real in this
 * registry:
 *
 * - **`appointment.reschedule`** is undone by rescheduling back — but to *what*?
 *   The original start is nowhere in the plan; it exists only in the row before
 *   the write. Compensation that needs pre-state must declare what to capture,
 *   or it will "undo" an appointment to `undefined`.
 * - **`appointment.mark_paid`** is T2 money. A refund is not an undo: it is a
 *   second financial event with its own record, timing and possibly fees.
 *   Declaring `refund` as its inverse would make the saga silently issue money
 *   movements to tidy up a failed plan.
 * - **`appointment.create`** is "undone" by cancelling, which leaves a cancelled
 *   row and may notify the customer. That is a compensation, not a rollback, and
 *   the distinction is the user's inbox.
 *
 * So `none` is a first-class answer. A saga that cannot fully unwind must say
 * so and name what it left behind, which is strictly more useful than a
 * rollback that reports success while money has moved.
 */
export type CommandCompensation =
  | {
      /**
       * Undo by running another command. `captures` names the variables that
       * must be read from the pre-write state and fed to it.
       */
      kind: 'inverse';
      command: string;
      captures: readonly string[];
    }
  | {
      /** Genuinely irreversible. `reason` is shown when a saga strands it. */
      kind: 'none';
      reason: string;
    }
  | {
      /** Reversible, but only by a human — the saga raises rather than acts. */
      kind: 'manual';
      reason: string;
    };

export type CommandSpec = {
  /** Canonical `domain.verb` id. */
  id: string;
  /**
   * Legacy flat action names this command also answers to. Keeps today's
   * classifier output and every stored trace valid during migration.
   * e2e-bug.342's `create_catalog_test_order` proved aliases already exist in
   * practice with nowhere to be declared.
   */
  aliases: readonly string[];
  domain: string;
  surfaces: readonly CommandSurface[];
  /**
   * Permission model. Filtered into the planner's shortlist **before the model
   * sees it**, which is what makes AI-ROADMAP §4 guardrail 1 ("shortlist is
   * filtered by surface + permission before the planner sees it") true rather
   * than aspirational — until this landed, only the surface half existed.
   */
  tiers: CommandTierMap;
  risk: CommandRiskTier;
  /** One line, written for the planner — this is what disambiguates commands. */
  description: string;
  variables: Readonly<Record<string, CommandVariableSpec>>;
  /** Natural phrasings. Seeds the planner's few-shots AND the eval goldens. */
  examples: readonly string[];
  confirm: CommandConfirmPolicy;
  /** Service that executes it — matches the existing registry `handler`. */
  handler: string;
  /** For bulk commands: the single-entity command this batches. */
  bulkOf?: string;
  /**
   * How to undo this command inside a saga. Required on every mutating spec —
   * `ai-command-spec.conformance.spec.ts` enforces it, because an *absent*
   * compensation and a *declared-impossible* one are the same at runtime and
   * opposite in review. Reads (T0) never need one.
   */
  compensation?: CommandCompensation;
};

export function isMutatingSpec(spec: CommandSpec): boolean {
  return spec.risk !== 'T0';
}

export function requiredVariableNames(spec: CommandSpec): string[] {
  return Object.entries(spec.variables)
    .filter(([, v]) => v.required)
    .map(([name]) => name);
}
