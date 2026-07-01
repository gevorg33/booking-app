import {
  GUEST_BOOK_AND_MANAGE_COMPOUND_PROMPTS,
  type GuestBookAndManageCompoundFixture,
} from './ai-guest-book-and-manage-compound.fixtures.js';
import { GUEST_BOOK_AND_MANAGE_MULTILINGUAL_SCENARIOS } from './ai-guest-book-and-manage-compound-multilingual.fixtures.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildGuestBookAndManageCompoundStepParams(
  fixture: Pick<GuestBookAndManageCompoundFixture, 'expectedParams'>,
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
  if (fixture.expectedParams?.guestCheckout) {
    stepParams.push({
      stepIndex: 0,
      paramsPartial: { guestCheckout: true },
    });
  }
  if (fixture.expectedParams?.email) {
    stepParams.push({
      stepIndex: 1,
      paramsPartial: { email: fixture.expectedParams.email },
    });
  }
  if (fixture.expectedParams?.delivery) {
    stepParams.push({
      stepIndex: 1,
      paramsPartial: { delivery: fixture.expectedParams.delivery },
    });
  }

  return stepParams.length > 0 ? stepParams : undefined;
}

export function guestBookAndManageScenarioToEvalCase(
  fixture: GuestBookAndManageCompoundFixture,
): AiCommandEvalCase {
  return {
    id: `guest-book-and-manage-${fixture.id}`,
    prompt: fixture.prompt,
    surface: 'customer',
    expect: {
      routeTier: 'compound',
      compoundRecipeId: 'guest_book_and_manage',
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams: buildGuestBookAndManageCompoundStepParams(fixture),
      noLlm: true,
      ...(isCompoundPrompt(fixture.prompt) ? {} : { routeTier: 'compound' }),
    },
  };
}

export const AI_COMMAND_EVAL_GUEST_BOOK_AND_MANAGE_COMPOUND_CASES: AiCommandEvalCase[] =
  GUEST_BOOK_AND_MANAGE_COMPOUND_PROMPTS.map(
    guestBookAndManageScenarioToEvalCase,
  );

export const AI_COMMAND_EVAL_GUEST_BOOK_AND_MANAGE_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  GUEST_BOOK_AND_MANAGE_MULTILINGUAL_SCENARIOS.map(
    guestBookAndManageScenarioToEvalCase,
  );

export const AI_COMMAND_EVAL_GUEST_BOOK_AND_MANAGE_RESCUE_CASES: AiCommandEvalCase[] =
  GUEST_BOOK_AND_MANAGE_COMPOUND_PROMPTS.slice(0, 4).map((fixture) => ({
    id: `guest-book-and-manage-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: 'customer',
    expect: {
      routeTier: 'compound',
      rescueReason: 'guest_book_and_manage_compound',
      compoundRecipeId: 'guest_book_and_manage',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
