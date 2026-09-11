/**
 * AI-ROADMAP Phase 3 — defensive decoding of the planner's response.
 *
 * Models return malformed output regularly: markdown fences around the JSON,
 * a sentence of preamble, a bare array instead of the object, numbers as
 * strings, a missing `dependsOn`. Production already shows what happens when
 * that is not handled — an `error` action recorded 59 times at a 100% failure
 * rate.
 *
 * This decoder therefore:
 *   - NEVER throws;
 *   - repairs shape problems it can repair unambiguously (fence stripping,
 *     numeric coercion, defaulting `dependsOn` to `[]`);
 *   - REFUSES to invent meaning it does not have (a step with no `command`
 *     is dropped and reported, never guessed);
 *   - returns a typed failure rather than a half-built plan.
 *
 * Repair is deliberately limited to syntax. Anything semantic — is this command
 * real, is it legal here, are the variables right — belongs to
 * `validatePlan`, which runs next and is the actual safety gate.
 */
import type { CommandPlan, PlanStep } from './ai-command-plan.types.js';

export type PlanDecodeFailure =
  | 'empty_response'
  | 'not_json'
  /**
   * Defensive only: `extractJsonBody` returns a slice starting at `{` or `[`,
   * so a successful parse is always an object or array today. Kept so a future
   * change to extraction cannot silently produce a malformed plan.
   */
  | 'not_an_object'
  | 'no_steps';

export type PlanDecodeResult =
  | { ok: true; plan: CommandPlan; repairs: string[] }
  | { ok: false; failure: PlanDecodeFailure; repairs: string[]; raw: string };

/** Strip ```json fences and any prose either side of the JSON body. */
export function extractJsonBody(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  const candidate = (fenced?.[1] ?? trimmed).trim();

  // Take the outermost {...} (or [...]) so a leading "Sure, here you go:" or a
  // trailing explanation cannot break parsing.
  const firstObj = candidate.indexOf('{');
  const firstArr = candidate.indexOf('[');
  const start =
    firstObj === -1
      ? firstArr
      : firstArr === -1
        ? firstObj
        : Math.min(firstObj, firstArr);
  if (start === -1) return null;

  const opener = candidate[start];
  const closer = opener === '{' ? '}' : ']';
  const end = candidate.lastIndexOf(closer);
  if (end <= start) return null;

  return candidate.slice(start, end + 1);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function coerceConfidence(
  value: unknown,
  repairs: string[],
  stepId: string,
): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value >= 0 && value <= 1) return value;
    // Some models emit 0–100.
    if (value > 1 && value <= 100) {
      repairs.push(`${stepId}: confidence ${value} scaled to ${value / 100}`);
      return value / 100;
    }
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed))
      return coerceConfidence(parsed, repairs, stepId);
  }
  // Unknown confidence is treated as low, not high — an unreadable confidence
  // must not let a mutating step through the gate.
  repairs.push(`${stepId}: missing/unreadable confidence, defaulted to 0`);
  return 0;
}

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((x): x is string => typeof x === 'string');
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

function decodeStep(
  raw: unknown,
  index: number,
  repairs: string[],
): PlanStep | null {
  const record = asRecord(raw);
  if (!record) {
    repairs.push(`step ${index}: not an object, dropped`);
    return null;
  }

  const label = (key: 'stepId' | 'id'): string =>
    typeof record[key] === 'string' ? (record[key] as string).trim() : '';

  let command = typeof record.command === 'string' ? record.command.trim() : '';
  let labelSource = label('stepId') || label('id');

  // e2e-bug.388 — recover the shape slip where the command id lands in the
  // label field and `command` is omitted.
  //
  // This is a syntactic recovery, not a semantic one, and the distinction is
  // what makes it safe here: command ids are `domain.verb` and step labels are
  // `s1`/`s2`, so a label containing a dot cannot be a step label. The decoder
  // has no command list to check against — `validatePlan` owns that, and an id
  // recovered here that names nothing real still fails there as
  // `unknown_command`. Nothing is invented; a value is read out of the field it
  // was misfiled into.
  if (!command && labelSource.includes('.')) {
    command = labelSource;
    labelSource = '';
    repairs.push(`step ${index}: command found in label field, recovered`);
  }

  if (!command) {
    // No command means no meaning to recover. Dropping is the only honest move
    // — but it must not be a silent one. A dropped step used to leave an empty
    // plan with an empty `unresolved`, which reads downstream as "the planner
    // declined" rather than "the response was malformed" (e2e-bug.387).
    repairs.push(`step ${index}: no command, dropped`);
    return null;
  }

  const id = labelSource || `s${index + 1}`;
  if (id !== record.id && id !== record.stepId) {
    repairs.push(`step ${index}: missing id, assigned "${id}"`);
  }

  const variables = asRecord(record.variables) ?? {};
  if (record.variables !== undefined && !asRecord(record.variables)) {
    repairs.push(`${id}: variables was not an object, treated as empty`);
  }

  return {
    id,
    command,
    variables,
    confidence: coerceConfidence(record.confidence, repairs, id),
    dependsOn: coerceStringArray(record.dependsOn),
  };
}

export function decodePlanResponse(
  raw: string | null | undefined,
): PlanDecodeResult {
  const repairs: string[] = [];
  const text = raw ?? '';
  if (!text.trim()) {
    return { ok: false, failure: 'empty_response', repairs, raw: text };
  }

  const body = extractJsonBody(text);
  if (!body) return { ok: false, failure: 'not_json', repairs, raw: text };
  if (body !== text.trim()) repairs.push('stripped non-JSON wrapper');

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return { ok: false, failure: 'not_json', repairs, raw: text };
  }

  // A bare array is a common shape slip — treat it as the steps list.
  let planRecord = asRecord(parsed);
  if (!planRecord && Array.isArray(parsed)) {
    repairs.push('response was a bare array, treated as steps');
    planRecord = { steps: parsed };
  }
  if (!planRecord) {
    return { ok: false, failure: 'not_an_object', repairs, raw: text };
  }

  const rawSteps = Array.isArray(planRecord.steps) ? planRecord.steps : null;
  if (!rawSteps) {
    return { ok: false, failure: 'no_steps', repairs, raw: text };
  }

  const steps = rawSteps
    .map((s, i) => decodeStep(s, i, repairs))
    .filter((s): s is PlanStep => s !== null);

  // e2e-bug.387 — a plan emptied by dropped steps must not look like a refusal.
  //
  // The model proposed something and the decoder could not read it. That is a
  // different event from the model declining to map the message, and until now
  // both arrived downstream as `steps: [], unresolved: []` — indistinguishable,
  // and counted as the planner giving up. 49 of 150 replayed prompts looked
  // like refusals for this reason alone.
  const dropped = rawSteps.length - steps.length;
  const unresolved = coerceStringArray(planRecord.unresolved);
  if (steps.length === 0 && dropped > 0 && unresolved.length === 0) {
    unresolved.push(
      `${dropped} step(s) could not be read from the model response`,
    );
  }

  // De-duplicate ids so the dependency graph stays well formed.
  const seen = new Set<string>();
  for (const step of steps) {
    if (!seen.has(step.id)) {
      seen.add(step.id);
      continue;
    }
    let n = 2;
    let candidate = `${step.id}_${n}`;
    while (seen.has(candidate)) candidate = `${step.id}_${++n}`;
    repairs.push(`duplicate step id "${step.id}" renamed to "${candidate}"`);
    step.id = candidate;
    seen.add(candidate);
  }

  return {
    ok: true,
    repairs,
    plan: {
      steps,
      unresolved,
      topicChanged: planRecord.topicChanged === true,
    },
  };
}
