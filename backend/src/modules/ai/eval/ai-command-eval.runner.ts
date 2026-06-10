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
import { enrichCatalogNotifyRescueParams } from '../ai-catalog-notify.util.js';
import {
  enrichBudgetFromPrompt,
  rescueBudgetServiceDiscoveryIntent,
  resolveBudgetMisrouteAction,
  resolveBudgetMisrouteActionForSurface,
} from '../ai-budget-service-discovery.util.js';
import {
  enrichServiceRankFromPrompt,
  rescueServiceRankDiscoveryIntent,
} from '../ai-service-rank-discovery.util.js';
import { buildFlexibleAvailabilityEvalParams } from '../ai-flexible-availability-compound.util.js';
import { rescueSelfServiceBookingIntent } from '../ai-self-service-booking.util.js';
import { rescueMarketingGrowthIntent } from '../ai-marketing-growth.util.js';
import {
  parseExplainConsumerCheckoutSuccessFromPrompt,
  rescueExplainConsumerCheckoutSuccessIntent,
} from '../ai-consumer-checkout-success.util.js';
import {
  parseExplainConsumerCheckoutTaxFromPrompt,
  rescueExplainConsumerCheckoutTaxIntent,
} from '../ai-consumer-checkout-tax.util.js';
import {
  parseExplainResultStatusFromPrompt,
  parseListMyTestResultsFromPrompt,
  rescueConsumerClinicTestResultsIntent,
} from '../ai-consumer-clinic-test-results.util.js';
import { rescueProviderPushSetupIntent } from '../ai-provider-push-setup.util.js';
import { validateCommand } from '../command-completion.validator.js';
import type { ResolvedCommand } from '../command-completion.types.js';
import type {
  AiCommandEvalCase,
  AiEvalCaseResult,
} from './ai-command-eval.types.js';

const HIPAA_EVAL_SETTINGS = {
  businessType: 'clinic',
  hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' },
};

const decomposition = {
  isCompoundPrompt,
} as IntentDecompositionService;

