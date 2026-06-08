import type {
  CommandResult,
  ResolvedCommand,
  ValidationIssue,
} from './command-completion.types.js';
import type {
  ClassificationSurface,
  FieldLevelConfidence,
} from './ai-classification-engine.types.js';
import {
  deriveFieldLevelConfidence,
  fieldConfidenceToValidationIssues,
  listLowConfidenceFields,
} from './ai-classification-field-confidence.util.js';
import { buildSmartClarifyAnswerReuseSessionContext } from './ai-clarify-answer-reuse.util.js';
import {
  mergeCrossTurnClarifyPrompt,
  mergeCrossTurnClarifyParams,
} from './ai-clarify-cross-turn-merge.util.js';
import {
  buildClarifyFieldContext,
  filterTargetedClarifyIssues,
  fieldSatisfiedForClarify,
} from './ai-targeted-clarify.util.js';
import { buildSemanticConfidenceClarifyIfNeeded } from './ai-semantic-confidence.util.js';
import { buildIntentDisambiguationClarifyResult } from './ai-intent-disambiguation-clarify.util.js';
import {
  buildEntityDisambiguationClarifyResult,
  detectEntityAmbiguity,
  entityDisambiguationSummary,
  type EntityClarifyOption,
  filterMissingFieldsForEntityDisambiguation,
} from './ai-entity-disambiguation-clarify.util.js';
import { validateCommand } from './command-completion.validator.js';
import type { EntityMemory } from './ai-settings.types.js';
import { buildHonestFailureClarifyResult } from './ai-honest-failure-clarify.util.js';
import { buildSuggestedActionFallbackClarifyResult } from './ai-suggested-action-fallback.util.js';
import { buildEscalationHandoffResult } from './ai-escalation-handoff.util.js';
import {
  attachSomethingElseEscapeToClarifyResult,
} from './ai-something-else-clarify.util.js';
import {
  buildHighRiskConfirmClarifyResult,
} from './ai-high-risk-confirm-clarify.util.js';
import { buildResolutionAccuracyClarify } from './ai-resolution-accuracy-guard.util.js';
import {
  attachMultiFieldClarifyMetadata,
  buildMultiFieldClarifySummary,
  dedupeValidationIssuesByField,
  shouldPreferEntityOnlyClarify,
  sortValidationIssuesForClarify,
} from './ai-multi-field-clarify.util.js';
import {
  applyLosslessMergeToResolved,
  isClarifyFollowUpTurn,
  shouldExecuteClarifyImmediately,
} from './ai-lossless-clarify-merge.util.js';
import {
  canProceedWithoutClarifyAfterAutofill,
} from './ai-n99-autofill.util.js';
import { trimNeedlessClarifyIssues } from './ai-n99-no-clarify-completion.util.js';
import { resolveNoClarifyGuardrailClarify } from './ai-n99-ambiguous-destructive-clarify.util.js';

export type SmartClarifyKind =
  | 'targeted_slots'
  | 'intent_disambiguation'
  | 'entity_disambiguation'
  | 'high_risk_confirm'
  | 'honest_failure'
  | 'suggested_action_fallback'
  | 'classification_verify'
  | 'resolution_accuracy';

export type { EntityClarifyField, EntityClarifyOption } from './ai-entity-disambiguation-clarify.util.js';

export interface ClarifyContext {
  originalPrompt: string;
  originalAction: string;
  partialParams: Record<string, unknown>;
  clarifyRound: number;
  clarifyKind: SmartClarifyKind;
}

export type SmartClarifyPhase = 'early' | 'late';

export interface SmartClarifyInput {
  prompt: string;
  surface: ClassificationSurface;
  action: string;
  params: Record<string, unknown>;
  reasoning?: string;
  confidence?: number;
  fieldConfidence?: FieldLevelConfidence;
  sessionContext?: Record<string, unknown>;
  resolved?: ResolvedCommand;
  employees?: Array<{ id: string; name: string }>;
  services?: Array<{ id: string; name: string }>;
  customers?: Array<{ id: string; name: string }>;
  actionThreshold?: number;
  fieldThreshold?: number;
  skipHighRiskConfirm?: boolean;
  phase?: SmartClarifyPhase;
  shortlist?: string[];
  entityMemory?: EntityMemory;
}

export function getClarifyRound(sessionContext?: Record<string, unknown>): number {
  const ctx = sessionContext?._clarifyContext as ClarifyContext | undefined;
  return typeof ctx?.clarifyRound === 'number' ? ctx.clarifyRound : 0;
}

