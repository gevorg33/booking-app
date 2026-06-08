import type { FieldLevelConfidence } from './ai-classification-engine.types.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import type { ValidationIssue } from './command-completion.types.js';
import type { ResolvedCommand } from './command-completion.types.js';
import type { EntityMemory } from './ai-settings.types.js';
import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';
import {
  applyConfidenceGatedAutofill,
  canProceedWithoutClarifyAfterAutofill,
  type ConfidenceGatedAutofillInput,
} from './ai-n99-autofill.util.js';
import {
  NO_CLARIFY_EVAL_FLOOR,
  NO_CLARIFY_NEAR_99_LOCALE_SPREAD_MAX,
  NO_CLARIFY_NEAR_99_MIN_SAMPLE,
  NO_CLARIFY_NEAR_99_PRIMARY_LOCALES,
  NO_CLARIFY_NEAR_99_TARGET,
  NO_CLARIFY_WRONG_EXEC_CEILING,
} from './ai-n99-no-clarify-completion.fixtures.js';
import {
  applyScreenContextGrounding,
  readScreenContext,
  resolveRequestScreenContext,
  trimNeedlessClarifyIssuesFromScreen,
  type ScreenGroundingContext,
} from './ai-n99-screen-grounding.util.js';
import {
  applyPhrasingMemoryGrounding,
  buildPhrasingMemorySessionPromotion,
  trimNeedlessClarifyIssuesFromPhrasing,
} from './ai-n99-phrasing-memory.util.js';
import { trimOverAskClarifyIssues } from './ai-n99-over-ask.util.js';
import { resolveAutofillWatchdogThreshold } from './ai-n99-wrong-execution-watchdog.util.js';
import { shouldBlockNoClarifyExecution } from './ai-n99-ambiguous-destructive-clarify.util.js';

export {
  applyConfidenceGatedAutofill,
  canProceedWithoutClarifyAfterAutofill,
  resolveAutofillFieldThreshold,
  resolveAutofillRiskTier,
  shouldApplyAutofillCandidate,
  buildAutofillSessionPromotion,
  N99_AUTOFILL_SCENARIOS,
  N99_AUTOFILL_PROCEED_SCENARIOS,
} from './ai-n99-autofill.util.js';
export {
  applyPhrasingMemoryGrounding,
  buildPhrasingMemorySessionPromotion,
  resolveActionFromPhrasingMemory,
  resolveEntityMemoryForNoClarify,
  trimNeedlessClarifyIssuesFromPhrasing,
} from './ai-n99-phrasing-memory.util.js';
export { N99_PHRASING_MEMORY_SCENARIOS } from './ai-n99-phrasing-memory.fixtures.js';
export {
  applyScreenContextGrounding,
  readScreenContext,
  resolveRequestScreenContext,
  trimNeedlessClarifyIssuesFromScreen,
  type ScreenGroundingContext,
} from './ai-n99-screen-grounding.util.js';
export { N99_SCREEN_GROUNDING_SCENARIOS } from './ai-n99-screen-grounding.fixtures.js';
export {
  NO_CLARIFY_EVAL_FLOOR,
  NO_CLARIFY_NEAR_99_LOCALE_SPREAD_MAX,
  NO_CLARIFY_NEAR_99_MIN_SAMPLE,
  NO_CLARIFY_NEAR_99_PRIMARY_LOCALES,
  NO_CLARIFY_NEAR_99_TARGET,
  NO_CLARIFY_WRONG_EXEC_CEILING,
  N99_NO_CLARIFY_AUTOFILL_SCENARIOS,
  N99_NO_CLARIFY_GATE_SCENARIOS,
  N99_NO_CLARIFY_GUARDRAIL_SCENARIOS,
  N99_NO_CLARIFY_WATCHDOG_SCENARIOS,
} from './ai-n99-no-clarify-completion.fixtures.js';
export {
  applyOverAskSafeDefaults,
  hasOverAskSafeDate,
  trimOverAskClarifyIssues,
} from './ai-n99-over-ask.util.js';
export { N99_NO_CLARIFY_OVER_ASK_SCENARIOS } from './ai-n99-over-ask.fixtures.js';
export {
  attachAutofillExecutionMetadata,
  computeAutoFillFieldThresholdAdjustment,
  computeAutoFillWatchdogFromRows,
  finalizeAutofillWatchdogResult,
  mergeAutofillWatchdogIntoSession,
  resolveAutofillWatchdogThreshold,
  N99_AUTOFILL_PREVIEW_SCENARIOS,
  N99_AUTOFILL_WATCHDOG_SCENARIOS,
  N99_AUTOFILL_WATCHDOG_TRACE_SCENARIOS,
} from './ai-n99-wrong-execution-watchdog.util.js';
export {
  buildNoClarifyGuardrailClarifyResult,
  isNoClarifyGuardrailBlockReason,
  resolveNoClarifyGuardrailClarify,
  shouldBlockNoClarifyAutofill,
  shouldBlockNoClarifyExecution,
  NO_CLARIFY_GUARDRAIL_CLARIFY_SOURCE,
  N99_AMBIGUOUS_DESTRUCTIVE_SCENARIOS,
} from './ai-n99-ambiguous-destructive-clarify.util.js';

