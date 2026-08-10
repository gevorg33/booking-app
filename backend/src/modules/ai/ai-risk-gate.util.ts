/**
 * AI-ROADMAP Phase 7 — per-tier gates, and the preview that makes them mean
 * something.
 *
 * "Risk tiers T0–T3 with per-tier gates; T2/T3 always preview + confirm."
 *
 * Two halves were missing. The **confirm** half was declared but not enforced:
 * `requiresConfirmation` read only `spec.confirm`, so a T2 mis-declared as
 * `confirm: 'never'` executed money and PII operations unconfirmed, and a T3
 * with `confirm: 'if-ambiguous'` skipped the gate whenever the plan happened to
 * be unambiguous. §13's hygiene test catches that at author time over the
 * specced commands only; the tier now decides at runtime as well.
 *
 * The **preview** half did not exist at all. Confirmation without a preview is
 * the "click through" problem §35 named: a dialog that says "are you sure?"
 * trains people to say yes. A preview says *what will change*, per step, so the
 * answer carries information.
 *
 * Built from the plan's resolved variables, never from the user's request —
 * the same discipline as §34's response builder, for the same reason: a preview
 * that restates the request confirms the request, not the operation.
 */
import {
  resolveSpecByAction,
  requiresConfirmation,
} from './ai-command-spec.derive.js';
import type { CommandRiskTier, CommandSpec } from './ai-command-spec.types.js';
import type { CommandPlan, PlanStep } from './ai-command-plan.types.js';

const RISK_ORDER: Record<CommandRiskTier, number> = {
  T0: 0,
  T1: 1,
  T2: 2,
  T3: 3,
};

/** Tiers that must be previewed and confirmed regardless of what a spec says. */
export const PREVIEW_REQUIRED_TIERS: ReadonlySet<CommandRiskTier> = new Set([
  'T2',
  'T3',
]);

export interface PreviewLine {
  stepId: string;
  command: string;
  risk: CommandRiskTier;
  /** One line describing the effect, from the spec plus resolved variables. */
  description: string;
  /** The values that will be written, for a client that renders a table. */
  variables: Record<string, unknown>;
}

export interface PlanGate {
  highestRisk: CommandRiskTier;
  requiresPreview: boolean;
  requiresConfirmation: boolean;
  /** Empty when no preview is required. */
  preview: PreviewLine[];
  /** Why the gate fired, for the trace and for the UI. */
  reasons: string[];
}

function describeStep(spec: CommandSpec, step: PlanStep): string {
  const entries = Object.entries(step.variables).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return spec.description;
  const values = entries
    .map(
      ([k, v]) =>
        `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`,
    )
    .join(', ');
  return `${spec.description} (${values})`;
}

/**
 * Decide the gates for a whole plan.
 *
 * Plan-level, not per step: §3.3 says "any T2/T3 step in the plan → whole plan
 * requires preview + confirm before any write". Confirming step 3 after steps 1
 * and 2 have already run is not a gate, it is a notification.
 */
export function buildPlanGate(
  specs: readonly CommandSpec[],
  plan: CommandPlan,
  options: { ambiguous?: boolean } = {},
): PlanGate {
  const ambiguous = options.ambiguous ?? plan.unresolved.length > 0;

  let highestRisk: CommandRiskTier = 'T0';
  let confirm = false;
  const preview: PreviewLine[] = [];
  const reasons: string[] = [];

  for (const step of plan.steps) {
    const spec = resolveSpecByAction(specs, step.command);
    // An unknown command cannot be previewed or reasoned about. Validation
    // rejects the plan separately; treating it as harmless here would let an
    // unrecognised command sit inside an otherwise-approved preview.
    if (!spec) {
      confirm = true;
      reasons.push(`${step.command} is not a known command`);
      continue;
    }

    if (RISK_ORDER[spec.risk] > RISK_ORDER[highestRisk])
      highestRisk = spec.risk;
    if (requiresConfirmation(spec, { ambiguous })) confirm = true;

    preview.push({
      stepId: step.id,
      command: spec.id,
      risk: spec.risk,
      description: describeStep(spec, step),
      variables: { ...step.variables },
    });
  }

  const requiresPreview = PREVIEW_REQUIRED_TIERS.has(highestRisk);
  if (requiresPreview) {
    reasons.push(`plan contains a ${highestRisk} step`);
  }
  if (ambiguous) reasons.push('plan has unresolved references');

  return {
    highestRisk,
    requiresPreview,
    // A required preview implies a required confirmation: showing someone what
    // will happen and then doing it anyway is not a gate.
    requiresConfirmation: confirm || requiresPreview,
    preview: requiresPreview ? preview : [],
    reasons,
  };
}

/**
 * Human-readable preview text.
 *
 * Numbered, because a plan is ordered and "the second one" has to mean
 * something when the user objects to exactly one line of it.
 */
export function formatPreview(preview: readonly PreviewLine[]): string {
  if (preview.length === 0) return '';
  const lines = preview.map((p, i) => `${i + 1}. ${p.description}`);
  return `This will:\n${lines.join('\n')}`;
}