function enrichWithSomethingElseEscape(
  result: CommandResult | null,
  input: SmartClarifyInput,
): CommandResult | null {
  if (!result) return null;
  return attachSomethingElseEscapeToClarifyResult(result, {
    prompt: input.prompt,
    surface: input.surface,
    shortlist: input.shortlist,
  });
}

export function buildClarifyContext(
  input: SmartClarifyInput,
  kind: SmartClarifyKind,
): ClarifyContext {
  return {
    originalPrompt:
      (input.sessionContext?._clarifyContext as ClarifyContext | undefined)
        ?.originalPrompt ?? input.prompt,
    originalAction:
      (input.sessionContext?._clarifyContext as ClarifyContext | undefined)
        ?.originalAction ?? input.action,
    partialParams: {
      ...((input.sessionContext?._clarifyContext as ClarifyContext | undefined)
        ?.partialParams ?? {}),
      ...input.params,
    },
    clarifyRound: getClarifyRound(input.sessionContext) + 1,
    clarifyKind: kind,
  };
}

export function attachSmartClarifyMetadata(
  result: CommandResult,
  kind: SmartClarifyKind,
  input: SmartClarifyInput,
): CommandResult {
  const clarifyContext = buildClarifyContext(input, kind);
  return {
    ...result,
    details: {
      ...result.details,
      needsClarification: true,
      clarify: true,
      clarifyKind: kind,
      clarifySource: result.details.clarifySource ?? kind,
      clarifyRound: clarifyContext.clarifyRound,
      clarifyContext,
      partialParams: clarifyContext.partialParams,
    },
  };
}

/** acc-6.6 — immediate closest-command chips when classifier returns unknown. */
export function buildSuggestedActionFallbackClarify(
  input: SmartClarifyInput,
): CommandResult | null {
  const result = buildSuggestedActionFallbackClarifyResult(
    {
      prompt: input.prompt,
      surface: input.surface,
      action: input.action,
      params: input.params,
      reasoning: input.reasoning,
      confidence: input.confidence,
      fieldConfidence: input.fieldConfidence,
      sessionContext: input.sessionContext,
      actionThreshold: input.actionThreshold,
      shortlist: input.shortlist,
    },
    'early',
  );
  if (!result) return null;
  return attachSmartClarifyMetadata(result, 'suggested_action_fallback', input);
}

/** acc-4.7 — after one clarify round, prefer honest suggestions over guessing. */
export function buildHonestFailureClarify(
  input: SmartClarifyInput,
): CommandResult | null {
  const result = buildHonestFailureClarifyResult({
    prompt: input.prompt,
    surface: input.surface,
    action: input.action,
    params: input.params,
    reasoning: input.reasoning,
    confidence: input.confidence,
    fieldConfidence: input.fieldConfidence,
    sessionContext: input.sessionContext,
    actionThreshold: input.actionThreshold,
    shortlist: input.shortlist,
  });
  if (!result) return null;
  return attachSmartClarifyMetadata(result, 'honest_failure', input);
}

/** acc-4.6 — plain-language preview before bulk/destructive execution. */
export function buildHighRiskConfirmClarify(
  input: SmartClarifyInput,
): CommandResult | null {
  const result = buildHighRiskConfirmClarifyResult({
    prompt: input.prompt,
    action: input.action,
    params: input.params,
    reasoning: input.reasoning,
    sessionContext: input.sessionContext,
    resolved: input.resolved,
    skipHighRiskConfirm: input.skipHighRiskConfirm,
  });
  if (!result) return null;
  return attachSmartClarifyMetadata(result, 'high_risk_confirm', input);
}

