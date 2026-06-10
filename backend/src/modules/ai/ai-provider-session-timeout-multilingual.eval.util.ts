import {
  PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_SCENARIOS,
  type ProviderSessionTimeoutMultilingualScenario,
} from './ai-provider-session-timeout-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function providerSessionTimeoutMultilingualEvalCaseId(
  scenario: Pick<ProviderSessionTimeoutMultilingualScenario, 'id'>,
): string {
  return `provider-session-timeout-i18n-${scenario.id}`;
}

export function providerSessionTimeoutMultilingualScenarioToEvalCase(
  scenario: ProviderSessionTimeoutMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: providerSessionTimeoutMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'provider',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      needsMultilingual: true,
    },
  };
}

export const AI_COMMAND_EVAL_PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_SCENARIOS.map(
    providerSessionTimeoutMultilingualScenarioToEvalCase,
  );

export function listProviderSessionTimeoutEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<
    ProviderSessionTimeoutMultilingualScenario,
    'id'
  >[] = PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => providerSessionTimeoutMultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
