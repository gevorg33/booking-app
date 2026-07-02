import {
  CANCEL_AND_REBOOK_COMPOUND_PROMPTS,
  type CancelAndRebookCompoundFixture,
} from './ai-cancel-and-rebook-compound.fixtures.js';
import { CANCEL_AND_REBOOK_MULTILINGUAL_SCENARIOS } from './ai-cancel-and-rebook-compound-multilingual.fixtures.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildCancelAndRebookCompoundStepParams(
  fixture: Pick<CancelAndRebookCompoundFixture, 'expectedParams'>,
): AiCommandEvalExpectation['compoundStepParams'] {
  const stepParams: NonNullable<
    AiCommandEvalExpectation['compoundStepParams']
  > = [];

  if (fixture.expectedParams?.serviceName) {
    stepParams.push({
      stepIndex: 0,
      paramsPartial: { serviceName: fixture.expectedParams.serviceName },
    });
  }
  if (fixture.expectedParams?.bookingFirstAvailable) {
    stepParams.push({
      stepIndex: 1,
      paramsPartial: {
        bookingFirstAvailable: fixture.expectedParams.bookingFirstAvailable,
      },
    });
  }

  return stepParams.length > 0 ? stepParams : undefined;
}

export function cancelAndRebookScenarioToEvalCase(
  fixture: CancelAndRebookCompoundFixture,
): AiCommandEvalCase {
  return {
    id: `cancel-and-rebook-${fixture.id}`,
    prompt: fixture.prompt,
    surface: 'customer',
    expect: {
      routeTier: 'compound',
      compoundRecipeId: 'cancel_and_rebook',
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams: buildCancelAndRebookCompoundStepParams(fixture),
      noLlm: true,
      ...(isCompoundPrompt(fixture.prompt) ? {} : { routeTier: 'compound' }),
    },
  };
}

export const AI_COMMAND_EVAL_CANCEL_AND_REBOOK_COMPOUND_CASES: AiCommandEvalCase[] =
  CANCEL_AND_REBOOK_COMPOUND_PROMPTS.map(cancelAndRebookScenarioToEvalCase);

export const AI_COMMAND_EVAL_CANCEL_AND_REBOOK_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  CANCEL_AND_REBOOK_MULTILINGUAL_SCENARIOS.map(
    cancelAndRebookScenarioToEvalCase,
  );

export const AI_COMMAND_EVAL_CANCEL_AND_REBOOK_RESCUE_CASES: AiCommandEvalCase[] =
  CANCEL_AND_REBOOK_COMPOUND_PROMPTS.slice(0, 4).map((fixture) => ({
    id: `cancel-and-rebook-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: 'customer',
    expect: {
      routeTier: 'compound',
      rescueReason: 'cancel_and_rebook_compound',
      compoundRecipeId: 'cancel_and_rebook',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
