import { CommandComplexityRouterService } from '../command-complexity-router.service.js';
import { IntentDecompositionService } from '../intent-decomposition.service.js';
import { AiIntentRescueService } from '../ai-intent-rescue.service.js';
import { needsMultilingualNormalization } from '../ai-prompt-i18n.js';
import {
  resolveRescheduleParams,
  extractRescheduleTargetTime,
  extractRescheduleSourceTime,
} from '../ai-intent-heuristics.js';
import {
  decomposeDeterministicForSurface,
  isCompoundPrompt,
} from '../intent-decomposition.util.js';
import {
  assessPhiInAiContext,
  redactEmbeddedPhiFromPrompt,
} from '../../../common/utils/phi-ai-guard.util.js';
import { rescueClinicLabBookingSurfaceForEval } from '../ai-clinic-lab-booking-multilingual.util.js';
import {
  evaluateAdversarialEnforceAction,
  evaluateAdversarialPreflight,
  inferAdversarialEvalKind,
} from './ai-command-eval.adversarial.util.js';
import {
  ambiguityClarifyFieldsMatch,
  buildAmbiguityResolvedCommand,
  deriveAmbiguityClarifyFields,
  inferAmbiguityEvalKind,
  type AmbiguityCorpusSeed,
} from './ai-command-eval.ambiguity.util.js';
import { validateCommand } from '../command-completion.validator.js';
import { evaluateClarifyFollowUpPipeline } from '../ai-n99-clarify-success.util.js';
import {
  applyConfidenceGatedAutofill,
  canProceedWithoutClarifyAfterAutofill,
  enrichParamsForNoClarifyCompletion,
  shouldBlockNoClarifyAutofill,
  trimNeedlessClarifyIssues,
} from '../ai-n99-no-clarify-completion.util.js';
import { evaluateN99FewShotRetrievalScenario } from '../ai-n99-fewshot-retrieval.util.js';
import {
  attachAutofillExecutionMetadata,
  computeAutoFillFieldThresholdAdjustment,
  evaluateAutofillPreviewScenario,
} from '../ai-n99-wrong-execution-watchdog.util.js';
import { evaluateAmbiguousDestructiveScenario } from '../ai-n99-ambiguous-destructive-clarify.util.js';
import { buildSomethingElseEscapeAlternatives } from '../ai-something-else-clarify.util.js';
import type {
  AiCommandEvalCase,
  AiEvalCaseResult,
} from './ai-command-eval.types.js';
import type { AiCommandEvalExpectation } from './ai-command-eval.types.js';

const HIPAA_EVAL_SETTINGS = {
  businessType: 'clinic',
  hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' },
};

const decomposition = {
  isCompoundPrompt,
} as IntentDecompositionService;

const router = new CommandComplexityRouterService(decomposition);
const rescue = new AiIntentRescueService();

function expectedClarifyFollowupSecondTurnSuccess(
  followUp: NonNullable<AiCommandEvalExpectation['clarifyFollowup']>,
): boolean {
  if (followUp.expectSecondTurnSuccess != null) {
    return followUp.expectSecondTurnSuccess;
  }
  if (followUp.expectInlineValid === false) return false;
  return Boolean(followUp.followUpPrompt && followUp.originalAction);
}

function evaluateClarifyFollowupSecondTurnSuccess(
  followUp: NonNullable<AiCommandEvalExpectation['clarifyFollowup']>,
  pipeline: ReturnType<typeof evaluateClarifyFollowUpPipeline>,
): string | null {
  const expected = expectedClarifyFollowupSecondTurnSuccess(followUp);
  if (!expected) {
    if (pipeline.inlineValidation.valid) {
      return 'clarifyFollowup.secondTurnSuccess: expected follow-up rejection';
    }
    return null;
  }
  if (!pipeline.inlineValidation.valid) {
    return 'clarifyFollowup.secondTurnSuccess: follow-up did not validate';
  }
  if (
    followUp.expectExecuteImmediately != null &&
    pipeline.executeImmediately !== followUp.expectExecuteImmediately
  ) {
    return `clarifyFollowup.secondTurnSuccess: executeImmediately expected ${followUp.expectExecuteImmediately}, got ${pipeline.executeImmediately}`;
  }
  return null;
}

const SAMPLE_EMPLOYEES = [
  { id: 'emp-1', name: 'Gevorg Gasparyan' },
  { id: 'emp-2', name: 'Mary Torgomyan' },
  { id: 'emp-3', name: 'Maria Lopez' },
];