export type NoClarifyScreenContext = ScreenGroundingContext;

export interface NoClarifyEnrichmentInput {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  surface: ClassificationSurface;
  sessionContext?: Record<string, unknown>;
  screenContext?: NoClarifyScreenContext | Record<string, unknown>;
  entityMemory?: EntityMemory;
  businessDefaults?: ConfidenceGatedAutofillInput['businessDefaults'];
  catalogServices?: ConfidenceGatedAutofillInput['catalogServices'];
  actionConfidence?: number;
  fieldConfidence?: FieldLevelConfidence;
  fieldThreshold?: number;
  resolved?: ResolvedCommand;
}

export interface NoClarifyEnrichmentResult {
  params: Record<string, unknown>;
  action?: string;
  actionSource?: 'phrasing_alias' | 'business_paraphrase';
  autofillFields: string[];
  phrasingFields: string[];
  blocked: boolean;
  blockReason?: string;
  requiresClarify?: boolean;
  fieldThreshold: number;
  canProceed?: boolean;
}

export interface NoClarifyNear99ExitGateInput {
  noClarifyRate: number;
  wrongExecutionRate: number;
  sampleSize: number;
  localeSpread: number;
  insufficientLocales?: string[];
}

export interface NoClarifyNear99ExitGateCriterion {
  id: 'no_clarify' | 'wrong_execution' | 'locale_parity' | 'sample_size';
  label: string;
  value: number;
  target: number;
  comparator: 'gte' | 'lte';
  met: boolean;
  unit: 'percent' | 'points' | 'count';
  detail?: string;
}

export interface NoClarifyNear99ExitGateResult extends NoClarifyNear99ExitGateInput {
  periodDays: number;
  target: number;
  met: boolean;
  failures: string[];
  criteria: NoClarifyNear99ExitGateCriterion[];
}

/** n99-2.1 — confidence-gated auto-fill for strongly inferable missing params. */
export function applyHighConfidenceAutofill(input: {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  surface?: ClassificationSurface;
  sessionContext?: Record<string, unknown>;
  screenContext?: Record<string, unknown>;
  entityMemory?: EntityMemory;
  businessDefaults?: ConfidenceGatedAutofillInput['businessDefaults'];
  catalogServices?: ConfidenceGatedAutofillInput['catalogServices'];
  actionConfidence?: number;
  fieldConfidence?: FieldLevelConfidence;
  fieldThreshold?: number;
}): {
  params: Record<string, unknown>;
  filledFields: string[];
  fieldThreshold: number;
  blocked?: boolean;
  blockReason?: string;
} {
  const result = applyConfidenceGatedAutofill(input);
  return {
    params: result.params,
    filledFields: result.filledFields,
    fieldThreshold: result.fieldThreshold,
    blocked: result.blocked,
    blockReason: result.blockReason,
  };
}

/** n99-2.6 — trim validation issues inferable from safe defaults + screen/session context. */
export function trimNeedlessClarifyIssues(input: {
  action: string;
  params: Record<string, unknown>;
  issues: ValidationIssue[];
  screenContext?: NoClarifyScreenContext | Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  entityMemory?: EntityMemory;
  surface?: ClassificationSurface;
  prompt?: string;
}): ValidationIssue[] {
  const afterScreen = trimNeedlessClarifyIssuesFromScreen(input).map((issue) => ({
    ...issue,
    label: issue.field,
  }));
  const afterOverAsk = trimOverAskClarifyIssues({
    action: input.action,
    params: input.params,
    issues: afterScreen,
    prompt: input.prompt,
    screenContext: input.screenContext as Record<string, unknown> | undefined,
    sessionContext: input.sessionContext,
  });
  if (!input.prompt || !input.surface || !input.entityMemory) return afterOverAsk;
  return trimNeedlessClarifyIssuesFromPhrasing({
    prompt: input.prompt,
    action: input.action,
    params: input.params,
    issues: afterOverAsk,
    entityMemory: input.entityMemory,
    surface: input.surface,
  }).map((issue) => ({
    ...issue,
    label: issue.field,
  }));
}

