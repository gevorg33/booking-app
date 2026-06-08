import {
  N99_CLARIFY_FOLLOWUP_SCENARIOS,
} from '../ai-n99-clarify-success.fixtures.js';
import type { AiCommandEvalCase } from './ai-command-eval.types.js';

function resolveExpectSecondTurnSuccess(
  scenario: (typeof N99_CLARIFY_FOLLOWUP_SCENARIOS)[number],
): boolean | undefined {
  if ('expectSecondTurnSuccess' in scenario) {
    return scenario.expectSecondTurnSuccess;
  }
  if (
    'expectInlineValid' in scenario &&
    (scenario as { expectInlineValid?: boolean }).expectInlineValid === false
  ) {
    return false;
  }
  if ('followUpPrompt' in scenario && scenario.followUpPrompt) {
    return true;
  }
  return undefined;
}

export function n99ClarifyFollowupScenarioToEvalCase(
  scenario: (typeof N99_CLARIFY_FOLLOWUP_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-clarify-followup-${scenario.id}`,
    prompt: 'followUpPrompt' in scenario ? scenario.followUpPrompt! : scenario.originalPrompt,
    locale: scenario.id.startsWith('hy-')
      ? 'hy'
      : scenario.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    surface: 'surface' in scenario ? scenario.surface : 'dashboard',
    domain: 'schedule',
    corpus: 'clarify_followup',
    difficulty: 'medium',
    expect: {
      clarifyFollowup: {
        originalPrompt: scenario.originalPrompt,
        followUpPrompt: 'followUpPrompt' in scenario ? scenario.followUpPrompt : undefined,
        originalAction:
          'originalAction' in scenario ? scenario.originalAction : undefined,
        partialParams: 'partialParams' in scenario ? scenario.partialParams : undefined,
        field: 'field' in scenario ? scenario.field : undefined,
        shortlist:
          'shortlist' in scenario ? [...scenario.shortlist] : undefined,
        excludedActions:
          'excludedActions' in scenario
            ? [...((scenario as { excludedActions: string[] }).excludedActions)]
            : undefined,
        expectMergedPrompt:
          'expectMergedPrompt' in scenario ? scenario.expectMergedPrompt : undefined,
        expectNormalizedFollowUp:
          'expectNormalizedFollowUp' in scenario
            ? scenario.expectNormalizedFollowUp
            : undefined,
        expectRestoredAction:
          'expectRestoredAction' in scenario ? scenario.expectRestoredAction : undefined,
        expectInlineValid:
          'expectInlineValid' in scenario ? scenario.expectInlineValid : undefined,
        expectInlineHint:
          'expectInlineHint' in scenario ? scenario.expectInlineHint : undefined,
        expectExecuteImmediately:
          'expectExecuteImmediately' in scenario
            ? scenario.expectExecuteImmediately
            : undefined,
        clarifyCandidates:
          'clarifyCandidates' in scenario
            ? scenario.clarifyCandidates.map((candidate) => ({ ...candidate }))
            : undefined,
        expectSomethingElseCount:
          'expectSomethingElseCount' in scenario
            ? scenario.expectSomethingElseCount
            : undefined,
        expectSecondTurnSuccess: resolveExpectSecondTurnSuccess(scenario),
      },
    },
  };
}

/** n99-1.9 — clarify follow-up golden cases (EN/HY/RU). */
export const AI_COMMAND_EVAL_N99_CLARIFY_FOLLOWUP_CASES: AiCommandEvalCase[] =
  N99_CLARIFY_FOLLOWUP_SCENARIOS.map(n99ClarifyFollowupScenarioToEvalCase);

export const AI_COMMAND_EVAL_CLARIFY_FOLLOWUP_CASES =
  AI_COMMAND_EVAL_N99_CLARIFY_FOLLOWUP_CASES;
