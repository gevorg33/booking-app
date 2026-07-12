import {
  PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_SCENARIOS,
  type ProviderShowAppointmentsMultilingualScenario,
} from './ai-provider-show-appointments-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function providerShowAppointmentsMultilingualEvalCaseId(
  scenario: Pick<ProviderShowAppointmentsMultilingualScenario, 'id'>,
): string {
  return `provider-show-appointments-i18n-${scenario.id}`;
}

export function providerShowAppointmentsMultilingualScenarioToEvalCase(
  scenario: ProviderShowAppointmentsMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: providerShowAppointmentsMultilingualEvalCaseId(scenario),
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

export const AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_SCENARIOS.map(
    providerShowAppointmentsMultilingualScenarioToEvalCase,
  );

export function listProviderShowAppointmentsEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<
    ProviderShowAppointmentsMultilingualScenario,
    'id'
  >[] = PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => providerShowAppointmentsMultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