function valuesMatchPartial(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      expected.length === actual.length &&
      expected.every((item, index) => item === actual[index])
    );
  }
  return actual === expected;
}

function paramsMatchPartial(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(expected)) {
    if (!valuesMatchPartial(actual[key], value)) {
      errors.push(
        `params.${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(actual[key])}`,
      );
    }
  }
  return errors;
}

/** Evaluate one golden case using deterministic routing/parsing only. */
export function evaluateDeterministicEvalCase(
  evalCase: AiCommandEvalCase,
  timeZone = 'UTC',
): AiEvalCaseResult {
  const errors: string[] = [];
  const { expect } = evalCase;
  const prompt = evalCase.prompt;

  if (expect.needsMultilingual !== undefined) {
    const actual = needsMultilingualNormalization(prompt);
    if (actual !== expect.needsMultilingual) {
      errors.push(
        `needsMultilingual: expected ${expect.needsMultilingual}, got ${actual}`,
      );
    }
  }

  if (expect.routeTier) {
    const route = router.routeDeterministic(prompt, SAMPLE_EMPLOYEES);
    if (route.tier !== expect.routeTier) {
      errors.push(`routeTier: expected ${expect.routeTier}, got ${route.tier}`);
    }
  }

  if (
    expect.rescheduleTimeSlot ||
    expect.rescheduleFromTimeSlot ||
    expect.paramsPartial
  ) {
    const params: Record<string, unknown> = {};
    resolveRescheduleParams(params, prompt, timeZone);
    if (expect.rescheduleTimeSlot) {
      const parsed =
        (params.timeSlot as string | undefined) ??
        extractRescheduleTargetTime(prompt);
      if (parsed !== expect.rescheduleTimeSlot) {
        errors.push(
          `rescheduleTimeSlot: expected ${expect.rescheduleTimeSlot}, got ${parsed ?? 'null'}`,
        );
      }
    }
    if (expect.rescheduleFromTimeSlot) {
      const parsed =
        (params.fromTimeSlot as string | undefined) ??
        extractRescheduleSourceTime(prompt);
      if (parsed !== expect.rescheduleFromTimeSlot) {
        errors.push(
          `rescheduleFromTimeSlot: expected ${expect.rescheduleFromTimeSlot}, got ${parsed ?? 'null'}`,
        );
      }
    }
    if (expect.paramsPartial && !expect.rescuedAction) {
      errors.push(...paramsMatchPartial(params, expect.paramsPartial));
    }
  }

  if (expect.rescuedAction) {
    const misclassifiedAction = expect.rescueFromAction ?? 'unknown';
    const useSurfaceLabBookingRescue =
      expect.useSurfaceLabBookingRescue === true && !!evalCase.surface;
    const surfaceRescued = useSurfaceLabBookingRescue
      ? rescueClinicLabBookingSurfaceForEval(
          prompt,
          misclassifiedAction,
          evalCase.surface as 'dashboard' | 'customer' | 'provider',
        )
      : null;
    const rescued = useSurfaceLabBookingRescue
      ? surfaceRescued
        ? {
            action: surfaceRescued.action,
            params: surfaceRescued.params,
            rescued: true,
            rescueReason: surfaceRescued.rescueReason,
          }
        : null
      : rescue.rescue({
          prompt,
          action: misclassifiedAction,
          params: {},
          employees: SAMPLE_EMPLOYEES,
          surface: evalCase.surface ?? 'dashboard',
        });
    if (!rescued?.rescued || rescued.action !== expect.rescuedAction) {
      errors.push(
        `rescuedAction: expected ${expect.rescuedAction}, got ${rescued?.action ?? 'none'}`,
      );
    }
    if (expect.rescueReason && rescued?.rescueReason !== expect.rescueReason) {
      errors.push(
        `rescueReason: expected ${expect.rescueReason}, got ${rescued?.rescueReason ?? 'none'}`,
      );
    }
    if (expect.paramsPartial && rescued?.params) {
      errors.push(...paramsMatchPartial(rescued.params, expect.paramsPartial));
    }
  }

  if (expect.action && !expect.rescuedAction) {
    errors.push(
      'action expectation requires requiresLlm or rescuedAction in deterministic eval',
    );
  }

  if (
    expect.compoundSurface !== undefined ||
    expect.compoundSteps !== undefined ||
    expect.compoundActionsContains !== undefined ||
    expect.compoundMinSteps !== undefined ||
    expect.compoundExpectEmpty !== undefined ||
    expect.compoundSource !== undefined ||
    expect.compoundRecipeId !== undefined ||
    expect.compoundStepParams !== undefined
  ) {
    const surface = expect.compoundSurface ?? 'dashboard';
    const decompositionResult = decomposeDeterministicForSurface(
      surface,
      prompt,
    );

    if (expect.compoundExpectEmpty) {
      if (decompositionResult && decompositionResult.steps.length >= 2) {
        errors.push(
          `compoundExpectEmpty: expected no multi-step decomposition, got ${decompositionResult.steps.map((s) => s.action).join(', ')}`,
        );
      }
    } else {
      const minSteps = expect.compoundMinSteps ?? 2;
      if (!decompositionResult || decompositionResult.steps.length < minSteps) {
        errors.push(
          `compoundMinSteps: expected >= ${minSteps}, got ${decompositionResult?.steps.length ?? 0}`,
        );
      } else {
        const actions = decompositionResult.steps.map((step) => step.action);
        if (expect.compoundSteps) {
          if (actions.join(',') !== expect.compoundSteps.join(',')) {
            errors.push(
              `compoundSteps: expected [${expect.compoundSteps.join(', ')}], got [${actions.join(', ')}]`,
            );
          }
        }
        if (expect.compoundActionsContains) {
          for (const action of expect.compoundActionsContains) {
            if (!actions.includes(action)) {
              errors.push(
                `compoundActionsContains: missing ${action} in [${actions.join(', ')}]`,
              );
            }
          }
        }
        if (
          expect.compoundSource &&
          decompositionResult.source !== expect.compoundSource
        ) {
          errors.push(
            `compoundSource: expected ${expect.compoundSource}, got ${decompositionResult.source}`,
          );
        }
        if (
          expect.compoundRecipeId &&
          decompositionResult.recipeId !== expect.compoundRecipeId
        ) {
          errors.push(
            `compoundRecipeId: expected ${expect.compoundRecipeId}, got ${decompositionResult.recipeId ?? 'none'}`,
          );
        }
        for (const stepExpectation of expect.compoundStepParams ?? []) {
          const step = decompositionResult.steps[stepExpectation.stepIndex];
          if (!step) {
            errors.push(
              `compoundStepParams: missing step at index ${stepExpectation.stepIndex}`,
            );
            continue;
          }
          if (stepExpectation.paramsPartial) {
            errors.push(
              ...paramsMatchPartial(
                step.params,
                stepExpectation.paramsPartial,
              ).map(
                (msg) =>
                  `compoundStepParams[${stepExpectation.stepIndex}].${msg}`,
              ),
            );
          }
        }
      }
    }
  }

  if (expect.phiGuard) {
    const assessment = assessPhiInAiContext(HIPAA_EVAL_SETTINGS, 'clinic', {
      prompt,
    });
    if (assessment.blocked !== expect.phiGuard.blocked) {
      errors.push(
        `phiGuard.blocked: expected ${expect.phiGuard.blocked}, got ${assessment.blocked}`,
      );
    }
    if (
      expect.phiGuard.reason &&
      assessment.reason !== expect.phiGuard.reason
    ) {
      errors.push(
        `phiGuard.reason: expected ${expect.phiGuard.reason}, got ${assessment.reason ?? 'none'}`,
      );
    }
    if (expect.phiGuard.matchedFields) {
      for (const field of expect.phiGuard.matchedFields) {
        if (!assessment.matchedFields?.includes(field as never)) {
          errors.push(
            `phiGuard.matchedFields: missing ${field} in [${assessment.matchedFields?.join(', ') ?? ''}]`,
          );
        }
      }
    }
    if (expect.phiGuard.redactedSubstring) {
      const redacted = redactEmbeddedPhiFromPrompt(prompt);
      if (!redacted.includes(expect.phiGuard.redactedSubstring)) {
        errors.push(
          `phiGuard.redactedSubstring: expected "${expect.phiGuard.redactedSubstring}" in redacted prompt`,
        );
      }
    }
  }

  if (expect.clarifyFields?.length) {
    const ambiguitySeed: Pick<
      AmbiguityCorpusSeed,
      'action' | 'classifiedParams' | 'evalKind' | 'category'
    > = {
      action: expect.clarifyAction ?? 'create_booking',
      classifiedParams: expect.classifiedParams ?? {},
      evalKind: expect.ambiguityEvalKind,
      category: expect.ambiguityCategory as AmbiguityCorpusSeed['category'],
    };
    const actualFields = deriveAmbiguityClarifyFields(ambiguitySeed);
    errors.push(
      ...ambiguityClarifyFieldsMatch(actualFields, expect.clarifyFields),
    );

    const evalKind =
      expect.ambiguityEvalKind ?? inferAmbiguityEvalKind(ambiguitySeed);
    if (evalKind === 'validation') {
      const validation = validateCommand(
        buildAmbiguityResolvedCommand(ambiguitySeed),
      );
      if (validation.ok) {
        errors.push(
          'clarifyFields: expected validation clarify, but command validated OK',
        );
      }
    }
  }
  if (expect.securityBlocked !== undefined) {
    const shouldBlock = expect.securityBlocked;
    const evalKind =
      expect.securityEvalKind ??
      inferAdversarialEvalKind({
        evalKind: expect.securityEvalKind,
        blockReason: expect.securityBlockReason ?? 'injection',
      });

    if (evalKind === 'enforce_action') {
      const enforced = evaluateAdversarialEnforceAction({
        prompt,
        surface: evalCase.surface,
        accessTier: expect.securityAccessTier ?? 'staff',
        classifiedAction: expect.securityClassifiedAction ?? 'create_booking',
        classifiedParams: expect.securityClassifiedParams ?? {},
      });
      if (enforced.blocked !== shouldBlock) {
        errors.push(
          `securityBlocked: expected ${shouldBlock}, got enforceAction=${enforced.blocked ? 'blocked' : 'allowed'}`,
        );
      }
      if (
        shouldBlock &&
        expect.securityBlockReason &&
        enforced.reason !== expect.securityBlockReason
      ) {
        errors.push(
          `securityBlockReason: expected ${expect.securityBlockReason}, got ${enforced.reason ?? 'none'}`,
        );
      }
    } else {
      const security = evaluateAdversarialPreflight(prompt);
      const blocked = security.level === 'block';
      if (blocked !== shouldBlock) {
        errors.push(
          `securityBlocked: expected ${shouldBlock}, got level=${security.level}`,
        );
      }
      if (
        shouldBlock &&
        expect.securityBlockReason &&
        security.blockReason !== expect.securityBlockReason
      ) {
        errors.push(
          `securityBlockReason: expected ${expect.securityBlockReason}, got ${security.blockReason ?? 'none'}`,
        );
      }
    }
  }

  if (expect.clarifyFollowup) {
    const followUp = expect.clarifyFollowup;
    if (followUp.expectSomethingElseCount != null) {
      const options = buildSomethingElseEscapeAlternatives({
        prompt: followUp.originalPrompt,
        surface: evalCase.surface ?? 'dashboard',
        shortlist: followUp.shortlist ?? [],
        excludedActions: followUp.excludedActions,
        clarifyCandidates: followUp.clarifyCandidates,
        limit: followUp.expectSomethingElseCount,
      });
      if (options.length !== followUp.expectSomethingElseCount) {
        errors.push(
          `clarifyFollowup.somethingElse: expected ${followUp.expectSomethingElseCount}, got ${options.length}`,
        );
      }
    } else if (followUp.followUpPrompt && followUp.originalAction) {
      const pipeline = evaluateClarifyFollowUpPipeline({
        originalPrompt: followUp.originalPrompt,
        followUpPrompt: followUp.followUpPrompt,
        originalAction: followUp.originalAction,
        partialParams: followUp.partialParams,
        field: followUp.field,
        timeZone,
      });
      if (
        followUp.expectMergedPrompt &&
        pipeline.mergedPrompt !== followUp.expectMergedPrompt
      ) {
        errors.push(
          `clarifyFollowup.mergedPrompt: expected ${followUp.expectMergedPrompt}, got ${pipeline.mergedPrompt}`,
        );
      }
      if (
        followUp.expectNormalizedFollowUp &&
        pipeline.normalizedFollowUp !== followUp.expectNormalizedFollowUp
      ) {
        errors.push(
          `clarifyFollowup.normalizedFollowUp: expected ${followUp.expectNormalizedFollowUp}, got ${pipeline.normalizedFollowUp}`,
        );
      }
      if (
        followUp.expectRestoredAction &&
        pipeline.restoredAction !== followUp.expectRestoredAction
      ) {
        errors.push(
          `clarifyFollowup.restoredAction: expected ${followUp.expectRestoredAction}, got ${pipeline.restoredAction}`,
        );
      }
      if (
        followUp.expectInlineValid != null &&
        pipeline.inlineValidation.valid !== followUp.expectInlineValid
      ) {
        errors.push(
          `clarifyFollowup.inlineValid: expected ${followUp.expectInlineValid}, got ${pipeline.inlineValidation.valid}`,
        );
      }
      if (
        followUp.expectExecuteImmediately != null &&
        pipeline.executeImmediately !== followUp.expectExecuteImmediately
      ) {
        errors.push(
          `clarifyFollowup.executeImmediately: expected ${followUp.expectExecuteImmediately}, got ${pipeline.executeImmediately}`,
        );
      }
      if (
        followUp.expectInlineHint &&
        pipeline.inlineValidation.hint !== followUp.expectInlineHint
      ) {
        errors.push(
          `clarifyFollowup.inlineHint: expected ${followUp.expectInlineHint}, got ${pipeline.inlineValidation.hint ?? 'none'}`,
        );
      }
      const secondTurnError = evaluateClarifyFollowupSecondTurnSuccess(
        followUp,
        pipeline,
      );
      if (secondTurnError) errors.push(secondTurnError);
    } else {
      errors.push('clarifyFollowup: missing followUpPrompt/originalAction or somethingElse config');
    }
  }

  if (expect.noClarifyCompletion) {
    const nc = expect.noClarifyCompletion;
    if (nc.expectTrimmedFields?.length && nc.validationIssues) {
      const trimmed = trimNeedlessClarifyIssues({
        action: nc.action,
        params: nc.paramsPartial ?? {},
        issues: nc.validationIssues.map((issue) => ({
          field: issue.field,
          label: issue.field,
          message: issue.message,
          example: '',
        })),
        screenContext: nc.screenContext,
        sessionContext: nc.sessionContext,
        entityMemory: nc.entityMemory,
        surface: evalCase.surface ?? 'dashboard',
        prompt: evalCase.prompt,
      });
      for (const field of nc.expectTrimmedFields) {
        if (trimmed.some((issue) => issue.field === field)) {
          errors.push(`noClarifyCompletion.trim: expected field ${field} to be trimmed`);
        }
      }
    } else if (nc.expectBlocked) {
      const block = shouldBlockNoClarifyAutofill({
        action: nc.action,
        actionConfidence: nc.actionConfidence,
        params: nc.paramsPartial ?? {},
        sessionContext: nc.sessionContext,
        surface: evalCase.surface ?? 'dashboard',
      });
      if (!block.blocked) {
        errors.push('noClarifyCompletion.block: expected guardrail to block execution');
      } else if (nc.expectBlockReason && block.reason !== nc.expectBlockReason) {
        errors.push(
          `noClarifyCompletion.blockReason: expected ${nc.expectBlockReason}, got ${block.reason ?? 'none'}`,
        );
      }
    } else {
      const enriched = enrichParamsForNoClarifyCompletion({
        prompt: evalCase.prompt,
        action: nc.action,
        params: { ...(nc.paramsPartial ?? {}) },
        surface: evalCase.surface ?? 'dashboard',
        sessionContext: nc.sessionContext,
        screenContext: nc.screenContext,
        entityMemory: nc.entityMemory,
        businessDefaults: nc.businessDefaults,
        catalogServices: nc.catalogServices,
        actionConfidence: nc.actionConfidence,
      });
      if (enriched.blocked) {
        errors.push('noClarifyCompletion: expected enrichment to proceed');
      }
      if (nc.expectFilled) {
        errors.push(...paramsMatchPartial(enriched.params, nc.expectFilled));
      }
      if (nc.expectAction && (enriched.action ?? nc.action) !== nc.expectAction) {
        errors.push(
          `noClarifyCompletion.action: expected ${nc.expectAction}, got ${enriched.action ?? nc.action}`,
        );
      }
      if (nc.expectProceed != null) {
        const proceed =
          enriched.canProceed ??
          canProceedWithoutClarifyAfterAutofill({
            prompt: evalCase.prompt,
            action: enriched.action ?? nc.action,
            params: enriched.params,
            actionConfidence: nc.actionConfidence,
            fieldThreshold: enriched.fieldThreshold,
          });
        if (proceed !== nc.expectProceed) {
          errors.push(
            `noClarifyCompletion.proceed: expected ${nc.expectProceed}, got ${proceed}`,
          );
        }
      }
    }
  }

  if (expect.fewShotRetrieval) {
    const fs = expect.fewShotRetrieval;
    const result = evaluateN99FewShotRetrievalScenario(
      {
        id: evalCase.id,
        prompt: evalCase.prompt,
        surface: evalCase.surface ?? 'dashboard',
        expectedAction: fs.expectedAction,
        minCount: fs.minCount,
        rarePhrasing: fs.rarePhrasing,
      },
    );
    if (!result.passed) {
      errors.push(...result.errors);
    }
  }

  if (expect.autofillWatchdog) {
    const wd = expect.autofillWatchdog;
    if (
      wd.autoFillTraceCount != null &&
      wd.expectAdjustedThreshold != null
    ) {
      const adjustment = computeAutoFillFieldThresholdAdjustment({
        autoFillTraceCount: wd.autoFillTraceCount,
        autoFillUndoCount: wd.autoFillUndoCount ?? 0,
        autoFillDownvoteCount: wd.autoFillDownvoteCount ?? 0,
        baseThreshold: wd.baseThreshold,
      });
      if (adjustment.adjustedThreshold !== wd.expectAdjustedThreshold) {
        errors.push(
          `autofillWatchdog.threshold: expected ${wd.expectAdjustedThreshold}, got ${adjustment.adjustedThreshold}`,
        );
      }
      if (wd.expectReason && adjustment.reason !== wd.expectReason) {
        errors.push(
          `autofillWatchdog.reason: expected ${wd.expectReason}, got ${adjustment.reason}`,
        );
      }
    }
    if (wd.previewParams && wd.previewAction) {
      const preview = evaluateAutofillPreviewScenario({
        id: evalCase.id,
        action: wd.previewAction,
        params: wd.previewParams,
        taskId: wd.taskId,
        expectPreviewFields: wd.expectPreviewFields ?? [],
        expectOneTapUndo: wd.expectOneTapUndo ?? false,
        expectPostExecAssertion: wd.expectPostExecAssertion ?? false,
      });
      if (!preview.passed) {
        errors.push(...preview.errors.map((error) => `autofillWatchdog.preview: ${error}`));
      }
      const attached = attachAutofillExecutionMetadata(
        {
          success: true,
          action: wd.previewAction,
          summary: 'ok',
          details: wd.taskId ? { taskId: wd.taskId } : {},
        },
        wd.previewParams,
      );
      if (wd.expectPreviewFields?.length) {
        for (const field of wd.expectPreviewFields) {
          const entries = attached.details?.autofillPreview as
            | Array<{ field: string }>
            | undefined;
          if (!entries?.some((entry) => entry.field === field)) {
            errors.push(`autofillWatchdog.preview: missing field ${field}`);
          }
        }
      }
    }
  }

  if (expect.ambiguousDestructiveClarify) {
    const ad = expect.ambiguousDestructiveClarify;
    const result = evaluateAmbiguousDestructiveScenario({
      id: evalCase.id,
      prompt: evalCase.prompt,
      action: ad.action,
      params: ad.paramsPartial ?? {},
      surface: evalCase.surface ?? 'dashboard',
      actionConfidence: ad.actionConfidence,
      sessionContext: ad.sessionContext,
      expectBlocked: ad.expectBlocked,
      expectBlockReason: ad.expectBlockReason as
        | import('../ai-n99-ambiguous-destructive-clarify.fixtures.js').NoClarifyGuardReason
        | undefined,
      expectClarify: ad.expectClarify,
      expectCountsTowardClarifySuccess: ad.expectCountsTowardClarifySuccess,
    });
    if (!result.passed) {
      errors.push(...result.errors.map((error) => `ambiguousDestructiveClarify: ${error}`));
    }
  }

  return {
    id: evalCase.id,
    passed: errors.length === 0,
    errors,
  };
}

export function runDeterministicEvalSuite(
  cases: AiCommandEvalCase[],
  timeZone = 'UTC',
): { passed: number; failed: number; results: AiEvalCaseResult[] } {
  const ciCases = cases.filter((c) => !c.requiresLlm);
  const results = ciCases.map((c) =>
    evaluateDeterministicEvalCase(c, timeZone),
  );
  const failed = results.filter((r) => !r.passed).length;
  return {
    passed: results.length - failed,
    failed,
    results,
  };
}
