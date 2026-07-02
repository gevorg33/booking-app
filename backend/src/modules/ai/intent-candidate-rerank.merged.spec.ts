import { classifiedIntentToCandidate } from './command-understanding.types.js';
import { MERGE_RERANK_SCENARIOS } from './intent-candidate-rerank.fixtures.js';
import {
  MERGE_RERANK_PIPE_MARKER,
  mergeAndRerankIntentCandidates,
  mergeIntentCandidateSources,
} from './intent-candidate-rerank.util.js';

describe('intent-candidate-rerank merge (pipe-1.4.5)', () => {
  it('exports pipe-1.4.5 marker', () => {
    expect(MERGE_RERANK_PIPE_MARKER).toBe('pipe-1.4.5');
  });

  it.each(MERGE_RERANK_SCENARIOS)(
    '$id — winner source=$expectedWinnerSource action=$expectedAction',
    ({
      heuristics,
      classifier,
      semantic,
      expectedWinnerSource,
      expectedAction,
      expectAmbiguous,
    }) => {
      const merged = mergeIntentCandidateSources({
        heuristics,
        classifier: classifier ? classifiedIntentToCandidate(classifier) : null,
        semantic,
      });

      expect(merged.length).toBe(
        heuristics.length + (classifier ? 1 : 0) + (semantic ? 1 : 0),
      );

      const result = mergeAndRerankIntentCandidates(merged);
      expect(result).not.toBeNull();
      expect(result?.winner.source).toBe(expectedWinnerSource);
      expect(result?.winner.action).toBe(expectedAction);
      if (expectAmbiguous) {
        expect(result?.ambiguous).toBe(true);
      }
    },
  );

  it('tracks merged vs eligible counts for three-source pool', () => {
    const scenario = MERGE_RERANK_SCENARIOS.find(
      (entry) =>
        entry.id === 'phase1-defers-heuristic-when-classifier-resolved',
    )!;

    const merged = mergeIntentCandidateSources({
      heuristics: scenario.heuristics,
      classifier: classifiedIntentToCandidate(scenario.classifier!),
      semantic: scenario.semantic,
    });

    const result = mergeAndRerankIntentCandidates(merged)!;
    expect(result.merged).toHaveLength(3);
    expect(result.eligible).toHaveLength(3);
    expect(result.rawWinner.source).toBe('fast_heuristic');
    expect(result.winner.source).toBe('classifier');
  });
});
