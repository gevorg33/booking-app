import {
  BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS,
  type BudgetDiscoverAndBookMultilingualScenario,
} from './ai-budget-discover-and-book-compound-multilingual.fixtures.js';
import { needsMultilingualNormalization } from './ai-prompt-i18n.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';

export function budgetDiscoverAndBookMultilingualEvalCaseId(
  scenario: Pick<BudgetDiscoverAndBookMultilingualScenario, 'id'>,
): string {
  return `budget-discover-book-i18n-${scenario.id}`;
}

function buildBudgetDiscoverAndBookCompoundStepParams(
  expectedParams?: Record<string, unknown>,
): AiCommandEvalExpectation['compoundStepParams'] {
  if (!expectedParams) return undefined;

  const stepParams: NonNullable<
    AiCommandEvalExpectation['compoundStepParams']
  > = [];

  if (expectedParams.maxPrice || expectedParams.serviceCategory) {
    stepParams.push({
      stepIndex: 0,
      paramsPartial: {
        ...(expectedParams.maxPrice
          ? { maxPrice: expectedParams.maxPrice }
          : {}),
        ...(expectedParams.serviceCategory
          ? { serviceCategory: expectedParams.serviceCategory }
          : {}),
      },
    });
  }
  if (expectedParams.maxPrice || expectedParams.timeOfDay) {
    stepParams.push({
      stepIndex: 1,
      paramsPartial: {
        ...(expectedParams.maxPrice
          ? { maxPrice: expectedParams.maxPrice }
          : {}),
        ...(expectedParams.timeOfDay
          ? { timeOfDay: expectedParams.timeOfDay }
          : {}),
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

export function budgetDiscoverAndBookMultilingualScenarioToEvalCase(
  scenario: BudgetDiscoverAndBookMultilingualScenario,
): AiCommandEvalCase {
  const compoundStepParams = buildBudgetDiscoverAndBookCompoundStepParams(
    scenario.paramsPartial,
  );
  const needsMultilingual = needsMultilingualNormalization(scenario.prompt);

  return {
    id: budgetDiscoverAndBookMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'dashboard',
    locale: scenario.locale,
    expect: {
      ...(isCompoundPrompt(scenario.prompt)
        ? { routeTier: 'compound' as const }
        : {}),
      compoundSurface: 'dashboard',
      compoundSteps: [...scenario.orderedActions],
      compoundRecipeId: 'budget_discover_and_book',
      compoundSource: 'golden',
      ...(needsMultilingual ? { needsMultilingual: true } : {}),
      ...(compoundStepParams ? { compoundStepParams } : {}),
    },
  };
}

export const AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS.map(
    budgetDiscoverAndBookMultilingualScenarioToEvalCase,
  );
