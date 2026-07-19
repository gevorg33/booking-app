import {
  INTAKE_LAB_BOOK_PAY_COMPOUND_PROMPTS,
  INTAKE_LAB_BOOK_PAY_RESCUE_SCENARIOS,
  type IntakeLabBookPayCompoundFixture,
} from './ai-intake-lab-book-pay-compound.fixtures.js';
import { INTAKE_LAB_BOOK_PAY_MULTILINGUAL_SCENARIOS } from './ai-intake-lab-book-pay-compound-multilingual.fixtures.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildIntakeLabBookPayCompoundStepParams(
  fixture: Pick<
    IntakeLabBookPayCompoundFixture,
    'serviceName' | 'paymentAction'
  >,
): AiCommandEvalExpectation['compoundStepParams'] {
  const stepParams: NonNullable<
    AiCommandEvalExpectation['compoundStepParams']
  > = [];

  if (fixture.serviceName) {
    stepParams.push({
      stepIndex: 0,
      paramsPartial: {
        preVisitIntakeRequired: true,
        serviceName: fixture.serviceName,
      },
    });
  } else {
    stepParams.push({
      stepIndex: 0,
      paramsPartial: { preVisitIntakeRequired: true },
    });
  }

  if (fixture.paymentAction === 'pay_online') {
    stepParams.push({
      stepIndex: 2,
      paramsPartial: { paymentMethod: 'online' },
    });
  } else if (fixture.paymentAction === 'pay_cash_at_visit') {
    stepParams.push({
      stepIndex: 2,
      paramsPartial: { paymentMethod: 'cash' },
    });
  }

  return stepParams;
}

export function intakeLabBookPayScenarioToEvalCase(
  fixture: IntakeLabBookPayCompoundFixture,
  locale: 'en' | 'hy' | 'ru' = 'en',
): AiCommandEvalCase {
  const recipeId =
    fixture.surface === 'public'
      ? 'public_intake_lab_book_pay'
      : 'intake_lab_book_pay';

  return {
    id: `intake-lab-book-pay-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale,
    expect: {
      routeTier: 'compound',
      compoundRecipeId: recipeId,
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams: buildIntakeLabBookPayCompoundStepParams(fixture),
      noLlm: true,
    },
  };
}

export const AI_COMMAND_EVAL_INTAKE_LAB_BOOK_PAY_COMPOUND_CASES: AiCommandEvalCase[] =
  INTAKE_LAB_BOOK_PAY_COMPOUND_PROMPTS.map((fixture) =>
    intakeLabBookPayScenarioToEvalCase(fixture),
  );

export const AI_COMMAND_EVAL_INTAKE_LAB_BOOK_PAY_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  INTAKE_LAB_BOOK_PAY_MULTILINGUAL_SCENARIOS.map((fixture) =>
    intakeLabBookPayScenarioToEvalCase(fixture, fixture.locale),
  );

export const AI_COMMAND_EVAL_INTAKE_LAB_BOOK_PAY_RESCUE_CASES: AiCommandEvalCase[] =
  INTAKE_LAB_BOOK_PAY_RESCUE_SCENARIOS.map((fixture) => ({
    id: `intake-lab-book-pay-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale: 'en' as const,
    expect: {
      routeTier: 'compound',
      rescueReason: 'intake_lab_book_pay_compound',
      compoundRecipeId:
        fixture.surface === 'public'
          ? 'public_intake_lab_book_pay'
          : 'intake_lab_book_pay',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
