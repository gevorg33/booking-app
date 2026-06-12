import {
  TEAM_WIDE_AVAILABILITY_SEMANTIC_SCENARIOS,
  type TeamWideAvailabilitySemanticScenario,
} from './team-wide-availability.semantic.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function teamWideAvailabilitySemanticEvalCaseId(
  scenario: Pick<TeamWideAvailabilitySemanticScenario, 'id'>,
): string {
  return `team-wide-availability-semantic-${scenario.id}`;
}

export function teamWideAvailabilityScenarioToEvalCase(
  scenario: TeamWideAvailabilitySemanticScenario,
): AiCommandEvalCase {
  return {
    id: teamWideAvailabilitySemanticEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: scenario.surface ?? 'dashboard',
    expect: {
      useTeamWideAvailabilitySemanticDetect: true,
      teamWideAvailabilitySemantic: scenario.mustDetect,
    },
  };
}

export const AI_COMMAND_EVAL_TEAM_WIDE_AVAILABILITY_SEMANTIC_CASES: AiCommandEvalCase[] =
  TEAM_WIDE_AVAILABILITY_SEMANTIC_SCENARIOS.map(
    teamWideAvailabilityScenarioToEvalCase,
  );
