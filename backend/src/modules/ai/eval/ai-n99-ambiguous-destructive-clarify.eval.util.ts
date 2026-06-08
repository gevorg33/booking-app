import { N99_AMBIGUOUS_DESTRUCTIVE_SCENARIOS } from '../ai-n99-ambiguous-destructive-clarify.fixtures.js';
import type { AiCommandEvalCase } from './ai-command-eval.types.js';

function localeFromScenarioId(id: string): 'en' | 'hy' | 'ru' {
  if (id.includes('-hy-') || id.startsWith('hy-')) return 'hy';
  if (id.includes('-ru-') || id.startsWith('ru-')) return 'ru';
  return 'en';
}

export function n99AmbiguousDestructiveScenarioToEvalCase(
  scenario: (typeof N99_AMBIGUOUS_DESTRUCTIVE_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-guardrail-${scenario.id}`,
    prompt: scenario.prompt,
    locale: localeFromScenarioId(scenario.id),
    surface: scenario.surface ?? 'dashboard',
    domain: 'schedule',
    corpus: 'clarify_followup',
    difficulty: 'medium',
    expect: {
      ambiguousDestructiveClarify: {
        action: scenario.action,
        paramsPartial: scenario.params,
        actionConfidence: scenario.actionConfidence,
        sessionContext: scenario.sessionContext,
        expectBlocked: scenario.expectBlocked,
        expectBlockReason: scenario.expectBlockReason,
        expectClarify: scenario.expectClarify,
        expectCountsTowardClarifySuccess: scenario.expectCountsTowardClarifySuccess,
      },
    },
  };
}

export const AI_COMMAND_EVAL_N99_AMBIGUOUS_DESTRUCTIVE_CASES: AiCommandEvalCase[] =
  N99_AMBIGUOUS_DESTRUCTIVE_SCENARIOS.map(n99AmbiguousDestructiveScenarioToEvalCase);
