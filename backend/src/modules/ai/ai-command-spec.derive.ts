/**
 * AI-ROADMAP §3.1 — everything derived from a CommandSpec.
 *
 * This is where the single-source-of-truth claim is cashed in. Each function
 * below replaces something that is currently hand-maintained in a separate file
 * and can therefore silently disagree with the others:
 *
 *   buildPlannerShortlist   ← classifier schema text, per surface
 *   buildToolDefinition     ← tool/function-calling JSON Schema
 *   validateCommandVariables← per-handler ad-hoc required-param checks
 *   isSpecAllowedOnSurface  ← surface gating (the e2e-bug.349 class)
 *   resolveSpecByAction     ← alias handling (currently a dispatch-map key + comment)
 */
import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  requiredVariableNames,
  type CommandSpec,
  type CommandVariableResolver,
  type CommandVariableSpec,
} from './ai-command-spec.types.js';

/** Look up a spec by canonical id OR any declared alias. */
export function resolveSpecByAction(
  specs: readonly CommandSpec[],
  action: string,
): CommandSpec | undefined {
  return specs.find((s) => s.id === action || s.aliases.includes(action));
}

/**
 * Surface gating. A command not declared for a surface is not a candidate on
 * that surface — enforced BEFORE the planner sees the shortlist, so a customer
 * cart command can never win a dashboard request (e2e-bug.349 was exactly that,
 * and production traces show `assign_employee_services -> add_services_to_cart`
 * happening for real).
 */
export function isSpecAllowedOnSurface(
  spec: CommandSpec,
  surface: CommandSurface,
): boolean {
  return spec.surfaces.includes(surface);
}

export function specsForSurface(
  specs: readonly CommandSpec[],
  surface: CommandSurface,
): CommandSpec[] {
  return specs.filter((s) => isSpecAllowedOnSurface(s, surface));
}

/**
 * Permission gating — the other half of §4 guardrail 1.
 *
 * Surface gating alone is not enough: on the dashboard a `staff` member and an
 * `owner` see the same surface but must not see the same commands. Until this
 * existed, the planner's shortlist offered every command the *surface* allowed
 * to every actor on it, and the only thing standing between a `staff` member
 * and `update_bookings` was a check in the legacy executor the planner does not
 * run through.
 *
 * Absent tier data denies rather than allows. A spec that forgot to declare
 * permissions must not thereby become universally available — the same failure
 * mode as `undefined?.includes(...)` returning false in e2e-bug.342, but in the
 * dangerous direction.
 */
export function isSpecAllowedForTier(
  spec: CommandSpec,
  surface: CommandSurface,
  tier: AccessTier,
): boolean {
  if (!isSpecAllowedOnSurface(spec, surface)) return false;
  return (spec.tiers[surface] ?? []).includes(tier);
}

export function specsForActor(
  specs: readonly CommandSpec[],
  surface: CommandSurface,
  tier: AccessTier,
): CommandSpec[] {
  return specs.filter((s) => isSpecAllowedForTier(s, surface, tier));
}

/**
 * One variable as the planner needs to see it.
 *
 * e2e-bug.397 — the shortlist used to render variables as bare names, so the
 * model was asked for `catalogDraft` with nothing saying it is an object,
 * `serviceNames` with nothing saying it is an array, and `price` with nothing
 * saying it is a number. It answered with the only thing it could: a
 * natural-language restatement of the request. That single omission accounts for
 * 25 of 28 variable rejections on rescue-dependent traffic.
 */
export type PlannerVariableHint = {
  name: string;
  /** Rendered type, including array and object shape. */
  type: string;
  enum?: readonly string[];
  /**
   * The resolver that will turn a human reference into an id — e2e-bug.399.
   *
   * Omitted for `none`. Present means the planner must NOT try to produce the
   * final value: it should pass on what the user said and let Phase 4 resolve
   * it.
   */
  resolver?: CommandVariableResolver;
};

export type PlannerShortlistEntry = {
  command: string;
  description: string;
  requiredVariables: string[];
  optionalVariables: string[];
  /** Typed view of the same variables, keyed by name. */
  variableHints: PlannerVariableHint[];
  examples: readonly string[];
};

