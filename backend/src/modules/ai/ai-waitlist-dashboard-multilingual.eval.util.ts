import {
  WAITLIST_DASHBOARD_MULTILINGUAL_SCENARIOS,
  type WaitlistDashboardMultilingualScenario,
} from './ai-waitlist-dashboard-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function waitlistDashboardMultilingualEvalCaseId(
  scenario: Pick<WaitlistDashboardMultilingualScenario, 'id'>,
): string {
  return `waitlist-dashboard-i18n-${scenario.id}`;
}

export function waitlistDashboardMultilingualScenarioToEvalCase(
  scenario: WaitlistDashboardMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: waitlistDashboardMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'dashboard',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      needsMultilingual: true,
      ...(scenario.paramsPartial
        ? { paramsPartial: scenario.paramsPartial }
        : {}),
    },
  };
}

export const AI_COMMAND_EVAL_WAITLIST_DASHBOARD_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  WAITLIST_DASHBOARD_MULTILINGUAL_SCENARIOS.map(
    waitlistDashboardMultilingualScenarioToEvalCase,
  );
