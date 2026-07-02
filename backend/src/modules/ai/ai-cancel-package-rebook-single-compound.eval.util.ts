import {
  CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS,
  CANCEL_PACKAGE_REBOOK_SINGLE_RESCUE_SCENARIOS,
  type CancelPackageRebookSingleCompoundFixture,
} from './ai-cancel-package-rebook-single-compound.fixtures.js';
import { CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_SCENARIOS } from './ai-cancel-package-rebook-single-compound-multilingual.fixtures.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildCancelPackageRebookSingleCompoundStepParams(
  fixture: Pick<CancelPackageRebookSingleCompoundFixture, 'expectedParams'>,
): AiCommandEvalExpectation['compoundStepParams'] {
  const partial: Record<string, unknown> = {
    cancelPackageRebookSingle: true,
    ...(fixture.expectedParams ?? {}),
  };

  return [
    {
      stepIndex: 0,
      paramsPartial: partial,
    },
    {
      stepIndex: 1,
      paramsPartial: {
        ...partial,
        continueAfterPackageCancel: true,
        singleServiceBooking: true,
      },
    },
  ];
}

export function cancelPackageRebookSingleScenarioToEvalCase(
  fixture: CancelPackageRebookSingleCompoundFixture,
  locale: 'en' | 'hy' | 'ru' = 'en',
): AiCommandEvalCase {
  return {
    id: `cancel-package-rebook-single-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale,
    expect: {
      routeTier: 'compound',
      compoundRecipeId: 'cancel_package_rebook_single',
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams:
        buildCancelPackageRebookSingleCompoundStepParams(fixture),
      noLlm: true,
    },
  };
}

export const AI_COMMAND_EVAL_CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_CASES: AiCommandEvalCase[] =
  CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS.map((fixture) =>
    cancelPackageRebookSingleScenarioToEvalCase(fixture),
  );

export const AI_COMMAND_EVAL_CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_SCENARIOS.map((fixture) =>
    cancelPackageRebookSingleScenarioToEvalCase(fixture, fixture.locale),
  );

export const AI_COMMAND_EVAL_CANCEL_PACKAGE_REBOOK_SINGLE_RESCUE_CASES: AiCommandEvalCase[] =
  CANCEL_PACKAGE_REBOOK_SINGLE_RESCUE_SCENARIOS.map((fixture) => ({
    id: `cancel-package-rebook-single-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale: 'en' as const,
    expect: {
      routeTier: 'compound',
      rescueReason: 'cancel_package_rebook_single_compound',
      compoundRecipeId: 'cancel_package_rebook_single',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
