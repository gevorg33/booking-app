import {
  AI_IMPLICATION_CORPUS_SCENARIOS,
  IMPLICATION_CORPUS_PIPE_MARKER,
  type ImplicationCorpusScenario,
} from './ai-implication-corpus.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export { IMPLICATION_CORPUS_PIPE_MARKER };

/** Scenarios wired to CI — polarity guards stay in corpus unit tests only. */
export const AI_IMPLICATION_CORPUS_EVAL_SCENARIOS =
  AI_IMPLICATION_CORPUS_SCENARIOS.filter(
    (scenario) => !scenario.mustNotMatch?.length,
  );

export function implicationCorpusEvalCaseId(
  scenario: Pick<ImplicationCorpusScenario, 'id'>,
): string {
  return `implication-corpus-${scenario.id}`;
}

export function implicationCorpusScenarioToEvalCase(
  scenario: ImplicationCorpusScenario,
): AiCommandEvalCase {
  if (scenario.surface === 'provider') {
    return {
      id: implicationCorpusEvalCaseId(scenario),
      prompt: scenario.prompt,
      surface: 'provider',
      locale: scenario.locale ?? 'en',
      expect: {
        rescuedAction: scenario.expectedAction,
        rescueFromAction: 'unknown',
        useSurfaceProviderImplicationRescue: true,
        implicationTopIntent: scenario.topIntent,
        rescueReason: 'provider_heuristic',
      },
    };
  }

  return {
    id: implicationCorpusEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: scenario.surface,
    locale: scenario.locale ?? 'en',
    expect: {
      useSemanticIntentMatch: true,
      semanticMatchAction: scenario.expectedAction,
      semanticMatchParamsPartial: scenario.expectedParamHints,
      semanticMatchUseTopAnchorFallback: true,
      implicationTopIntent: scenario.topIntent,
      rescueReason: 'semantic_match',
    },
  };
}

export const AI_COMMAND_EVAL_IMPLICATION_CASES: AiCommandEvalCase[] =
  AI_IMPLICATION_CORPUS_EVAL_SCENARIOS.map(implicationCorpusScenarioToEvalCase);