const router = new CommandComplexityRouterService(decomposition);
const rescue = new AiIntentRescueService();

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
      expected.every((item, index) =>
        valuesMatchPartial(actual[index], item),
      )
    );
  }
  if (expected !== null && typeof expected === 'object') {
    if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) {
      return false;
    }
    return Object.entries(expected as Record<string, unknown>).every(
      ([key, value]) =>
        valuesMatchPartial(
          (actual as Record<string, unknown>)[key],
          value,
        ),
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
    if (
      expect.paramsPartial &&
      !expect.rescuedAction &&
      !expect.useSurfaceFlexibleAvailabilityEnrichment
    ) {
      errors.push(...paramsMatchPartial(params, expect.paramsPartial));
    }
  }

  if (
    expect.useSurfaceFlexibleAvailabilityEnrichment === true &&
    evalCase.surface &&
    (evalCase.surface === 'public' || evalCase.surface === 'customer')
  ) {
    const enriched = buildFlexibleAvailabilityEvalParams(
      prompt,
      evalCase.surface,
      expect.enrichedAction ?? 'check_availability',
    );
    if (expect.paramsPartial) {
      errors.push(...paramsMatchPartial(enriched, expect.paramsPartial));
    }
  }

  if (expect.rescuedAction) {
    const misclassifiedAction = expect.rescueFromAction ?? 'unknown';
    const useSurfaceSelfServiceRescue =
      expect.useSurfaceSelfServiceRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceMarketingGrowthRescue =
      expect.useSurfaceMarketingGrowthRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceConsumerCheckoutSuccessRescue =
      expect.useSurfaceConsumerCheckoutSuccessRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceConsumerCheckoutTaxRescue =
      expect.useSurfaceConsumerCheckoutTaxRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceConsumerClinicTestResultsRescue =
      expect.useSurfaceConsumerClinicTestResultsRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceProviderPushSetupRescue =
      expect.useSurfaceProviderPushSetupRescue === true &&
      evalCase.surface === 'provider';
    const useSurfaceLabBookingRescue =
      expect.useSurfaceLabBookingRescue === true && !!evalCase.surface;
    const useSurfaceBudgetRescue =
      expect.useSurfaceBudgetRescue === true && !!evalCase.surface;
    const useSurfaceRankRescue =
      expect.useSurfaceRankRescue === true && !!evalCase.surface;
    const surfaceRescued = useSurfaceLabBookingRescue
      ? rescueClinicLabBookingSurfaceForEval(
          prompt,
          misclassifiedAction,
          evalCase.surface as 'dashboard' | 'customer' | 'provider',
        )
      : null;
    const budgetRescued = useSurfaceBudgetRescue
      ? rescueBudgetServiceDiscoveryIntent(
          prompt,
          misclassifiedAction,
          evalCase.surface as 'public' | 'customer' | 'dashboard',
        )
      : null;
    const rankRescued = useSurfaceRankRescue
      ? rescueServiceRankDiscoveryIntent(
          prompt,
          misclassifiedAction,
          evalCase.surface as 'public' | 'customer' | 'dashboard',
        )
      : null;
    const selfServiceRescued = useSurfaceSelfServiceRescue
      ? rescueSelfServiceBookingIntent(prompt, misclassifiedAction)
      : null;
    const marketingGrowthRescued = useSurfaceMarketingGrowthRescue
      ? rescueMarketingGrowthIntent(prompt, misclassifiedAction)
      : null;
    const consumerCheckoutSuccessRescued =
      useSurfaceConsumerCheckoutSuccessRescue
        ? rescueExplainConsumerCheckoutSuccessIntent(prompt, misclassifiedAction)
        : null;
    const consumerCheckoutSuccessParsed =
      useSurfaceConsumerCheckoutSuccessRescue
        ? parseExplainConsumerCheckoutSuccessFromPrompt(prompt)
        : null;
    const consumerCheckoutTaxRescued = useSurfaceConsumerCheckoutTaxRescue
      ? rescueExplainConsumerCheckoutTaxIntent(prompt, misclassifiedAction)
      : null;
    const consumerCheckoutTaxParsed = useSurfaceConsumerCheckoutTaxRescue
      ? parseExplainConsumerCheckoutTaxFromPrompt(prompt)
      : null;
    const consumerClinicTestResultsRescued =
      useSurfaceConsumerClinicTestResultsRescue
        ? rescueConsumerClinicTestResultsIntent(prompt, misclassifiedAction)
        : null;
    const consumerClinicListParsed = useSurfaceConsumerClinicTestResultsRescue
      ? parseListMyTestResultsFromPrompt(prompt)
      : null;
    const consumerClinicExplainParsed = useSurfaceConsumerClinicTestResultsRescue
      ? parseExplainResultStatusFromPrompt(prompt)
      : null;
    const providerPushSetupRescued = useSurfaceProviderPushSetupRescue
      ? rescueProviderPushSetupIntent(prompt, misclassifiedAction)
      : null;
    const rescued = useSurfaceSelfServiceRescue
      ? selfServiceRescued
        ? {
            action: selfServiceRescued.action,
            params: {},
            rescued: true,
            rescueReason: selfServiceRescued.rescueReason,
          }
        : null
      : useSurfaceMarketingGrowthRescue
        ? marketingGrowthRescued
          ? {
              action: marketingGrowthRescued.action,
              params: {},
              rescued: true,
              rescueReason: marketingGrowthRescued.rescueReason,
            }
          : null
        : useSurfaceConsumerCheckoutSuccessRescue
          ? consumerCheckoutSuccessRescued && consumerCheckoutSuccessParsed
            ? {
                action: consumerCheckoutSuccessRescued.action,
                params: {
                  aspect: consumerCheckoutSuccessParsed.aspect,
                },
                rescued: true,
                rescueReason: consumerCheckoutSuccessRescued.rescueReason,
              }
            : null
          : useSurfaceConsumerCheckoutTaxRescue
            ? consumerCheckoutTaxRescued && consumerCheckoutTaxParsed
              ? {
                  action: consumerCheckoutTaxRescued.action,
                  params: {
                    aspect: consumerCheckoutTaxParsed.aspect,
                  },
                  rescued: true,
                  rescueReason: consumerCheckoutTaxRescued.rescueReason,
                }
              : null
            : useSurfaceConsumerClinicTestResultsRescue
              ? consumerClinicTestResultsRescued
                ? {
                    action: consumerClinicTestResultsRescued.action,
                    params:
                      consumerClinicTestResultsRescued.action ===
                      'list_my_test_results'
                        ? { ...(consumerClinicListParsed ?? {}) }
                        : { ...(consumerClinicExplainParsed ?? {}) },
                    rescued: true,
                    rescueReason: consumerClinicTestResultsRescued.rescueReason,
                  }
                : null
              : useSurfaceProviderPushSetupRescue
                ? providerPushSetupRescued
                  ? {
                      action: providerPushSetupRescued.action,
                      params: {},
                      rescued: true,
                      rescueReason: providerPushSetupRescued.rescueReason,
                    }
                  : null
      : useSurfaceLabBookingRescue
      ? surfaceRescued
        ? {
            action: surfaceRescued.action,
            params: surfaceRescued.params,
            rescued: true,
            rescueReason: surfaceRescued.rescueReason,
          }
        : null
      : useSurfaceRankRescue
        ? rankRescued
          ? {
              action: rankRescued.action,
              params: rankRescued.params,
              rescued: true,
              rescueReason: rankRescued.rescueReason,
            }
          : null
        : useSurfaceBudgetRescue
          ? budgetRescued
            ? {
                action: budgetRescued.action,
                params: enrichBudgetFromPrompt({}, prompt),
                rescued: true,
                rescueReason: budgetRescued.rescueReason,
              }
            : null
          : rescue.rescue({
            prompt,
            action: misclassifiedAction,
            params: {},
            employees: SAMPLE_EMPLOYEES,
            surface: evalCase.surface,
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
    if (expect.paramsPartial) {
      if (!rescued?.params) {
        errors.push('paramsPartial: rescue returned no params object');
      } else {
        enrichCatalogNotifyRescueParams(rescued.action, rescued.params, prompt);
        errors.push(...paramsMatchPartial(rescued.params, expect.paramsPartial));
      }
    } else if (rescued?.params) {
      enrichCatalogNotifyRescueParams(rescued.action, rescued.params, prompt);
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

  if (expect.expectValidationClarify) {
    const action = expect.validationAction ?? expect.rescuedAction;
    if (!action) {
      errors.push(
        'expectValidationClarify: validationAction or rescuedAction required',
      );
    } else {
      const cmd: ResolvedCommand = {
        action,
        params: { ...(expect.validationParamsPartial ?? {}) },
        reasoning: 'eval',
        prompt,
        businessId: 'eval-business',
        entities: {
          employees: [],
          services: [],
          customers: [],
          templates: [],
        },
        enrichedParams: {},
      };
      const validation = validateCommand(cmd);
      if (validation.ok) {
        errors.push(
          'expectValidationClarify: validation passed but expected clarify',
        );
      }
      if (expect.clarifyFieldsContains?.length) {
        const fields = validation.issues.map((issue) => issue.field);
        for (const field of expect.clarifyFieldsContains) {
          if (!fields.includes(field)) {
            errors.push(
              `clarifyFieldsContains: missing ${field} in [${fields.join(', ')}]`,
            );
          }
        }
      }
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
