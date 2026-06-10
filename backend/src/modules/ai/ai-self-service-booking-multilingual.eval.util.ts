import {
  SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS,
  type SelfServiceBookingMultilingualScenario,
} from './ai-self-service-booking-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function selfServiceBookingMultilingualEvalCaseId(
  scenarioId: string,
): string {
  return `self-service-i18n-${scenarioId}`;
}

export function selfServiceBookingMultilingualScenarioToEvalCase(
  scenario: SelfServiceBookingMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: selfServiceBookingMultilingualEvalCaseId(scenario.id),
    prompt: scenario.prompt,
    surface: 'customer',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      useSurfaceSelfServiceRescue: true,
      ...(scenario.locale === 'hy' || scenario.locale === 'ru'
        ? { needsMultilingual: true }
        : {}),
    },
  };
}

export const AI_COMMAND_EVAL_SELF_SERVICE_BOOKING_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS.map(
    selfServiceBookingMultilingualScenarioToEvalCase,
  );

export function listSelfServiceBookingLocaleParityGaps(
  scenarios: readonly Pick<SelfServiceBookingMultilingualScenario, 'id'>[] = SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS,
): Array<{ enScenarioId: string; missingLocales: Array<'hy' | 'ru'> }> {
  const byId = new Map(scenarios.map((row) => [row.id, row]));
  const gaps: Array<{ enScenarioId: string; missingLocales: Array<'hy' | 'ru'> }> =
    [];

  for (const row of scenarios) {
    if (!row.id.endsWith('-en')) continue;
    const baseId = row.id.slice(0, -3);
    const missingLocales: Array<'hy' | 'ru'> = [];
    if (!byId.has(`${baseId}-hy`)) missingLocales.push('hy');
    if (!byId.has(`${baseId}-ru`)) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({ enScenarioId: row.id, missingLocales });
  }

  return gaps;
}

export function listSelfServiceBookingEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<SelfServiceBookingMultilingualScenario, 'id'>[] = SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => selfServiceBookingMultilingualEvalCaseId(scenario.id))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
