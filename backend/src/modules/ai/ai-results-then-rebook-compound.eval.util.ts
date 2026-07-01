import {
  RESULTS_THEN_REBOOK_COMPOUND_PROMPTS,
  RESULTS_THEN_REBOOK_RESCUE_SCENARIOS,
  type ResultsThenRebookCompoundFixture,
} from './ai-results-then-rebook-compound.fixtures.js';
import { RESULTS_THEN_REBOOK_MULTILINGUAL_SCENARIOS } from './ai-results-then-rebook-compound-multilingual.fixtures.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

function buildResultsThenRebookCompoundStepParams(
  fixture: Pick<
    ResultsThenRebookCompoundFixture,
    'status' | 'testName' | 'serviceName'
  >,
): AiCommandEvalExpectation['compoundStepParams'] {
  const partial: Record<string, unknown> = {
    resultsThenRebook: true,
  };
  if (fixture.status) partial.status = fixture.status;
  if (fixture.testName) partial.testName = fixture.testName;
  if (fixture.serviceName) partial.serviceName = fixture.serviceName;

  return [
    { stepIndex: 0, paramsPartial: { ...partial } },
    {
      stepIndex: 1,
      paramsPartial: { ...partial, continueAfterResultExplain: true },
    },
  ];
}

export function resultsThenRebookScenarioToEvalCase(
  fixture: ResultsThenRebookCompoundFixture,
  locale: 'en' | 'hy' | 'ru' = 'en',
): AiCommandEvalCase {
  return {
    id: `results-then-rebook-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale,
    expect: {
      routeTier: 'compound',
      compoundRecipeId: 'results_then_rebook',
      compoundSteps: [...fixture.orderedActions],
      compoundStepParams: buildResultsThenRebookCompoundStepParams(fixture),
      noLlm: true,
    },
  };
}

export const AI_COMMAND_EVAL_RESULTS_THEN_REBOOK_COMPOUND_CASES: AiCommandEvalCase[] =
  RESULTS_THEN_REBOOK_COMPOUND_PROMPTS.map((fixture) =>
    resultsThenRebookScenarioToEvalCase(fixture),
  );

export const AI_COMMAND_EVAL_RESULTS_THEN_REBOOK_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  RESULTS_THEN_REBOOK_MULTILINGUAL_SCENARIOS.map((fixture) =>
    resultsThenRebookScenarioToEvalCase(fixture, fixture.locale),
  );

export const AI_COMMAND_EVAL_RESULTS_THEN_REBOOK_RESCUE_CASES: AiCommandEvalCase[] =
  RESULTS_THEN_REBOOK_RESCUE_SCENARIOS.map((fixture) => ({
    id: `results-then-rebook-rescue-${fixture.id}`,
    prompt: fixture.prompt,
    surface: fixture.surface,
    locale: 'en' as const,
    expect: {
      routeTier: 'compound',
      rescueReason: 'results_then_rebook_compound',
      compoundRecipeId: 'results_then_rebook',
      compoundSteps: [...fixture.orderedActions],
      noLlm: true,
    },
  }));
