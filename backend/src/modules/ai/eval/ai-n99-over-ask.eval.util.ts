import { N99_NO_CLARIFY_OVER_ASK_SCENARIOS } from '../ai-n99-over-ask.fixtures.js';
import type { AiCommandEvalCase } from './ai-command-eval.types.js';

export function n99OverAskScenarioToEvalCase(
  scenario: (typeof N99_NO_CLARIFY_OVER_ASK_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-over-ask-${scenario.id}`,
    prompt: scenario.prompt ?? 'fill from context',
    locale: scenario.id.includes('-hy-') ? 'hy' : 'en',
    surface: scenario.surface ?? 'dashboard',
    domain: 'schedule',
    corpus: 'no_clarify',
    difficulty: 'easy',
    expect: {
      noClarifyCompletion: {
        action: scenario.action,
        paramsPartial: scenario.params,
        screenContext: scenario.screenContext,
        sessionContext: scenario.sessionContext,
        validationIssues: [...scenario.issues],
        expectTrimmedFields: [...scenario.expectTrimmedFields],
      },
    },
  };
}

export const AI_COMMAND_EVAL_N99_OVER_ASK_CASES: AiCommandEvalCase[] =
  N99_NO_CLARIFY_OVER_ASK_SCENARIOS.map(n99OverAskScenarioToEvalCase);
