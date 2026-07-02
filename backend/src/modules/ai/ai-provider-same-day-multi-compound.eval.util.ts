import {
  PROVIDER_SAME_DAY_MULTI_COMPOUND_PROMPTS,
  PROVIDER_SAME_DAY_MULTI_RESCUE_SCENARIOS,
  type ProviderSameDayMultiCompoundFixture,
} from './ai-provider-same-day-multi-compound.fixtures.js';
import { PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_SCENARIOS } from './ai-provider-same-day-multi-compound-multilingual.fixtures.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildProviderSameDayMultiCompoundStepParams(
  fixture: Pick<
    ProviderSameDayMultiCompoundFixture,
    'providerName' | 'serviceNames' | 'timeOfDay'
  >,
): AiCommandEvalExpectation['compoundStepParams'] {
  const partial: Record<string, unknown> = {
    providerSameDayMulti: true,
    mode: 'named_provider',
  };
  if (fixture.providerName) {
    partial.providerName = fixture.providerName;
    partial.employeeName = fixture.providerName;
  }
  if (fixture.serviceNames?.length) partial.serviceNames = fixture.serviceNames;
  if (fixture.timeOfDay) partial.timeOfDay = fixture.timeOfDay;

  return [
    { stepIndex: 0, paramsPartial: partial },
    {
      stepIndex: 1,
      paramsPartial: { ...partial, continueAfterProviderPick: true },
    },
    {
      stepIndex: 2,
      paramsPartial: { ...partial, continueAfterProviderPick: true },
    },
  ];
}

export function providerSameDayMultiScenarioToEvalCase(
  fixture: ProviderSameDayMultiCompoundFixture,
  locale: 'en' | 'hy' | 'ru' = 'en',
): AiCommandEvalCase {
  return {
    id: `provider-same-day-multi-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale,
    expect: {
      routeTier: 'compound',
      compoundRecipeId: 'provider_same_day_multi',
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams: buildProviderSameDayMultiCompoundStepParams(fixture),
      noLlm: true,
    },
  };
}

export const AI_COMMAND_EVAL_PROVIDER_SAME_DAY_MULTI_COMPOUND_CASES: AiCommandEvalCase[] =
  PROVIDER_SAME_DAY_MULTI_COMPOUND_PROMPTS.map((fixture) =>
    providerSameDayMultiScenarioToEvalCase(fixture),
  );

export const AI_COMMAND_EVAL_PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_SCENARIOS.map((fixture) =>
    providerSameDayMultiScenarioToEvalCase(fixture, fixture.locale),
  );

export const AI_COMMAND_EVAL_PROVIDER_SAME_DAY_MULTI_RESCUE_CASES: AiCommandEvalCase[] =
  PROVIDER_SAME_DAY_MULTI_RESCUE_SCENARIOS.map((fixture) => ({
    id: `provider-same-day-multi-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale: 'en' as const,
    expect: {
      routeTier: 'compound',
      rescueReason: 'provider_same_day_multi_compound',
      compoundRecipeId: 'provider_same_day_multi',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
