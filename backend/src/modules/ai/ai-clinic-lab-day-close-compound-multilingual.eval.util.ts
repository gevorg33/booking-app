import {
  CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_SCENARIOS,
  type ClinicLabDayCloseMultilingualScenario,
} from './ai-clinic-lab-day-close-compound-multilingual.fixtures.js';
import { needsMultilingualNormalization } from './ai-prompt-i18n.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

export function clinicLabDayCloseMultilingualEvalCaseId(
  scenario: Pick<ClinicLabDayCloseMultilingualScenario, 'id'>,
): string {
  return `clinic-lab-day-close-i18n-${scenario.id}`;
}

function buildClinicLabDayCloseCompoundStepParams(
  expectedParams?: Record<string, unknown>,
): AiCommandEvalExpectation['compoundStepParams'] {
  if (!expectedParams) return undefined;

  const stepParams: NonNullable<
    AiCommandEvalExpectation['compoundStepParams']
  > = [];

  if (expectedParams.date || expectedParams.status) {
    stepParams.push({
      stepIndex: 0,
      paramsPartial: {
        ...(expectedParams.date ? { date: expectedParams.date } : {}),
        ...(expectedParams.status ? { status: expectedParams.status } : {}),
      },
    });
  }
  if (
    expectedParams.orderId ||
    expectedParams.measurementCode ||
    expectedParams.value
  ) {
    stepParams.push({
      stepIndex: 1,
      paramsPartial: {
        ...(expectedParams.orderId ? { orderId: expectedParams.orderId } : {}),
        ...(expectedParams.measurementCode
          ? { measurementCode: expectedParams.measurementCode }
          : {}),
        ...(expectedParams.value ? { value: expectedParams.value } : {}),
      },
    });
  }
  if (expectedParams.customerName || expectedParams.orderId) {
    stepParams.push({
      stepIndex: 2,
      paramsPartial: {
        ...(expectedParams.customerName
          ? { customerName: expectedParams.customerName }
          : {}),
        ...(expectedParams.orderId ? { orderId: expectedParams.orderId } : {}),
      },
    });
  }
  if (expectedParams.customerName) {
    stepParams.push({
      stepIndex: 3,
      paramsPartial: { customerName: expectedParams.customerName },
    });
  }

  return stepParams.length > 0 ? stepParams : undefined;
}

export function clinicLabDayCloseMultilingualScenarioToEvalCase(
  scenario: ClinicLabDayCloseMultilingualScenario,
): AiCommandEvalCase {
  const compoundStepParams = buildClinicLabDayCloseCompoundStepParams(
    scenario.paramsPartial,
  );
  const needsMultilingual = needsMultilingualNormalization(scenario.prompt);

  return {
    id: clinicLabDayCloseMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'dashboard',
    locale: scenario.locale,
    expect: {
      ...(isCompoundPrompt(scenario.prompt)
        ? { routeTier: 'compound' as const }
        : {}),
      compoundSurface: 'dashboard',
      compoundSteps: [...scenario.orderedActions],
      compoundRecipeId: 'clinic_lab_day_close',
      compoundSource: 'golden',
      ...(needsMultilingual ? { needsMultilingual: true } : {}),
      ...(compoundStepParams ? { compoundStepParams } : {}),
    },
  };
}

export const AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_SCENARIOS.map(
    clinicLabDayCloseMultilingualScenarioToEvalCase,
  );