/**
 * Render a variable's type compactly enough to sit in a shortlist line.
 *
 * **Recursive, and it has to be.** Rendering one level deep fixed every type
 * mismatch and immediately exposed the next layer: told `catalogDraft` was
 * `object{ categoryName: string, services: object[] }`, the model produced
 * exactly that — and left every field inside `services[]` empty, because nothing
 * said what a service item contains. Validation went from 28 type errors to 72
 * missing nested fields.
 *
 * Depth is capped at 3. Past that a shortlist line stops being readable, and a
 * variable still renders as its bare type rather than being silently flattened,
 * so an untruncated shape is visible as `object` rather than misdescribed as
 * complete.
 */
function renderVariableType(v: CommandVariableSpec, depth = 0): string {
  const suffix = (c: CommandVariableSpec) => (c.required ? '' : '?');
  const renderProps = (
    props: Readonly<Record<string, CommandVariableSpec>>,
  ): string =>
    Object.entries(props)
      .map(([n, c]) => `${n}${suffix(c)}: ${renderVariableType(c, depth + 1)}`)
      .join(', ');

  if (depth >= 3) return v.type;
  if (v.type === 'object' && v.properties) {
    return `{ ${renderProps(v.properties)} }`;
  }
  if (v.type === 'object[]' && v.properties) {
    return `array of { ${renderProps(v.properties)} }`;
  }
  if (v.type === 'string[]') return 'array of string';
  // No `number[]` branch: `CommandVariableSpec['type']` has no such member, so
  // it was dead code that tsc rightly flagged once the union was consulted.
  return v.type;
}

export function plannerVariableHints(spec: CommandSpec): PlannerVariableHint[] {
  return Object.entries(spec.variables).map(([name, v]) => ({
    name,
    type: renderVariableType(v),
    ...(v.enum ? { enum: v.enum } : {}),
    ...(v.resolver && v.resolver !== 'none' ? { resolver: v.resolver } : {}),
  }));
}

/**
 * What the planner is shown for one actor. Replaces the hand-written classifier
 * rule strings, which today drift from the registry (and from each other across
 * the four surface schemas).
 *
 * `tier` narrows the list further. A command the actor may not run is not a
 * candidate the model can pick — which is stronger than rejecting it afterwards,
 * because the model never gets the chance to prefer it over the command the user
 * actually asked for.
 */
export function buildPlannerShortlist(
  specs: readonly CommandSpec[],
  surface: CommandSurface,
  tier: AccessTier,
): PlannerShortlistEntry[] {
  return specsForActor(specs, surface, tier).map((spec) => ({
    command: spec.id,
    description: spec.description,
    requiredVariables: requiredVariableNames(spec),
    optionalVariables: Object.entries(spec.variables)
      .filter(([, v]) => !v.required)
      .map(([name]) => name),
    variableHints: plannerVariableHints(spec),
    examples: spec.examples,
  }));
}

function objectSchema(
  properties: Readonly<Record<string, CommandVariableSpec>>,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const required: string[] = [];
  for (const [name, child] of Object.entries(properties)) {
    props[name] = { ...jsonSchemaType(child), description: child.description };
    if (child.required) required.push(name);
  }
  return {
    type: 'object',
    properties: props,
    required,
    additionalProperties: false,
  };
}

function jsonSchemaType(v: CommandVariableSpec): Record<string, unknown> {
  if (v.type === 'string[]') {
    return { type: 'array', items: { type: 'string' } };
  }
  if (v.type === 'object') {
    return objectSchema(v.properties ?? {});
  }
  if (v.type === 'object[]') {
    return { type: 'array', items: objectSchema(v.properties ?? {}) };
  }
  return v.enum ? { type: v.type, enum: [...v.enum] } : { type: v.type };
}

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
};

/** OpenAI-style function/tool definition, generated rather than hand-written. */
export function buildToolDefinition(spec: CommandSpec): ToolDefinition {
  const properties: Record<string, unknown> = {};
  for (const [name, v] of Object.entries(spec.variables)) {
    properties[name] = { ...jsonSchemaType(v), description: v.description };
  }
  return {
    name: spec.id.replace('.', '_'),
    description: spec.description,
    parameters: {
      type: 'object',
      properties,
      required: requiredVariableNames(spec),
      additionalProperties: false,
    },
  };
}

