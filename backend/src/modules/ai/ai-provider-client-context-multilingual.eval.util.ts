import {
  PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS,
  type ProviderClientContextMultilingualScenario,
} from './ai-provider-client-context-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function providerClientContextMultilingualEvalCaseId(
  scenario: Pick<ProviderClientContextMultilingualScenario, 'id'>,
): string {
  return `provider-client-context-i18n-${scenario.id}`;
}

export function providerClientContextMultilingualScenarioToEvalCase(
  scenario: ProviderClientContextMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: providerClientContextMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'provider',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      needsMultilingual: true,
      ...(scenario.paramsPartial ? { paramsPartial: scenario.paramsPartial } : {}),
    },
  };
}

export const AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS.map(
    providerClientContextMultilingualScenarioToEvalCase,
  );

export function listProviderClientContextEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<ProviderClientContextMultilingualScenario, 'id'>[] = PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => providerClientContextMultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