/** acc-4.1 — targeted slot fill from field confidence + validator; skip known fields. */
export function buildTargetedSlotClarify(
  input: SmartClarifyInput,
): CommandResult | null {
  const fieldContext = buildClarifyFieldContext({
    params: input.params,
    prompt: input.prompt,
    sessionContext: input.sessionContext,
    resolved: input.resolved,
  });

  if (
    Array.isArray(input.params._noClarifyAutofill) &&
    (input.params._noClarifyAutofill as string[]).length > 0 &&
    canProceedWithoutClarifyAfterAutofill({
      prompt: input.prompt,
      action: input.action,
      params: input.params,
      actionConfidence: input.confidence,
      fieldConfidence: input.fieldConfidence,
      fieldThreshold: input.fieldThreshold,
      resolved: input.resolved,
    })
  ) {
    return null;
  }

  if (input.resolved && isClarifyFollowUpTurn(input.sessionContext)) {
    const mergedResolved = applyLosslessMergeToResolved(
      input.resolved,
      input.sessionContext,
      input.surface,
    );
    const mergedParams = mergedResolved.enrichedParams ?? mergedResolved.params;
    if (
      shouldExecuteClarifyImmediately(
        mergedResolved.action,
        input.prompt,
        mergedParams,
        input.surface,
      )
    ) {
      return null;
    }
  }

  const fieldConfidence =
    input.fieldConfidence ??
    deriveFieldLevelConfidence(
      input.prompt,
      input.action,
      input.params,
      input.confidence ?? 0.7,
    );

  const lowFields = listLowConfidenceFields(
    fieldConfidence,
    input.action,
    input.params,
    input.fieldThreshold,
  ).filter(
    (field) => field !== 'action' && !fieldSatisfiedForClarify(field, fieldContext),
  );

  let issues: ValidationIssue[] = fieldConfidenceToValidationIssues(lowFields);

  if (input.resolved) {
    const validation = validateCommand(input.resolved);
    const validatedFields = new Set(issues.map((issue) => issue.field));
    for (const issue of validation.issues) {
      if (validatedFields.has(issue.field)) continue;
      issues.push(issue);
      validatedFields.add(issue.field);
    }
  }

  issues = filterTargetedClarifyIssues(issues, fieldContext);
  issues = trimNeedlessClarifyIssues({
    action: input.action,
    params: input.params,
    issues,
    screenContext: input.params.context as Record<string, unknown> | undefined,
    sessionContext: input.sessionContext,
    entityMemory: input.entityMemory,
    surface: input.surface,
    prompt: input.prompt,
  });
  issues = dedupeValidationIssuesByField(issues);
  issues = sortValidationIssuesForClarify(issues);
  const entityOptions = detectEntityAmbiguity({
    prompt: input.prompt,
    params: input.params,
    sessionContext: input.sessionContext,
    employees: input.employees,
    services: input.services,
    customers: input.customers,
  });
  issues = filterMissingFieldsForEntityDisambiguation(issues, entityOptions);

  if (issues.length === 0 && entityOptions.length < 2) return null;

  const baseResult: CommandResult = {
    success: false,
    action: input.action,
    summary:
      issues.length === 0
        ? entityDisambiguationSummary(entityOptions[0]?.field ?? 'employeeName')
        : buildMultiFieldClarifySummary(issues),
    details: {
      needsClarification: true,
      clarify: true,
      clarifySource: 'targeted_slots',
      missing: issues,
      entityOptions: entityOptions.length >= 2 ? entityOptions : undefined,
      entityDisambiguationField: entityOptions[0]?.field,
      fieldConfidence,
      lowConfidenceFields: lowFields,
      pipelineStage: 'clarify',
      reasoning: input.reasoning,
    },
  };

  return attachSmartClarifyMetadata(
    attachMultiFieldClarifyMetadata(baseResult, issues, entityOptions),
    'targeted_slots',
    input,
  );
}

export { detectEntityAmbiguity } from './ai-entity-disambiguation-clarify.util.js';

/** acc-5.1 — weak or ambiguous fuzzy resolution → clarify before slot fill. */
export function buildResolutionAccuracyGuardClarify(
  input: SmartClarifyInput,
): CommandResult | null {
  const clarify = buildResolutionAccuracyClarify(input);
  if (!clarify) return null;
  return attachSmartClarifyMetadata(clarify, 'resolution_accuracy', input);
}

/** acc-4.3 — ambiguous entity matches become selectable options, not free-text re-ask. */
export function buildEntityDisambiguationClarify(
  input: SmartClarifyInput,
): CommandResult | null {
  const clarify = buildEntityDisambiguationClarifyResult({
    prompt: input.prompt,
    params: input.params,
    sessionContext: input.sessionContext,
    employees: input.employees,
    services: input.services,
    customers: input.customers,
    action: input.action,
    reasoning: input.reasoning,
  });
  if (!clarify) return null;
  return enrichWithSomethingElseEscape(
    attachSmartClarifyMetadata(clarify, 'entity_disambiguation', input),
    input,
  );
}

/** acc-4.2 — top-2 intent chips via semantic-confidence + shortlist/pattern pairs. */
export function buildIntentDisambiguationClarify(
  input: SmartClarifyInput,
): CommandResult | null {
  const semanticClarify = buildSemanticConfidenceClarifyIfNeeded({
    prompt: input.prompt,
    surface: input.surface,
    action: input.action,
    params: input.params,
    reasoning: input.reasoning,
  });
  const semanticCandidates = semanticClarify?.details.clarifyCandidates;
  if (Array.isArray(semanticCandidates) && semanticCandidates.length >= 2 && semanticClarify) {
    return enrichWithSomethingElseEscape(
      attachSmartClarifyMetadata(semanticClarify, 'intent_disambiguation', input),
      input,
    );
  }

  const clarify = buildIntentDisambiguationClarifyResult({
    prompt: input.prompt,
    surface: input.surface,
    action: input.action,
    params: input.params,
    reasoning: input.reasoning,
    confidence: input.confidence,
    shortlist: input.shortlist,
  });
  if (clarify) {
    return enrichWithSomethingElseEscape(
      attachSmartClarifyMetadata(clarify, 'intent_disambiguation', input),
      input,
    );
  }

  if (semanticClarify) {
    return enrichWithSomethingElseEscape(
      attachSmartClarifyMetadata(semanticClarify, 'intent_disambiguation', input),
      input,
    );
  }
  return null;
}

