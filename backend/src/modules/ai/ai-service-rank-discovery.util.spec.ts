import { SERVICE_RANK_EXTRACTION_SCENARIOS } from './ai-service-rank-discovery.fixtures.js';
import {
  enrichServiceRankFromPrompt,
  extractServiceRankFromPrompt,
  isServiceCatalogRankPrompt,
  isServiceCatalogRankSpecialistPrompt,
  isServiceRankEnrichmentBlockedPrompt,
  rescueServiceRankFromRecommendSpecialistsIntent,
} from './ai-service-rank-discovery.util.js';

describe('ai-service-rank-discovery.util (rank-1.3)', () => {
  it.each(SERVICE_RANK_EXTRACTION_SCENARIOS)(
    'extractServiceRankFromPrompt $id',
    ({ prompt, serviceRank }) => {
      expect(extractServiceRankFromPrompt(prompt)).toBe(serviceRank);
    },
  );

  it.each(SERVICE_RANK_EXTRACTION_SCENARIOS.filter((scenario) => scenario.blocked))(
    'enrichServiceRankFromPrompt strips serviceRank for blocked $id',
    ({ prompt }) => {
      expect(
        enrichServiceRankFromPrompt({ serviceRank: 'highest_price' }, prompt)
          .serviceRank,
      ).toBeUndefined();
    },
  );

  it('enrichServiceRankFromPrompt sets serviceRank when classifier missed rank', () => {
    expect(
      enrichServiceRankFromPrompt(
        { serviceCategory: 'haircut' },
        "What's the cheapest haircut you offer?",
      ),
    ).toEqual({
      serviceCategory: 'haircut',
      serviceRank: 'lowest_price',
    });
  });

  it('isServiceCatalogRankSpecialistPrompt detects provider rank prompts', () => {
    expect(
      isServiceCatalogRankSpecialistPrompt(
        'Who is the best rated lash specialist this week?',
      ),
    ).toBe(true);
    expect(
      isServiceCatalogRankSpecialistPrompt(
        "What's the best premium service for lashes?",
      ),
    ).toBe(false);
  });

  it('isServiceRankEnrichmentBlockedPrompt blocks package catalog prompts', () => {
    expect(
      isServiceRankEnrichmentBlockedPrompt('Any spa packages under $100?'),
    ).toBe(true);
  });
});

describe('ai-service-rank-discovery.util recommend_specialists guard (rank-1.5)', () => {
  it('isServiceCatalogRankPrompt distinguishes service vs provider rank', () => {
    expect(
      isServiceCatalogRankPrompt("What's the best premium service for lashes?"),
    ).toBe(true);
    expect(isServiceCatalogRankPrompt('Best rated deep tissue massage')).toBe(
      false,
    );
    expect(
      isServiceCatalogRankPrompt(
        'Who is the best rated lash specialist this week?',
      ),
    ).toBe(false);
  });

  it.each(
    SERVICE_RANK_EXTRACTION_SCENARIOS.filter(
      (scenario) => scenario.id === 'rank-not-specialist-en',
    ),
  )('rescueServiceRankFromRecommendSpecialistsIntent rescues $id', ({ prompt }) => {
    expect(
      rescueServiceRankFromRecommendSpecialistsIntent(
        prompt,
        'recommend_specialists',
      ),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'rank_recommend_specialists',
    });
  });

  it('keeps recommend_specialists for provider-rated prompts', () => {
    expect(
      rescueServiceRankFromRecommendSpecialistsIntent(
        'Best rated deep tissue massage',
        'recommend_specialists',
      ),
    ).toBeNull();
    expect(
      rescueServiceRankFromRecommendSpecialistsIntent(
        'Who is the best rated lash specialist this week?',
        'recommend_specialists',
      ),
    ).toBeNull();
  });
});
