import {
  SEMANTIC_PARAPHRASE_SCENARIOS,
  type SemanticParaphraseScenario,
} from './ai-semantic-intent.fixtures.js';
import { resolveSemanticParaphraseLocale } from './ai-semantic-paraphrase-corpus.util.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function semanticParaphraseEvalCaseId(
  scenario: Pick<SemanticParaphraseScenario, 'id'>,
): string {
  return `semantic-${scenario.id}`;
}

export function semanticParaphraseScenarioToEvalCase(
  scenario: SemanticParaphraseScenario,
): AiCommandEvalCase {
  return {
    id: semanticParaphraseEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: scenario.surface,
    locale: resolveSemanticParaphraseLocale(scenario),
    expect: {
      useSemanticIntentMatch: true,
      semanticMatchAction: scenario.expectedAction,
      semanticMatchParamsPartial: scenario.expectedParamHints,
      semanticMatchUseTopAnchorFallback: true,
      rescueReason: 'semantic_match',
    },
  };
}

/** acc-3.11 / acc-3.16 — semantic matcher golden cases (deterministic concept fallback in CI). */
export const AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES: AiCommandEvalCase[] =
  SEMANTIC_PARAPHRASE_SCENARIOS.filter(
    (scenario) => scenario.classifyAction === 'unknown',
  ).map(semanticParaphraseScenarioToEvalCase);
