import {
  RANK_DOMAIN_FIXTURE_IDS,
  RANK_DISAMBIGUATION_SCENARIOS,
  RANK_HANDLER_EDGE_SCENARIOS,
  RANK_HANDLER_OUTCOME_SCENARIOS,
  RANK_MOBILE_SCENARIOS,
  RANK_MULTILINGUAL_SCENARIOS,
  RANK_SESSION_SCENARIOS,
  RANK_SYNONYM_SCENARIOS,
  SERVICE_RANK_COMPOUND_SCENARIOS,
  SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES,
  SERVICE_RANK_EXTRACTION_SCENARIOS,
  SIMILAR_SERVICE_RANK_PROMPTS,
} from './ai-service-rank-discovery.fixtures.js';
import { extractServiceRankFromPrompt } from './ai-service-rank-discovery.util.js';

describe('ai-service-rank-discovery.fixtures (rank-1.2 / rank-1.10)', () => {
  it('ships classifier rules with serviceRank semantics', () => {
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain('serviceRank');
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain('highest_price');
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain('lowest_price');
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain('most_popular');
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain(
      'recommend_specialists',
    );
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain(
      'rolling 90-day booking count',
    );
  });

  it.each(SIMILAR_SERVICE_RANK_PROMPTS)(
    'scenario $id has required fixture fields',
    ({ id, prompt, surface, expectedAction }) => {
      expect(id).toBeTruthy();
      expect(prompt.trim().length).toBeGreaterThan(0);
      expect(['public', 'customer', 'dashboard', 'both']).toContain(surface);
      expect(expectedAction.trim().length).toBeGreaterThan(0);
    },
  );

  it.each(
    SIMILAR_SERVICE_RANK_PROMPTS.filter(
      (scenario) =>
        scenario.expectedParams?.serviceRank &&
        !scenario.blocked &&
        !scenario.phase2,
    ),
  )(
    'extractServiceRankFromPrompt matches fixture $id',
    ({ prompt, expectedParams }) => {
      expect(extractServiceRankFromPrompt(prompt)).toBe(
        expectedParams!.serviceRank,
      );
    },
  );

  it('ships section F multilingual scenarios', () => {
    expect(RANK_MULTILINGUAL_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'rank-premium-hy',
      'rank-luxury-ru',
      'rank-cheapest-hy',
      'rank-translit-premium',
      'rank-translit-cheapest',
    ]);
  });

  it('ships section G disambiguation scenarios', () => {
    expect(RANK_DISAMBIGUATION_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'rank-specialist-stays-en',
      'rank-not-analyze-appt-en',
      'rank-not-analyze-services-admin-en',
      'rank-not-package-en',
      'rank-rated-means-provider-en',
    ]);
  });

  it('covers compound and handler outcome ids from the rank matrix', () => {
    expect(SERVICE_RANK_COMPOUND_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'rank-book-premium-en',
      'rank-premium-under-budget-en',
      'rank-cheapest-book-en',
    ]);
    expect(
      RANK_HANDLER_OUTCOME_SCENARIOS.map((scenario) => scenario.id),
    ).toEqual(
      expect.arrayContaining([
        'rank-single-premium-tie-price',
        'rank-name-premium-fallback',
        'rank-most-popular-single',
        'rank-all-same-price',
        'rank-inactive-excluded',
        'rank-zero-price',
        'rank-missing-price',
      ]),
    );
  });

  it('keeps extraction golden rows aligned with section A/B/H prompts', () => {
    const extractionIds = SERVICE_RANK_EXTRACTION_SCENARIOS.map(
      (scenario) => scenario.id,
    );
    for (const id of [
      'rank-premium-hair-en',
      'rank-cheapest-hair-en',
      'rank-most-popular-en',
    ]) {
      expect(extractionIds).toContain(id);
    }
  });
});

describe('ai-service-rank-discovery.fixtures sections I–L (rank-1.12)', () => {
  it('ships section I synonym scenarios', () => {
    expect(RANK_SYNONYM_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'rank-vip-en',
      'rank-signature-en',
      'rank-flagship-en',
      'rank-entry-level-en',
      'rank-budget-friendly-en',
      'rank-mid-range-en',
    ]);
  });

  it('ships section J voice/mobile scenarios', () => {
    expect(RANK_MOBILE_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'rank-voice-premium-en',
      'rank-voice-chip-en',
      'rank-voice-cheapest-en',
      'rank-compare-en',
      'rank-recommend-not-provider-en',
    ]);
  });

  it('ships section K session multi-turn scenarios', () => {
    expect(RANK_SESSION_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'rank-session-upgrade-en',
      'rank-session-then-budget-en',
      'rank-session-pick-one-en',
    ]);
  });

  it('ships section L handler edge scenarios', () => {
    expect(RANK_HANDLER_EDGE_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'rank-all-same-price',
      'rank-inactive-excluded',
      'rank-zero-price',
      'rank-missing-price',
    ]);
  });

  it('has at least 35 unique ids across the rank domain', () => {
    expect(RANK_DOMAIN_FIXTURE_IDS.length).toBeGreaterThanOrEqual(35);
    expect(RANK_DOMAIN_FIXTURE_IDS.length).toBe(61);
    expect(new Set(RANK_DOMAIN_FIXTURE_IDS).size).toBe(
      RANK_DOMAIN_FIXTURE_IDS.length,
    );
  });

  it.each(RANK_SYNONYM_SCENARIOS.filter((scenario) => !scenario.phase2))(
    'synonym scenario $id extracts serviceRank',
    ({ prompt, expectedParams }) => {
      expect(extractServiceRankFromPrompt(prompt)).toBe(
        expectedParams!.serviceRank,
      );
    },
  );

  it.each(
    RANK_MOBILE_SCENARIOS.filter(
      (scenario) => !scenario.phase2 && scenario.expectedParams?.serviceRank,
    ),
  )('mobile scenario $id extracts serviceRank', ({ prompt, expectedParams }) => {
    expect(extractServiceRankFromPrompt(prompt)).toBe(
      expectedParams!.serviceRank,
    );
  });
});