export function buildClassificationVerifyClarify(
  input: SmartClarifyInput,
): CommandResult | null {
  if (!input.params._classificationNeedsClarify) return null;
  const reasons = input.params._classificationVerifyReasons as string[] | undefined;

  return attachSmartClarifyMetadata(
    {
      success: false,
      action: input.action === 'unknown' ? 'clarify' : input.action,
      summary:
        reasons?.length
          ? `I'm not confident I understood that (${reasons[0]}). Can you clarify?`
          : "I'm not confident I understood that. Can you clarify?",
      details: {
        needsClarification: true,
        clarify: true,
        clarifySource: 'classification_verify',
        verifyReasons: reasons ?? [],
        pipelineStage: 'clarify',
        reasoning: input.reasoning,
      },
    },
    'classification_verify',
    input,
  );
}

/** n99-1.3 — prefer one combined form over serial entity-only clarify. */
export function resolveEntityOrCombinedClarify(
  input: SmartClarifyInput,
): CommandResult | null {
  const targeted = buildTargetedSlotClarify(input);
  if (targeted && !shouldPreferEntityOnlyClarify(targeted)) {
    return targeted;
  }
  const entity = buildEntityDisambiguationClarify(input);
  if (entity) return entity;
  return targeted;
}

/** acc-4 — unified smart clarification resolver (priority ordered). */
export function resolveSmartClarify(input: SmartClarifyInput): CommandResult | null {
  const phase = input.phase ?? 'early';

  if (phase === 'early') {
    const guardrail = resolveNoClarifyGuardrailClarify({
      prompt: input.prompt,
      surface: input.surface,
      action: input.action,
      params: input.params,
      reasoning: input.reasoning,
      actionConfidence: input.confidence,
      sessionContext: input.sessionContext,
      shortlist: input.shortlist,
    });
    if (guardrail) return guardrail;

    const intent = buildIntentDisambiguationClarify(input);
    if (intent) return intent;

    const combined = resolveEntityOrCombinedClarify(input);
    if (combined) return combined;

    const verify = buildClassificationVerifyClarify(input);
    if (verify) return verify;

    const fallback = buildSuggestedActionFallbackClarify(input);
    if (fallback) return fallback;

    return null;
  }

  const handoff = buildEscalationHandoffResult(input);
  if (handoff) return handoff;

  const honest = buildHonestFailureClarify(input);
  if (honest) return honest;

  const resolution = buildResolutionAccuracyGuardClarify(input);
  if (resolution) return resolution;

  const combined = resolveEntityOrCombinedClarify(input);
  if (combined) return combined;

  const highRisk = buildHighRiskConfirmClarify(input);
  if (highRisk) return highRisk;

  return null;
}

export function mergeClarifyPartialParams(
  params: Record<string, unknown>,
  session?: Record<string, unknown>,
): Record<string, unknown> {
  return mergeCrossTurnClarifyParams(params, session);
}

export { recordClarifyAnswerInSession } from './ai-clarify-answer-reuse.util.js';
export { mergeCrossTurnClarifyPrompt as mergeClarifyFollowUpPrompt } from './ai-clarify-cross-turn-merge.util.js';

export function buildSmartClarifySessionContext(
  priorSession: Record<string, unknown> | undefined,
  clarifyResult: CommandResult,
): Record<string, unknown> {
  return buildSmartClarifyAnswerReuseSessionContext(priorSession, clarifyResult);
}

export function buildClarifyTraceMetadata(result: CommandResult): Record<string, unknown> {
  return {
    clarifyKind: result.details.clarifyKind,
    clarifySource: result.details.clarifySource,
    clarifyRound: result.details.clarifyRound,
    clarifyCandidateCount: Array.isArray(result.details.clarifyCandidates)
      ? result.details.clarifyCandidates.length
      : 0,
    entityOptionCount: Array.isArray(result.details.entityOptions)
      ? result.details.entityOptions.length
      : 0,
    suggestedCommandCount: Array.isArray(result.details.suggestedCommands)
      ? result.details.suggestedCommands.length
      : 0,
  };
}
