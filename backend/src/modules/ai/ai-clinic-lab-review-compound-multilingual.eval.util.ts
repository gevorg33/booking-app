import {
  CLINIC_LAB_REVIEW_MULTILINGUAL_SCENARIOS,
  type ClinicLabReviewMultilingualScenario,
} from './ai-clinic-lab-review-compound-multilingual.fixtures.js';
import { needsMultilingualNormalization } from './ai-prompt-i18n.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

export function clinicLabReviewMultilingualEvalCaseId(
  scenario: Pick<ClinicLabReviewMultilingualScenario, 'id'>,
): string {
  return `clinic-lab-review-i18n-${scenario.id}`;
}

function buildClinicLabReviewCompoundStepParams(
  expectedParams?: Record<string, unknown>,
): AiCommandEvalExpectation['compoundStepParams'] {
  if (!expectedParams) return undefined;

  const stepParams: NonNullable<
    AiCommandEvalExpectation['compoundStepParams']
  > = [];

  if (expectedParams.customerName) {
    stepParams.push(
      {
        stepIndex: 0,
        paramsPartial: { customerName: expectedParams.customerName },
      },
      {
        stepIndex: 1,
        paramsPartial: { customerName: expectedParams.customerName },
      },
    );
  } else if (expectedParams.orderId) {
    stepParams.push(
      {
        stepIndex: 0,
        paramsPartial: { orderId: expectedParams.orderId },
      },
      {
        stepIndex: 1,
        paramsPartial: { orderId: expectedParams.orderId },
      },
    );
  }

  return stepParams.length > 0 ? stepParams : undefined;
}

export function clinicLabReviewMultilingualScenarioToEvalCase(
  scenario: ClinicLabReviewMultilingualScenario,
): AiCommandEvalCase {
  const compoundStepParams = buildClinicLabReviewCompoundStepParams(
    scenario.paramsPartial,
  );
  const needsMultilingual = needsMultilingualNormalization(scenario.prompt);

  return {
    id: clinicLabReviewMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'dashboard',
    locale: scenario.locale,
    expect: {
      ...(isCompoundPrompt(scenario.prompt)
        ? { routeTier: 'compound' as const }
        : {}),
      compoundSurface: 'dashboard',
      compoundSteps: [...scenario.orderedActions],
      compoundRecipeId: 'clinic_lab_review',
      compoundSource: 'golden',
      ...(needsMultilingual ? { needsMultilingual: true } : {}),
      ...(compoundStepParams ? { compoundStepParams } : {}),
    },
  };
}

export const AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  CLINIC_LAB_REVIEW_MULTILINGUAL_SCENARIOS.map(
    clinicLabReviewMultilingualScenarioToEvalCase,
  );
