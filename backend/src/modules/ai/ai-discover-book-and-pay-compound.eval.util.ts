import {
  DISCOVER_BOOK_AND_PAY_COMPOUND_PROMPTS,
  type DiscoverBookAndPayCompoundFixture,
} from './ai-discover-book-and-pay-compound.fixtures.js';
import { DISCOVER_BOOK_AND_PAY_MULTILINGUAL_SCENARIOS } from './ai-discover-book-and-pay-compound-multilingual.fixtures.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildDiscoverBookAndPayCompoundStepParams(
  fixture: Pick<
    DiscoverBookAndPayCompoundFixture,
    'expectedParams' | 'paymentAction'
  >,
): AiCommandEvalExpectation['compoundStepParams'] {
  const stepParams: NonNullable<
    AiCommandEvalExpectation['compoundStepParams']
  > = [];

  if (fixture.expectedParams?.maxPrice) {
    stepParams.push({
      stepIndex: 0,
      paramsPartial: { maxPrice: fixture.expectedParams.maxPrice },
    });
  }
  if (fixture.expectedParams?.serviceCategory) {
    stepParams.push({
      stepIndex: 0,
      paramsPartial: {
        serviceCategory: fixture.expectedParams.serviceCategory,
      },
    });
  }
  if (fixture.paymentAction) {
    stepParams.push({
      stepIndex: 3,
      paramsPartial:
        fixture.paymentAction === 'pay_online'
          ? { paymentMethod: 'online' }
          : {},
    });
  }

  return stepParams.length > 0 ? stepParams : undefined;
}

export function discoverBookAndPayScenarioToEvalCase(
  fixture: DiscoverBookAndPayCompoundFixture,
): AiCommandEvalCase {
  const recipeId =
    fixture.surface === 'public'
      ? 'public_discover_book_and_pay'
      : 'discover_book_and_pay';

  return {
    id: `discover-book-pay-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    expect: {
      routeTier: 'compound',
      compoundRecipeId: recipeId,
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams: buildDiscoverBookAndPayCompoundStepParams(fixture),
      noLlm: true,
      ...(isCompoundPrompt(fixture.prompt) ? {} : { routeTier: 'compound' }),
    },
  };
}

export const AI_COMMAND_EVAL_DISCOVER_BOOK_AND_PAY_COMPOUND_CASES: AiCommandEvalCase[] =
  DISCOVER_BOOK_AND_PAY_COMPOUND_PROMPTS.map(
    discoverBookAndPayScenarioToEvalCase,
  );

export const AI_COMMAND_EVAL_DISCOVER_BOOK_AND_PAY_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  DISCOVER_BOOK_AND_PAY_MULTILINGUAL_SCENARIOS.map(
    discoverBookAndPayScenarioToEvalCase,
  );

export const AI_COMMAND_EVAL_DISCOVER_BOOK_AND_PAY_RESCUE_CASES: AiCommandEvalCase[] =
  DISCOVER_BOOK_AND_PAY_COMPOUND_PROMPTS.slice(0, 4).map((fixture) => ({
    id: `discover-book-pay-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    expect: {
      routeTier: 'compound',
      rescueReason: 'discover_book_and_pay_compound',
      compoundRecipeId:
        fixture.surface === 'public'
          ? 'public_discover_book_and_pay'
          : 'discover_book_and_pay',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
