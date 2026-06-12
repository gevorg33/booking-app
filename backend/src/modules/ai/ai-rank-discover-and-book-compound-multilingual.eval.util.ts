import {
  RANK_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS,
  type RankDiscoverAndBookMultilingualScenario,
} from './ai-rank-discover-and-book-compound-multilingual.fixtures.js';
import { needsMultilingualNormalization } from './ai-prompt-i18n.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

export function rankDiscoverAndBookMultilingualEvalCaseId(
  scenario: Pick<RankDiscoverAndBookMultilingualScenario, 'id'>,
): string {
  return `rank-discover-book-i18n-${scenario.id}`;
}

function buildRankDiscoverAndBookCompoundStepParams(
  expectedParams?: Record<string, unknown>,
): AiCommandEvalExpectation['compoundStepParams'] {
  if (!expectedParams) return undefined;

  const stepParams: NonNullable<
    AiCommandEvalExpectation['compoundStepParams']
  > = [];

  if (expectedParams.serviceRank || expectedParams.serviceCategory) {
    stepParams.push({
      stepIndex: 0,
      paramsPartial: {
        ...(expectedParams.serviceRank
          ? { serviceRank: expectedParams.serviceRank }
          : {}),
        ...(expectedParams.serviceCategory
          ? { serviceCategory: expectedParams.serviceCategory }
          : {}),
      },
    });
  }
  if (expectedParams.timeOfDay) {
    stepParams.push({
      stepIndex: 1,
      paramsPartial: {
        timeOfDay: expectedParams.timeOfDay,
      },
    });
  }
  if (typeof expectedParams.bookingFirstAvailable === 'boolean') {
    stepParams.push({
      stepIndex: 2,
      paramsPartial: {
        bookingFirstAvailable: expectedParams.bookingFirstAvailable,
      },
    });
  }

  return stepParams.length > 0 ? stepParams : undefined;
}

export function rankDiscoverAndBookMultilingualScenarioToEvalCase(
  scenario: RankDiscoverAndBookMultilingualScenario,
): AiCommandEvalCase {
  const compoundStepParams = buildRankDiscoverAndBookCompoundStepParams(
    scenario.paramsPartial,
  );
  const needsMultilingual = needsMultilingualNormalization(scenario.prompt);

  return {
    id: rankDiscoverAndBookMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'dashboard',
    locale: scenario.locale,
    expect: {
      ...(isCompoundPrompt(scenario.prompt)
        ? { routeTier: 'compound' as const }
        : {}),
      compoundSurface: 'dashboard',
      compoundSteps: [...scenario.orderedActions],
      compoundRecipeId: 'rank_discover_and_book',
      compoundSource: 'golden',
      ...(needsMultilingual ? { needsMultilingual: true } : {}),
      ...(compoundStepParams ? { compoundStepParams } : {}),
    },
  };
}

export const AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  RANK_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS.map(
    rankDiscoverAndBookMultilingualScenarioToEvalCase,
  );
