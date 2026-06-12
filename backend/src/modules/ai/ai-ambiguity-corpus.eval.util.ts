import {
  AMBIGUITY_CORPUS_SCENARIOS,
  type AmbiguityCorpusScenario,
} from './ai-ambiguity-corpus.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function ambiguityCorpusEvalCaseId(
  scenario: Pick<AmbiguityCorpusScenario, 'id'>,
): string {
  return `ambiguity-corpus-${scenario.id}`;
}

export function ambiguityCorpusScenarioToEvalCase(
  scenario: AmbiguityCorpusScenario,
): AiCommandEvalCase {
  if (scenario.kind === 'compound_empty') {
    return {
      id: ambiguityCorpusEvalCaseId(scenario),
      prompt: scenario.prompt,
      surface: scenario.surface,
      locale: scenario.locale,
      expect: {
        compoundSurface: scenario.surface,
        compoundExpectEmpty: true,
      },
    };
  }

  return {
    id: ambiguityCorpusEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: scenario.surface,
    locale: scenario.locale,
    expect: {
      expectValidationClarify: true,
      validationAction: scenario.action,
      validationParamsPartial: scenario.validationParamsPartial,
      clarifyFieldsContains: scenario.clarifyFieldsContains,
    },
  };
}

export const AI_COMMAND_EVAL_AMBIGUITY_CORPUS_CASES: AiCommandEvalCase[] =
  AMBIGUITY_CORPUS_SCENARIOS.map(ambiguityCorpusScenarioToEvalCase);
