import {
  REBOOK_AND_PAY_COMPOUND_PROMPTS,
  type RebookAndPayCompoundFixture,
} from './ai-rebook-and-pay-compound.fixtures.js';
import { REBOOK_AND_PAY_MULTILINGUAL_SCENARIOS } from './ai-rebook-and-pay-compound-multilingual.fixtures.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildRebookAndPayCompoundStepParams(
  fixture: Pick<
    RebookAndPayCompoundFixture,
    'expectedParams' | 'paymentAction'
  >,
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
  if (fixture.paymentAction === 'pay_online') {
    stepParams.push({
      stepIndex: 1,
      paramsPartial: { paymentMethod: 'online' },
    });
  }

  return stepParams.length > 0 ? stepParams : undefined;
}

export function rebookAndPayScenarioToEvalCase(
  fixture: RebookAndPayCompoundFixture,
): AiCommandEvalCase {
  return {
    id: `rebook-and-pay-${fixture.id}`,
    prompt: fixture.prompt,
    surface: 'customer',
    expect: {
      routeTier: 'compound',
      compoundRecipeId: 'rebook_and_pay',
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams: buildRebookAndPayCompoundStepParams(fixture),
      noLlm: true,
      ...(isCompoundPrompt(fixture.prompt) ? {} : { routeTier: 'compound' }),
    },
  };
}

export const AI_COMMAND_EVAL_REBOOK_AND_PAY_COMPOUND_CASES: AiCommandEvalCase[] =
  REBOOK_AND_PAY_COMPOUND_PROMPTS.map(rebookAndPayScenarioToEvalCase);

export const AI_COMMAND_EVAL_REBOOK_AND_PAY_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  REBOOK_AND_PAY_MULTILINGUAL_SCENARIOS.map(rebookAndPayScenarioToEvalCase);

export const AI_COMMAND_EVAL_REBOOK_AND_PAY_RESCUE_CASES: AiCommandEvalCase[] =
  REBOOK_AND_PAY_COMPOUND_PROMPTS.slice(0, 4).map((fixture) => ({
    id: `rebook-and-pay-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: 'customer',
    expect: {
      routeTier: 'compound',
      rescueReason: 'rebook_and_pay_compound',
      compoundRecipeId: 'rebook_and_pay',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
