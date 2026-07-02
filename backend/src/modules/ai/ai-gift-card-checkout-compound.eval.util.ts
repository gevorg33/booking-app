import {
  GIFT_CARD_CHECKOUT_COMPOUND_PROMPTS,
  type GiftCardCheckoutCompoundFixture,
} from './ai-gift-card-checkout-compound.fixtures.js';
import { GIFT_CARD_CHECKOUT_MULTILINGUAL_SCENARIOS } from './ai-gift-card-checkout-compound-multilingual.fixtures.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildGiftCardCheckoutCompoundStepParams(
  fixture: Pick<GiftCardCheckoutCompoundFixture, 'expectedParams'>,
): AiCommandEvalExpectation['compoundStepParams'] {
  const stepParams: NonNullable<
    AiCommandEvalExpectation['compoundStepParams']
  > = [];

  if (fixture.expectedParams?.giftCardCode) {
    stepParams.push({
      stepIndex: 0,
      paramsPartial: { giftCardCode: fixture.expectedParams.giftCardCode },
    });
    stepParams.push({
      stepIndex: 1,
      paramsPartial: { giftCardCode: fixture.expectedParams.giftCardCode },
    });
  }
  if (fixture.expectedParams?.serviceName) {
    stepParams.push({
      stepIndex: 2,
      paramsPartial: { serviceName: fixture.expectedParams.serviceName },
    });
  }
  if (fixture.expectedParams?.bookingFirstAvailable) {
    stepParams.push({
      stepIndex: 2,
      paramsPartial: {
        bookingFirstAvailable: fixture.expectedParams.bookingFirstAvailable,
      },
    });
  }

  return stepParams.length > 0 ? stepParams : undefined;
}

export function giftCardCheckoutScenarioToEvalCase(
  fixture: GiftCardCheckoutCompoundFixture,
): AiCommandEvalCase {
  return {
    id: `gift-card-checkout-${fixture.id}`,
    prompt: fixture.prompt,
    surface: 'customer',
    expect: {
      routeTier: 'compound',
      compoundRecipeId: 'gift_card_checkout',
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams: buildGiftCardCheckoutCompoundStepParams(fixture),
      noLlm: true,
      ...(isCompoundPrompt(fixture.prompt) ? {} : { routeTier: 'compound' }),
    },
  };
}

export const AI_COMMAND_EVAL_GIFT_CARD_CHECKOUT_COMPOUND_CASES: AiCommandEvalCase[] =
  GIFT_CARD_CHECKOUT_COMPOUND_PROMPTS.map(giftCardCheckoutScenarioToEvalCase);

export const AI_COMMAND_EVAL_GIFT_CARD_CHECKOUT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  GIFT_CARD_CHECKOUT_MULTILINGUAL_SCENARIOS.map(
    giftCardCheckoutScenarioToEvalCase,
  );

export const AI_COMMAND_EVAL_GIFT_CARD_CHECKOUT_RESCUE_CASES: AiCommandEvalCase[] =
  GIFT_CARD_CHECKOUT_COMPOUND_PROMPTS.slice(0, 4).map((fixture) => ({
    id: `gift-card-checkout-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: 'customer',
    expect: {
      routeTier: 'compound',
      rescueReason: 'gift_card_checkout_compound',
      compoundRecipeId: 'gift_card_checkout',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
