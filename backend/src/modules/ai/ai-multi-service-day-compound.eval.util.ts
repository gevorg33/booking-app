import {
  MULTI_SERVICE_DAY_COMPOUND_PROMPTS,
  type MultiServiceDayCompoundFixture,
} from './ai-multi-service-day-compound.fixtures.js';
import { MULTI_SERVICE_DAY_MULTILINGUAL_SCENARIOS } from './ai-multi-service-day-compound-multilingual.fixtures.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildMultiServiceDayCompoundStepParams(
  fixture: Pick<MultiServiceDayCompoundFixture, 'expectedParams'>,
): AiCommandEvalExpectation['compoundStepParams'] {
  const stepParams: NonNullable<
    AiCommandEvalExpectation['compoundStepParams']
  > = [];

  if (fixture.expectedParams?.serviceNames) {
    stepParams.push({
      stepIndex: 0,
      paramsPartial: { serviceNames: fixture.expectedParams.serviceNames },
    });
    stepParams.push({
      stepIndex: 1,
      paramsPartial: { serviceNames: fixture.expectedParams.serviceNames },
    });
  }
  if (fixture.expectedParams?.timeOfDay) {
    stepParams.push({
      stepIndex: 1,
      paramsPartial: { timeOfDay: fixture.expectedParams.timeOfDay },
    });
  }

  return stepParams.length > 0 ? stepParams : undefined;
}

export function multiServiceDayScenarioToEvalCase(
  fixture: MultiServiceDayCompoundFixture,
): AiCommandEvalCase {
  return {
    id: `multi-service-day-${fixture.id}`,
    prompt: fixture.prompt,
    surface: 'customer',
    expect: {
      routeTier: 'compound',
      compoundRecipeId: 'multi_service_day',
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams: buildMultiServiceDayCompoundStepParams(fixture),
      noLlm: true,
      ...(isCompoundPrompt(fixture.prompt) ? {} : { routeTier: 'compound' }),
    },
  };
}

export const AI_COMMAND_EVAL_MULTI_SERVICE_DAY_COMPOUND_CASES: AiCommandEvalCase[] =
  MULTI_SERVICE_DAY_COMPOUND_PROMPTS.map(multiServiceDayScenarioToEvalCase);

export const AI_COMMAND_EVAL_MULTI_SERVICE_DAY_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTI_SERVICE_DAY_MULTILINGUAL_SCENARIOS.map(
    multiServiceDayScenarioToEvalCase,
  );

export const AI_COMMAND_EVAL_MULTI_SERVICE_DAY_RESCUE_CASES: AiCommandEvalCase[] =
  MULTI_SERVICE_DAY_COMPOUND_PROMPTS.slice(0, 4).map((fixture) => ({
    id: `multi-service-day-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: 'customer',
    expect: {
      routeTier: 'compound',
      rescueReason: 'multi_service_day_compound',
      compoundRecipeId: 'multi_service_day',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
