import {
  inferProductGuideIntentCandidates,
  inferReadOnlyIntentCandidates,
  scoreFastIntentHeuristics,
  FAST_HEURISTIC_COMPOUND_CONFIDENCE,
  FAST_HEURISTIC_READ_ONLY_ACTION_CONFIDENCE,
} from './fast-intent-heuristics.util.js';
import { PRODUCT_GUIDE_PROMPT_SCENARIOS } from './ai-product-guide.fixtures.js';

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

  it('returns product guide candidate before availability heuristics (pipe-1.2 / ai-guide-1.0.2)', () => {
    const prompt = 'How do I turn on online payment for services?';
    const candidates = inferProductGuideIntentCandidates('dashboard', prompt);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      action: 'guide_user_flow',
      source: 'fast_heuristic',
      confidence: FAST_HEURISTIC_READ_ONLY_ACTION_CONFIDENCE,
      paramHints: { complexityTier: 'read_only', productGuide: true },
    });

    const scored = scoreFastIntentHeuristics(
      { prompt, surface: 'dashboard' },
      { tier: 'read_only', useDecomposition: false },
      false,
    );
    expect(scored[0]?.action).toBe('guide_user_flow');
  });

  it.each(
    PRODUCT_GUIDE_PROMPT_SCENARIOS.filter((scenario) => scenario.expectedMatch),
  )(
    'scores guide fast heuristic for $id',
    ({ prompt, surface, expectedIntent }) => {
      const candidates = inferProductGuideIntentCandidates(
        surface ?? 'dashboard',
        prompt,
      );
      expect(candidates[0]?.action).toBe(expectedIntent);
    },
  );

  it('ai-guide-1.0.3 — skips guide heuristics in act mode', () => {
    expect(
      inferProductGuideIntentCandidates(
        'dashboard',
        'How do I set up a weekly schedule?',
        'act',
      ),
    ).toEqual([]);
  });

  it('ai-guide-1.0.3 — forces guide heuristics in guide mode', () => {
    const candidates = inferProductGuideIntentCandidates(
      'dashboard',
      'How many appointments today?',
      'guide',
    );
    expect(candidates[0]?.paramHints).toMatchObject({ assistantMode: 'guide' });
  });
});
