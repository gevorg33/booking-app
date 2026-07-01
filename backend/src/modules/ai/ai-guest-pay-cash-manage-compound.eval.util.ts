import {
  GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS,
  GUEST_PAY_CASH_MANAGE_RESCUE_SCENARIOS,
  type GuestPayCashManageCompoundFixture,
} from './ai-guest-pay-cash-manage-compound.fixtures.js';
import { GUEST_PAY_CASH_MANAGE_MULTILINGUAL_SCENARIOS } from './ai-guest-pay-cash-manage-compound-multilingual.fixtures.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildGuestPayCashManageCompoundStepParams(
  fixture: Pick<GuestPayCashManageCompoundFixture, 'expectedParams'>,
): AiCommandEvalExpectation['compoundStepParams'] {
  const partial: Record<string, unknown> = {
    guestPayCashManage: true,
    guestCheckout: true,
    guestLookup: true,
    paymentMethod: 'cash',
    ...(fixture.expectedParams ?? {}),
  };

  return [
    {
      stepIndex: 0,
      paramsPartial: {
        ...partial,
        bookingFirstAvailable: partial.bookingFirstAvailable ?? true,
      },
    },
    {
      stepIndex: 1,
      paramsPartial: { ...partial, continueAfterGuestBook: true },
    },
    {
      stepIndex: 2,
      paramsPartial: { ...partial, continueAfterCashPayment: true },
    },
  ];
}

export function guestPayCashManageScenarioToEvalCase(
  fixture: GuestPayCashManageCompoundFixture,
  locale: 'en' | 'hy' | 'ru' = 'en',
): AiCommandEvalCase {
  return {
    id: `guest-pay-cash-manage-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale,
    expect: {
      routeTier: 'compound',
      compoundRecipeId: 'guest_pay_cash_manage',
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams: buildGuestPayCashManageCompoundStepParams(fixture),
      noLlm: true,
    },
  };
}

export const AI_COMMAND_EVAL_GUEST_PAY_CASH_MANAGE_COMPOUND_CASES: AiCommandEvalCase[] =
  GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS.map((fixture) =>
    guestPayCashManageScenarioToEvalCase(fixture),
  );

export const AI_COMMAND_EVAL_GUEST_PAY_CASH_MANAGE_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  GUEST_PAY_CASH_MANAGE_MULTILINGUAL_SCENARIOS.map((fixture) =>
    guestPayCashManageScenarioToEvalCase(fixture, fixture.locale),
  );

export const AI_COMMAND_EVAL_GUEST_PAY_CASH_MANAGE_RESCUE_CASES: AiCommandEvalCase[] =
  GUEST_PAY_CASH_MANAGE_RESCUE_SCENARIOS.map((fixture) => ({
    id: `guest-pay-cash-manage-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale: 'en' as const,
    expect: {
      routeTier: 'compound',
      rescueReason: 'guest_pay_cash_manage_compound',
      compoundRecipeId: 'guest_pay_cash_manage',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