export type VariableValidationResult = {
  valid: boolean;
  /** Required variables the planner did not supply — drives the clarify question. */
  missing: string[];
  /** Supplied variables that are not in the spec — a hallucinated param. */
  unknown: string[];
  /** Supplied variables whose value has the wrong shape. */
  invalid: string[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function typeMatches(v: CommandVariableSpec, value: unknown): boolean {
  switch (v.type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'string[]':
      return Array.isArray(value) && value.every((x) => typeof x === 'string');
    case 'object':
      return isPlainObject(value);
    case 'object[]':
      return Array.isArray(value) && value.every(isPlainObject);
  }
}

/**
 * Validate a planner-produced variable bag against the spec.
 *
 * `unknown` is reported rather than ignored: e2e-bug.156 found the model
 * inventing a `customerName: "Test User"` on a service-price update, which then
 * appeared in the confirmation UI. A hallucinated param must be visible, not
 * silently dropped.
 */
/**
 * Walk one level of a variable bag against its schema, accumulating dotted
 * paths. Recursing (rather than only checking the container) is what lets the
 * clarify question say "I need catalogDraft.categoryName" instead of the
 * useless "I need catalogDraft".
 */
function collectVariableIssues(
  schema: Readonly<Record<string, CommandVariableSpec>>,
  params: Record<string, unknown>,
  prefix: string,
  acc: { missing: string[]; unknown: string[]; invalid: string[] },
): void {
  for (const [name, v] of Object.entries(schema)) {
    const path = prefix ? `${prefix}.${name}` : name;
    const supplied = params[name];
    const absent =
      supplied === undefined ||
      supplied === null ||
      (typeof supplied === 'string' && supplied.trim() === '');

    if (absent) {
      if (v.required) acc.missing.push(path);
      continue;
    }
    if (!typeMatches(v, supplied)) {
      acc.invalid.push(path);
      continue;
    }
    if (v.enum && !v.enum.includes(supplied as string)) {
      acc.invalid.push(path);
      continue;
    }

    if (v.type === 'object' && v.properties) {
      collectVariableIssues(
        v.properties,
        supplied as Record<string, unknown>,
        path,
        acc,
      );
    }
    if (v.type === 'object[]' && v.properties) {
      (supplied as Record<string, unknown>[]).forEach((item, i) => {
        collectVariableIssues(v.properties!, item, `${path}[${i}]`, acc);
      });
    }
  }

  for (const name of Object.keys(params)) {
    if (!(name in schema)) {
      acc.unknown.push(prefix ? `${prefix}.${name}` : name);
    }
  }
}

export function validateCommandVariables(
  spec: CommandSpec,
  params: Record<string, unknown>,
): VariableValidationResult {
  const acc = {
    missing: [] as string[],
    unknown: [] as string[],
    invalid: [] as string[],
  };
  collectVariableIssues(spec.variables, params, '', acc);

  return {
    valid: acc.missing.length === 0 && acc.invalid.length === 0,
    missing: acc.missing,
    unknown: acc.unknown,
    invalid: acc.invalid,
  };
}

/** Does this command need an explicit confirmation before it may execute? */
/**
 * Risk tiers that must always be confirmed, whatever the spec declares.
 *
 * AI-ROADMAP Phase 7: "T2/T3 always preview + confirm". §13's hygiene test
 * enforces that every T2/T3 spec sets `confirm: 'always'`, but that is a lint
 * at author time over the specced commands only — at runtime the tier did
 * nothing, so a T2 mis-declared as `confirm: 'never'` executed money and PII
 * operations with no confirmation at all.
 *
 * Deriving the gate from the tier makes the declaration a convenience rather
 * than the safety boundary: get it wrong and the tier still holds.
 */
const ALWAYS_CONFIRM_TIERS: ReadonlySet<string> = new Set(['T2', 'T3']);

export function requiresConfirmation(
  spec: CommandSpec,
  opts: { ambiguous: boolean },
): boolean {
  // Tier first: it cannot be overridden downward by the declared policy.
  if (ALWAYS_CONFIRM_TIERS.has(spec.risk)) return true;
  if (spec.confirm === 'always') return true;
  if (spec.confirm === 'never') return false;
  return opts.ambiguous;
}
