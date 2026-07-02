import {
  TOUR_GROUP_CHECKOUT_COMPOUND_PROMPTS,
  TOUR_GROUP_CHECKOUT_RESCUE_SCENARIOS,
  type TourGroupCheckoutCompoundFixture,
} from './ai-tour-group-checkout-compound.fixtures.js';
import { TOUR_GROUP_CHECKOUT_MULTILINGUAL_SCENARIOS } from './ai-tour-group-checkout-compound-multilingual.fixtures.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildTourGroupCheckoutCompoundStepParams(
  fixture: Pick<TourGroupCheckoutCompoundFixture, 'serviceName' | 'paxCount'>,
): AiCommandEvalExpectation['compoundStepParams'] {
  const stepParams: NonNullable<
    AiCommandEvalExpectation['compoundStepParams']
  > = [];

  const partial: Record<string, unknown> = {
    tourGroupCheckout: true,
    bookIfCapacityOk: true,
  };
  if (fixture.serviceName) partial.serviceName = fixture.serviceName;
  if (fixture.paxCount != null) {
    partial.paxCount = fixture.paxCount;
    partial.requestedPax = fixture.paxCount;
  }

  stepParams.push({
    stepIndex: 0,
    paramsPartial: { ...partial, aspect: 'groupSize' },
  });
  stepParams.push({
    stepIndex: 1,
    paramsPartial: { ...partial, aspect: 'all' },
  });
  stepParams.push({
    stepIndex: 2,
    paramsPartial: { ...partial, continueAfterCapacityCheck: true },
  });

  return stepParams;
}

export function tourGroupCheckoutScenarioToEvalCase(
  fixture: TourGroupCheckoutCompoundFixture,
  locale: 'en' | 'hy' | 'ru' = 'en',
): AiCommandEvalCase {
  const recipeId =
    fixture.surface === 'public'
      ? 'public_tour_group_checkout'
      : 'tour_group_checkout';

  return {
    id: `tour-group-checkout-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale,
    expect: {
      routeTier: 'compound',
      compoundRecipeId: recipeId,
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams: buildTourGroupCheckoutCompoundStepParams(fixture),
      noLlm: true,
    },
  };
}

export const AI_COMMAND_EVAL_TOUR_GROUP_CHECKOUT_COMPOUND_CASES: AiCommandEvalCase[] =
  TOUR_GROUP_CHECKOUT_COMPOUND_PROMPTS.map((fixture) =>
    tourGroupCheckoutScenarioToEvalCase(fixture),
  );

export const AI_COMMAND_EVAL_TOUR_GROUP_CHECKOUT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  TOUR_GROUP_CHECKOUT_MULTILINGUAL_SCENARIOS.map((fixture) =>
    tourGroupCheckoutScenarioToEvalCase(fixture, fixture.locale),
  );

export const AI_COMMAND_EVAL_TOUR_GROUP_CHECKOUT_RESCUE_CASES: AiCommandEvalCase[] =
  TOUR_GROUP_CHECKOUT_RESCUE_SCENARIOS.map((fixture) => ({
    id: `tour-group-checkout-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale: 'en' as const,
    expect: {
      routeTier: 'compound',
      rescueReason: 'tour_group_checkout_compound',
      compoundRecipeId:
        fixture.surface === 'public'
          ? 'public_tour_group_checkout'
          : 'tour_group_checkout',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
