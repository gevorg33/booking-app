import { N99_FEWSHOT_RETRIEVAL_SCENARIOS } from '../ai-n99-fewshot-retrieval.fixtures.js';
import type { AiCommandEvalCase } from './ai-command-eval.types.js';

function localeFromScenarioId(id: string): 'en' | 'hy' | 'ru' {
  if (id.includes('-hy-') || id.startsWith('hy-')) return 'hy';
  if (id.includes('-ru-') || id.startsWith('ru-')) return 'ru';
  return 'en';
}

export function n99FewShotRetrievalScenarioToEvalCase(
  scenario: (typeof N99_FEWSHOT_RETRIEVAL_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-fewshot-${scenario.id}`,
    prompt: scenario.prompt,
    locale: localeFromScenarioId(scenario.id),
    surface: scenario.surface,
    domain: 'operations',
    corpus: 'golden',
    difficulty: 'medium',
    expect: {
      fewShotRetrieval: {
        expectedAction: scenario.expectedAction,
        minCount: scenario.minCount ?? 1,
        rarePhrasing: scenario.rarePhrasing,
      },
    },
  };
}

export const AI_COMMAND_EVAL_N99_FEWSHOT_RETRIEVAL_CASES: AiCommandEvalCase[] =
  N99_FEWSHOT_RETRIEVAL_SCENARIOS.map(n99FewShotRetrievalScenarioToEvalCase);
