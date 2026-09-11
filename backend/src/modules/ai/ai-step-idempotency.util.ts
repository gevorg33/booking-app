/**
 * AI-ROADMAP Phase 5 — idempotency keys per step.
 *
 * "Idempotency keys per step so retries cannot double-write." Nothing in the
 * tree does this today: `grep -rn idempoten` returns nothing.
 *
 * Why it matters here specifically. A plan is executed step by step (§33), and
 * a partially-executed plan is a *normal* outcome rather than an exception —
 * the executor is built to report it honestly. So "retry the thing that
 * failed" is the obvious next user action, and without a key it re-runs the
 * steps that already succeeded. The failure mode is double bookings and double
 * charges, which are exactly the T2 operations §35 caps hardest.
 *
 * The key derivation is pure and deterministic; enforcement (a uniqueness
 * constraint or a seen-keys table) belongs with the handler. Getting the
 * derivation right is the part that is easy to get subtly wrong and hard to
 * notice, so it lives here with tests.
 */
import { createHash } from 'node:crypto';

/**
 * Canonical JSON: object keys sorted at every depth.
 *
 * Without this, `{a:1,b:2}` and `{b:2,a:1}` — the same variables, serialised in
 * whatever order the planner happened to emit — produce different keys, and a
 * retry double-writes. Arrays keep their order, because `[a,b]` and `[b,a]` are
 * genuinely different inputs.
 */
export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, canonicalize(v)]),
    );
  }
  // `undefined` is dropped by JSON.stringify inside objects but survives at the
  // top level as the string "undefined"; normalise it so an absent variable and
  // an explicitly-undefined one produce the same key.
  return value === undefined ? null : value;
}

export interface StepIdentity {
  /**
   * Stable id for the *request*, not the retry. Two attempts at the same user
   * message must share it, or the key changes and the guard does nothing —
   * `traceId` from `ai_command_trace` is the natural source.
   */
  requestId: string;
  /** Plan-local step id. Distinguishes two legitimately identical operations. */
  stepId: string;
  command: string;
  /** Variables **after** resolution — the values that will actually be written. */
  variables: Record<string, unknown>;
}

/**
 * Deterministic key for one step of one request.
 *
 * Deliberately excluded: timestamps, attempt counters, and anything else that
 * changes between retries. Including any of them would produce a key that is
 * unique per attempt, which is the same as having no key at all — and it would
 * look like it was working.
 */
export function buildStepIdempotencyKey(identity: StepIdentity): string {
  const payload = JSON.stringify({
    r: identity.requestId,
    s: identity.stepId,
    c: identity.command,
    v: canonicalize(identity.variables),
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

export type RetryDecision =
  /** Not seen before; perform the write and record the key. */
  | 'execute'
  /** Already performed under this key; return the prior result, do not re-run. */
  | 'skip_already_applied';

/**
 * Decide whether a step may run, given the keys already applied.
 *
 * Separated from the key derivation so the store can be anything — a table, a
 * cache, a set held for the duration of one plan.
 */
export function decideRetry(
  key: string,
  appliedKeys: ReadonlySet<string>,
): RetryDecision {
  return appliedKeys.has(key) ? 'skip_already_applied' : 'execute';
}

/**
 * Keys for every step of a plan, in one call.
 *
 * Returns a map rather than an array so a caller cannot accidentally pair a key
 * with the wrong step by index — the kind of mistake that silently makes every
 * key wrong while everything still runs.
 */
export function buildPlanIdempotencyKeys(
  requestId: string,
  steps: readonly {
    id: string;
    command: string;
    variables: Record<string, unknown>;
  }[],
): Map<string, string> {
  return new Map(
    steps.map((step) => [
      step.id,
      buildStepIdempotencyKey({
        requestId,
        stepId: step.id,
        command: step.command,
        variables: step.variables,
      }),
    ]),
  );
}
