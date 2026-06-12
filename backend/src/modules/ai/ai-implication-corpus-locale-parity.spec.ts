import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { buildCanonicalPhrasingBank } from './intent-phrasing-bank.util.js';
import {
  filterAnchorsForSurface,
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
} from './ai-semantic-intent.util.js';
import { resolveSemanticAllowedActions } from './semantic-allowed-actions.util.js';
import {
  IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS,
} from './ai-implication-corpus-multilingual.fixtures.js';
import {
  listImplicationAnchorLocaleParityGaps,
  listImplicationCorpusLocaleParityGaps,
  listImplicationEvalLocaleParityGaps,
} from './ai-implication-corpus-locale-parity.util.js';
import { implicationCorpusEvalCaseId } from './ai-implication-corpus.eval.util.js';
import { AI_COMMAND_EVAL_IMPLICATION_CASES } from './ai-implication-corpus.eval.util.js';

describe('ai implication corpus locale parity (acc-2.4 / pipe-1.11.5)', () => {
  it('ships HY and RU anchors for every EN implied anchor', () => {
    expect(listImplicationAnchorLocaleParityGaps()).toEqual([]);
  });

  it('ships HY and RU corpus siblings for every EN implication scenario', () => {
    expect(listImplicationCorpusLocaleParityGaps()).toEqual([]);
  });

  it('maps every HY/RU implication scenario to an eval golden case', () => {
    expect(listImplicationEvalLocaleParityGaps(AI_COMMAND_EVAL_DETERMINISTIC_CASES)).toEqual(
      [],
    );
  });

  it.each(
    IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS.filter(
      (scenario) => scenario.expectedTopAnchorId && scenario.minScore != null,
    ),
  )(
    '$id resolves HY/RU implication prompt to $expectedAction',
    ({ prompt, surface, expectedAction, expectedTopAnchorId, minScore }) => {
      const allowedActions = resolveSemanticAllowedActions(surface);
      const anchors = filterAnchorsForSurface(
        buildCanonicalPhrasingBank([]),
        surface,
        allowedActions,
      );
      const ranked = rankAnchorsDeterministic(prompt, anchors);
      const match = resolveSemanticMatch(ranked, {
        threshold: SEMANTIC_CONCEPT_THRESHOLD,
      });

      expect(match?.action).toBe(expectedAction);
      expect(ranked[0]?.anchor.id).toBe(expectedTopAnchorId);
      expect(ranked[0]?.score).toBeGreaterThanOrEqual(minScore!);
    },
  );

  it.each(
    IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS.map((scenario) => [scenario.id, scenario]),
  )('passes eval case for %s', (_id, scenario) => {
    const evalCase = AI_COMMAND_EVAL_IMPLICATION_CASES.find(
      (row) => row.id === implicationCorpusEvalCaseId(scenario),
    );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });
});
