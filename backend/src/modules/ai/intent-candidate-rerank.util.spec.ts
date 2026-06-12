import {
  candidateToClassifiedIntent,
  filterRerankEligibleCandidates,
  isRerankEligibleCandidate,
  mergeIntentCandidateSources,
  pickPhase1RerankWinner,
  rerankIntentCandidates,
  semanticMatchToCandidate,
} from './intent-candidate-rerank.util.js';
import { classifiedIntentToCandidate } from './command-understanding.types.js';
import { FAST_HEURISTIC_RERANK_SCENARIOS } from './fast-intent-heuristics-rerank.fixtures.js';

describe('intent-candidate-rerank.util', () => {
  it('ranks candidates by confidence descending', () => {
    const result = rerankIntentCandidates([
      classifiedIntentToCandidate({
        action: 'create_booking',
        params: {},
        reasoning: 'a',
        confidence: 0.7,
      }),
      semanticMatchToCandidate({
        action: 'create_booking',
        confidence: 0.91,
        anchorId: 'en-book-first',
        paramHints: { bookingFirstAvailable: true },
        reasoning: 'semantic',
        rescueReason: 'semantic_match',
      }),
    ]);
    expect(result?.winner.source).toBe('semantic_match');
    expect(result?.ranked[0]?.rank).toBe(0);
  });

  it('flags ambiguous top-two within margin', () => {
    const result = rerankIntentCandidates([
      classifiedIntentToCandidate({
        action: 'create_booking',
        params: {},
        reasoning: 'a',
        confidence: 0.7,
      }),
      classifiedIntentToCandidate({
        action: 'check_providers_for_service',
        params: {},
        reasoning: 'b',
        confidence: 0.68,
      }),
    ]);
    expect(result?.ambiguous).toBe(true);
  });

  it('excludes fast_heuristic candidates below 0.90 from re-rank pool (pipe-1.2.2)', () => {
    const low = {
      action: 'unknown',
      confidence: 0.85,
      source: 'fast_heuristic' as const,
      paramHints: { complexityTier: 'read_only' },
    };
    const high = {
      action: 'show_appointments',
      confidence: 0.93,
      source: 'fast_heuristic' as const,
    };
    expect(isRerankEligibleCandidate(low)).toBe(false);
    expect(isRerankEligibleCandidate(high)).toBe(true);
    expect(
      filterRerankEligibleCandidates([
        low,
        high,
        classifiedIntentToCandidate({
          action: 'unknown',
          params: {},
          reasoning: 'c',
          confidence: 0.2,
        }),
      ]),
    ).toHaveLength(2);
  });

  it.each(FAST_HEURISTIC_RERANK_SCENARIOS)(
    'phase 1 re-rank policy $id',
    (scenario) => {
      const pool = filterRerankEligibleCandidates([
        scenario.heuristic,
        classifiedIntentToCandidate(scenario.classifier),
      ]);
      const rerank = rerankIntentCandidates(pool);
      expect(rerank).not.toBeNull();
      const winner = pickPhase1RerankWinner(rerank!);
      expect(winner.source).toBe(scenario.expectedWinnerSource);
      expect(winner.action).toBe(scenario.expectedAction);
    },
  );

  it('mergeIntentCandidateSources combines heuristic, classifier, and semantic rows', () => {
    const merged = mergeIntentCandidateSources({
      heuristics: [
        {
          action: 'show_appointments',
          confidence: 0.93,
          source: 'fast_heuristic',
        },
      ],
      classifier: classifiedIntentToCandidate({
        action: 'unknown',
        params: {},
        reasoning: 'classify',
        confidence: 0.2,
      }),
      semantic: semanticMatchToCandidate({
        action: 'create_booking',
        confidence: 0.88,
        anchorId: 'en-implied-trim',
        paramHints: {},
        reasoning: 'semantic',
        rescueReason: 'semantic_match',
      }),
    });

    expect(merged).toHaveLength(3);
    expect(merged.map((candidate) => candidate.source)).toEqual([
      'fast_heuristic',
      'classifier',
      'semantic_match',
    ]);
  });

  it('maps winner candidate to ClassifiedIntent with param hints', () => {
    const parsed = candidateToClassifiedIntent(
      semanticMatchToCandidate({
        action: 'create_booking',
        confidence: 0.88,
        anchorId: 'en-book-first',
        paramHints: { bookingFirstAvailable: true },
        reasoning: 'semantic',
        rescueReason: 'semantic_match',
      }),
      'book first available tomorrow',
    );
    expect(parsed.action).toBe('create_booking');
    expect(parsed.params.bookingFirstAvailable).toBe(true);
  });
});
