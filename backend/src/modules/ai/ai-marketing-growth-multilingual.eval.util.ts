import {
  MARKETING_GROWTH_MULTILINGUAL_SCENARIOS,
  type MarketingGrowthMultilingualScenario,
} from './ai-marketing-growth-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function marketingGrowthMultilingualEvalCaseId(
  scenarioId: string,
): string {
  return `marketing-growth-i18n-${scenarioId}`;
}

export function marketingGrowthMultilingualScenarioToEvalCase(
  scenario: MarketingGrowthMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: marketingGrowthMultilingualEvalCaseId(scenario.id),
    prompt: scenario.prompt,
    surface: 'customer',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      useSurfaceMarketingGrowthRescue: true,
      ...(scenario.locale === 'hy' || scenario.locale === 'ru'
        ? { needsMultilingual: true }
        : {}),
    },
  };
}

export const AI_COMMAND_EVAL_MARKETING_GROWTH_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MARKETING_GROWTH_MULTILINGUAL_SCENARIOS.map(
    marketingGrowthMultilingualScenarioToEvalCase,
  );

export function listMarketingGrowthEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<MarketingGrowthMultilingualScenario, 'id'>[] = MARKETING_GROWTH_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => marketingGrowthMultilingualEvalCaseId(scenario.id))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
