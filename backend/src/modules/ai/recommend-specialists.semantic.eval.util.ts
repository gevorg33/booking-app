import {
  RECOMMEND_SPECIALISTS_SEMANTIC_SCENARIOS,
  type RecommendSpecialistsSemanticScenario,
} from './recommend-specialists.semantic.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function recommendSpecialistsSemanticEvalCaseId(
  scenario: Pick<RecommendSpecialistsSemanticScenario, 'id'>,
): string {
  return `recommend-specialists-semantic-${scenario.id}`;
}

export function recommendSpecialistsScenarioToEvalCase(
  scenario: RecommendSpecialistsSemanticScenario,
): AiCommandEvalCase {
  return {
    id: recommendSpecialistsSemanticEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: scenario.surface ?? 'dashboard',
    expect: {
      useRecommendSpecialistsSemanticDetect: true,
      recommendSpecialistsSemantic: scenario.mustDetect,
    },
  };
}

export const AI_COMMAND_EVAL_RECOMMEND_SPECIALISTS_SEMANTIC_CASES: AiCommandEvalCase[] =
  RECOMMEND_SPECIALISTS_SEMANTIC_SCENARIOS.map(
    recommendSpecialistsScenarioToEvalCase,
  );