/** Unified n99-2 enrichment — phrasing memory + screen grounding + confidence-gated autofill. */
export function enrichParamsForNoClarifyCompletion(
  input: NoClarifyEnrichmentInput,
): NoClarifyEnrichmentResult {
  const phrasing = applyPhrasingMemoryGrounding({
    prompt: input.prompt,
    action: input.action,
    params: input.params,
    surface: input.surface,
    entityMemory: input.entityMemory,
    actionConfidence: input.actionConfidence,
  });
  const resolvedAction = phrasing.action;
  const effectiveActionConfidence =
    phrasing.actionSource && resolvedAction !== input.action
      ? Math.max(input.actionConfidence ?? 0, 0.78)
      : input.actionConfidence;

  const screen = applyScreenContextGrounding({
    prompt: input.prompt,
    action: resolvedAction,
    params: phrasing.params,
    screenContext: input.screenContext ?? input.sessionContext,
  });

  const guard = shouldBlockNoClarifyExecution({
    action: resolvedAction,
    actionConfidence: effectiveActionConfidence,
    params: screen.params,
    sessionContext: input.sessionContext,
    surface: input.surface,
  });
  if (guard.blocked) {
    return {
      params: input.params,
      action: resolvedAction !== input.action ? resolvedAction : undefined,
      actionSource: phrasing.actionSource,
      autofillFields: [],
      phrasingFields: phrasing.filledFields,
      blocked: true,
      blockReason: guard.reason,
      requiresClarify: true,
      fieldThreshold: input.fieldThreshold ?? 0.72,
    };
  }

  const watchdog = resolveAutofillWatchdogThreshold({
    sessionContext: input.sessionContext,
    baseThreshold: input.fieldThreshold,
  });
  const autofill = applyConfidenceGatedAutofill({
    prompt: input.prompt,
    action: resolvedAction,
    params: screen.params,
    surface: input.surface,
    sessionContext: input.sessionContext,
    screenContext: (input.screenContext ?? input.sessionContext) as
      | Record<string, unknown>
      | undefined,
    entityMemory: input.entityMemory,
    businessDefaults: input.businessDefaults,
    catalogServices: input.catalogServices,
    actionConfidence: effectiveActionConfidence,
    fieldConfidence: input.fieldConfidence,
    fieldThreshold: watchdog.fieldThreshold,
  });

  if (autofill.blocked) {
    return {
      params: input.params,
      action: resolvedAction !== input.action ? resolvedAction : undefined,
      actionSource: phrasing.actionSource,
      autofillFields: [],
      phrasingFields: phrasing.filledFields,
      blocked: true,
      blockReason: autofill.blockReason,
      fieldThreshold: autofill.fieldThreshold,
    };
  }

  const enrichmentFields = [
    ...new Set([...phrasing.filledFields, ...screen.filledFields, ...autofill.filledFields]),
  ];
  const params = {
    ...autofill.params,
    ...(enrichmentFields.length > 0 ? { _noClarifyAutofill: enrichmentFields } : {}),
  };

  return {
    params,
    action: resolvedAction !== input.action ? resolvedAction : undefined,
    actionSource: phrasing.actionSource,
    autofillFields: enrichmentFields,
    phrasingFields: phrasing.filledFields,
    blocked: false,
    fieldThreshold: autofill.fieldThreshold,
    canProceed: canProceedWithoutClarifyAfterAutofill({
      prompt: input.prompt,
      action: resolvedAction,
      params,
      actionConfidence: effectiveActionConfidence,
      fieldConfidence: input.fieldConfidence,
      fieldThreshold: autofill.fieldThreshold,
      resolved: input.resolved,
    }),
  };
}

/** Apply n99-2 enrichment result onto a classified intent (params + phrasing action rescue). */
export function applyNoClarifyEnrichmentToParsed<
  T extends {
    action: string;
    params: Record<string, unknown>;
    reasoning?: string;
    confidence?: number;
  },
>(parsed: T, enriched: NoClarifyEnrichmentResult): T {
  parsed.params = enriched.params;
  if (!enriched.action) return parsed;

  parsed.action = enriched.action;
  if (enriched.actionSource === 'phrasing_alias') {
    parsed.reasoning = `Business phrasing memory (${String(enriched.params._phrasingMemoryAlias ?? 'alias')})`;
    parsed.confidence = Math.max(parsed.confidence ?? 0, 0.78);
  } else if (enriched.actionSource === 'business_paraphrase') {
    parsed.reasoning = 'Business phrasing memory (learned phrase)';
    parsed.confidence = Math.max(parsed.confidence ?? 0, 0.82);
  }
  return parsed;
}

