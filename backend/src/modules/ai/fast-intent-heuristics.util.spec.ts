import {
  inferReadOnlyIntentCandidates,
  scoreFastIntentHeuristics,
  FAST_HEURISTIC_COMPOUND_CONFIDENCE,
  FAST_HEURISTIC_READ_ONLY_ACTION_CONFIDENCE,
} from './fast-intent-heuristics.util.js';

describe('fast-intent-heuristics.util (pipe-1.2.1)', () => {
  it('returns IntentCandidate[] with fast_heuristic source for read-only availability', () => {
    const candidates = inferReadOnlyIntentCandidates(
      'dashboard',
      'Who can do facemassage today?',
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      action: 'check_providers_for_service',
      source: 'fast_heuristic',
      confidence: FAST_HEURISTIC_READ_ONLY_ACTION_CONFIDENCE,
      paramHints: { complexityTier: 'read_only' },
    });
  });

  it('returns compound candidate with decomposition hints', () => {
    const candidates = scoreFastIntentHeuristics(
      { prompt: 'Cancel all and then clear schedule', surface: 'dashboard' },
      {
        tier: 'compound',
        useDecomposition: true,
        reasoning: 'Compound markers detected',
      },
      true,
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      action: 'unknown',
      source: 'fast_heuristic',
      confidence: FAST_HEURISTIC_COMPOUND_CONFIDENCE,
      paramHints: {
        complexityTier: 'compound',
        useDecomposition: true,
      },
    });
  });

  it('returns empty array for empty prompt', () => {
    expect(
      scoreFastIntentHeuristics(
        { prompt: '   ' },
        { tier: 'read_only', useDecomposition: false },
        false,
      ),
    ).toEqual([]);
  });
});
