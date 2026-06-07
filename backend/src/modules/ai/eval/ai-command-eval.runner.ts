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