export function buildNoClarifyNear99ExitGate(
  input: NoClarifyNear99ExitGateInput,
  periodDays: number,
): NoClarifyNear99ExitGateResult {
  const failures: string[] = [];
  const criteria: NoClarifyNear99ExitGateCriterion[] = [
    {
      id: 'no_clarify',
      label: 'No-clarify completion',
      value: input.noClarifyRate,
      target: NO_CLARIFY_NEAR_99_TARGET,
      comparator: 'gte',
      met: input.noClarifyRate + 1e-9 >= NO_CLARIFY_NEAR_99_TARGET,
      unit: 'percent',
    },
    {
      id: 'wrong_execution',
      label: 'Wrong execution',
      value: input.wrongExecutionRate,
      target: NO_CLARIFY_WRONG_EXEC_CEILING,
      comparator: 'lte',
      met: input.wrongExecutionRate <= NO_CLARIFY_WRONG_EXEC_CEILING + 1e-9,
      unit: 'percent',
    },
    {
      id: 'locale_parity',
      label: 'Locale spread',
      value: input.localeSpread,
      target: NO_CLARIFY_NEAR_99_LOCALE_SPREAD_MAX,
      comparator: 'lte',
      met: input.localeSpread <= NO_CLARIFY_NEAR_99_LOCALE_SPREAD_MAX + 1e-9,
      unit: 'points',
      detail:
        input.insufficientLocales && input.insufficientLocales.length > 0
          ? `Low sample: ${input.insufficientLocales.join(', ')}`
          : undefined,
    },
    {
      id: 'sample_size',
      label: 'Sample size',
      value: input.sampleSize,
      target: NO_CLARIFY_NEAR_99_MIN_SAMPLE,
      comparator: 'gte',
      met: input.sampleSize >= NO_CLARIFY_NEAR_99_MIN_SAMPLE,
      unit: 'count',
    },
  ];

  for (const criterion of criteria) {
    if (!criterion.met) {
      failures.push(`${criterion.label} not met`);
    }
  }

  return {
    ...input,
    periodDays,
    target: NO_CLARIFY_NEAR_99_TARGET,
    met: failures.length === 0,
    failures,
    criteria,
  };
}

export function buildNoClarifyNear99ExitGateFromRows(
  rows: AiTraceAnalyticsRow[],
  periodDays: number,
): NoClarifyNear99ExitGateResult {
  const total = rows.length;
  const executed = rows.filter((row) => row.outcome === 'executed').length;
  const wrongExecution = rows.filter(
    (row) => row.failureSignal === 'wrong_execution' || row.feedbackRating === 'down',
  ).length;

  const localeBuckets = new Map<string, { total: number; executed: number }>();
  for (const row of rows) {
    const bucket = localeBuckets.get(row.locale) ?? { total: 0, executed: 0 };
    bucket.total += 1;
    if (row.outcome === 'executed') bucket.executed += 1;
    localeBuckets.set(row.locale, bucket);
  }

  const localeRates = NO_CLARIFY_NEAR_99_PRIMARY_LOCALES.map((locale) => {
    const bucket = localeBuckets.get(locale) ?? { total: 0, executed: 0 };
    return bucket.total ? bucket.executed / bucket.total : 0;
  });
  const localeSpread =
    localeRates.length > 1
      ? Math.max(...localeRates) - Math.min(...localeRates)
      : 0;
  const insufficientLocales = NO_CLARIFY_NEAR_99_PRIMARY_LOCALES.filter((locale) => {
    const bucket = localeBuckets.get(locale);
    return !bucket || bucket.total < 5;
  });

  return buildNoClarifyNear99ExitGate(
    {
      noClarifyRate: total ? executed / total : 0,
      wrongExecutionRate: total ? wrongExecution / total : 0,
      sampleSize: total,
      localeSpread,
      insufficientLocales,
    },
    periodDays,
  );
}

export function assertNoClarifyEvalFloor(
  passed: number,
  total: number,
  floor = NO_CLARIFY_EVAL_FLOOR,
): void {
  const rate = total ? passed / total : 0;
  if (rate + 1e-9 >= floor) return;
  throw new Error(
    `n99-2.9 — no-clarify eval floor ${(rate * 100).toFixed(2)}% below ${(floor * 100).toFixed(1)}%`,
  );
}
