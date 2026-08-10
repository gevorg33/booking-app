/**
 * AI-ROADMAP Phase 7 — post-execution assertion for T2/T3.
 *
 * A handler returning `success: true` is a *claim*, not evidence. Three bugs on
 * this programme were exactly that claim being false — e2e-bug.136
 * (`clear_schedule`), e2e-bug.348 ("category created" when it wasn't) and
 * e2e-bug.256. §34 stops the *response* inventing success; this checks the
 * *result* it is built from.
 *
 * The property asserted is deliberately narrow and generic, because anything
 * command-specific would need 696 hand-written assertions:
 *
 *   **A mutation that reports success must evidence the entity it touched.**
 *
 * If the plan said `appointmentId: 'apt-9'`, something in the output must say
 * `apt-9`. If it said `status: 'no_show'`, the output must not come back saying
 * `confirmed`. Neither is a deep semantic check; both catch a handler that
 * succeeded against nothing, or against the wrong row.
 *
 * Applied to T2/T3 only. For those tiers, §3.3 requires a post-exec assertion,
 * and "no evidence either way" is treated as a failure rather than a pass —
 * unverified money is not verified money.
 */
import type { CommandRiskTier, CommandSpec } from './ai-command-spec.types.js';
import type { PlanStep } from './ai-command-plan.types.js';

export type AssertionStatus =
  /** The output evidences what the step asked for. */
  | 'verified'
  /** The output contradicts it — a wrong write, reported as success. */
  | 'contradicted'
  /** No evidence either way. Acceptable below T2; a failure at T2/T3. */
  | 'unverified';

export interface AssertionResult {
  status: AssertionStatus;
  /** Why, in terms a trace or an incident review can use. */
  reasons: string[];
  /** True when this outcome must be treated as a failed step. */
  shouldFail: boolean;
}

/** Tiers where "unverified" is not good enough. */
export const ASSERTED_TIERS: ReadonlySet<CommandRiskTier> = new Set([
  'T2',
  'T3',
]);

/** Variable names that identify a row rather than describe a change. */
const IDENTIFIER_HINT = /(^|[a-z])(id|ids)$/i;

function flattenValues(value: unknown, out: string[] = []): string[] {
  if (value === null || value === undefined) return out;
  if (Array.isArray(value)) {
    value.forEach((v) => flattenValues(v, out));
    return out;
  }
  if (typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((v) =>
      flattenValues(v, out),
    );
    return out;
  }
  out.push(String(value));
  return out;
}

/** Every scalar the output mentions, lowercased, for containment checks. */
function outputHaystack(output: Record<string, unknown> | null): Set<string> {
  return new Set(flattenValues(output ?? {}).map((v) => v.toLowerCase()));
}

/**
 * Check one executed step against what it asked for.
 *
 * `output` is whatever the handler returned. A handler that returns nothing
 * gives no evidence — which is `unverified`, and therefore a failure at T2/T3.
 * That is deliberate pressure on handlers to report what they did.
 */
export function assertStepEffect(input: {
  step: Pick<PlanStep, 'command' | 'variables'>;
  spec: Pick<CommandSpec, 'risk'>;
  output: Record<string, unknown> | null;
}): AssertionResult {
  const { step, spec, output } = input;
  const mustVerify = ASSERTED_TIERS.has(spec.risk);
  const haystack = outputHaystack(output);
  const reasons: string[] = [];

  const identifiers: [string, string][] = [];
  const declared: [string, string][] = [];

  for (const [name, raw] of Object.entries(step.variables)) {
    if (raw === null || raw === undefined || raw === '') continue;
    if (typeof raw === 'object') continue; // structured drafts are not checkable this way
    const value = String(raw);
    if (IDENTIFIER_HINT.test(name)) identifiers.push([name, value]);
    else declared.push([name, value]);
  }

  // A declared enum-ish value coming back as something else is a contradiction:
  // we asked for no_show and the row says confirmed.
  for (const [name, value] of declared) {
    const echoed = output?.[name];
    if (
      echoed !== undefined &&
      echoed !== null &&
      typeof echoed !== 'object' &&
      String(echoed).toLowerCase() !== value.toLowerCase()
    ) {
      reasons.push(
        `${name}: asked for "${value}", result reports "${String(echoed)}"`,
      );
    }
  }
  if (reasons.length) {
    return { status: 'contradicted', reasons, shouldFail: true };
  }

  if (identifiers.length === 0) {
    reasons.push('step named no identifier to verify against');
    return {
      status: 'unverified',
      reasons,
      shouldFail: mustVerify,
    };
  }

  const missing = identifiers.filter(
    ([, value]) => !haystack.has(value.toLowerCase()),
  );
  if (missing.length === identifiers.length) {
    reasons.push(
      `result does not mention ${missing.map(([n, v]) => `${n}=${v}`).join(', ')}`,
    );
    return { status: 'unverified', reasons, shouldFail: mustVerify };
  }

  return {
    status: 'verified',
    reasons: [],
    shouldFail: false,
  };
}

export interface PlanAssertionSummary {
  /** True when every asserted step is verified. */
  allVerified: boolean;
  /** Steps that must be treated as failed despite reporting success. */
  failedStepIds: string[];
  perStep: { stepId: string; result: AssertionResult }[];
}

/**
 * Assert a whole executed plan.
 *
 * Only steps that reported success are checked: a step that already failed does
 * not need a second opinion, and asserting against its empty output would
 * produce a misleading second failure for the same event.
 */
export function assertPlanEffects(
  steps: readonly {
    stepId: string;
    command: string;
    status: string;
    output: Record<string, unknown> | null;
    variables: Record<string, unknown>;
  }[],
  specFor: (command: string) => Pick<CommandSpec, 'risk'> | undefined,
): PlanAssertionSummary {
  const perStep: { stepId: string; result: AssertionResult }[] = [];

  for (const step of steps) {
    if (step.status !== 'executed') continue;
    const spec = specFor(step.command);
    if (!spec) {
      // An executed step whose spec is unknown cannot be asserted, and at this
      // point it has already written. Recording it as unverified is the honest
      // outcome; it is not escalated to a failure because the write happened.
      perStep.push({
        stepId: step.stepId,
        result: {
          status: 'unverified',
          reasons: [`no spec for ${step.command}`],
          shouldFail: false,
        },
      });
      continue;
    }
    perStep.push({
      stepId: step.stepId,
      result: assertStepEffect({
        step: { command: step.command, variables: step.variables },
        spec,
        output: step.output,
      }),
    });
  }

  return {
    allVerified: perStep.every((p) => p.result.status === 'verified'),
    failedStepIds: perStep
      .filter((p) => p.result.shouldFail)
      .map((p) => p.stepId),
    perStep,
  };
}
