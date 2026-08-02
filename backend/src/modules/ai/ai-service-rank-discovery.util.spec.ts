import { SERVICE_RANK_EXTRACTION_SCENARIOS } from './ai-service-rank-discovery.fixtures.js';
import {
  SERVICE_RANK_ADMIN_ANALYTICS_RESCUE_SCENARIOS,
  SERVICE_RANK_EXTRACTION_SCENARIOS,
  SERVICE_RANK_PACKAGE_RESCUE_SCENARIOS,
  SERVICE_RANK_PROVIDER_MISROUTE_RESCUE_SCENARIOS,
  SERVICE_RANK_SUBJECTIVE_RESCUE_SCENARIOS,
} from './ai-service-rank-discovery.fixtures.js';
import { extractServiceTierFromPrompt } from '../../common/utils/service-rank-metadata.util.js';
import { enrichRankSessionParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import { extractMaxPriceFromBudgetPrompt } from './ai-budget-service-discovery.util.js';
import { RANK_SESSION_SCENARIOS } from './ai-service-rank-discovery.fixtures.js';
import {
  buildServiceRankDiscoveryRescueParams,
  enrichServiceRankFromPrompt,
  extractBestServiceCategoryFromPrompt,
  extractServiceRankServiceCategoryFromPrompt,
  isMidRangeServiceListPrompt,
  isAffordabilityListPrompt,
  isValueOrPremiumBudgetListPrompt,
  extractProviderRankServiceCategoryFromPrompt,
  extractSubjectiveRankServiceCategoryFromPrompt,
  extractServiceRankFromPrompt,
  isAdminAppointmentAnalyticsRankPrompt,
  isAdminServiceAnalyticsRankPrompt,
  isProviderRankDiscoveryPrompt,
  isRankSessionBudgetRefinePrompt,
  isRankSessionUpgradePrompt,
  isSubjectiveServiceRankPrompt,
  isServiceCatalogRankPrompt,
  isServiceCatalogRankSpecialistPrompt,
  isServiceCatalogRecommendNotProviderPrompt,
  isServiceRankEnrichmentBlockedPrompt,
  rescueServiceRankDiscoveryIntent,
  rescueServiceRankFromRecommendSpecialistsIntent,
} from './ai-service-rank-discovery.util.js';

describe('ai-service-rank-discovery.util (rank-1.3)', () => {
  it.each(SERVICE_RANK_EXTRACTION_SCENARIOS)(
    'extractServiceRankFromPrompt $id',
    ({ prompt, serviceRank }) => {
      expect(extractServiceRankFromPrompt(prompt)).toBe(serviceRank);
    },
  );

  it.each(
    SERVICE_RANK_EXTRACTION_SCENARIOS.filter((scenario) => scenario.blocked),
  )(
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

  it.each(
    SERVICE_RANK_EXTRACTION_SCENARIOS.filter(
      (scenario) => scenario.id === 'rank-not-package-en',
    ),
  )(
    'isServiceRankEnrichmentBlockedPrompt blocks package catalog $id',
    ({ prompt }) => {
      expect(isServiceRankEnrichmentBlockedPrompt(prompt)).toBe(true);
      expect(isServiceCatalogRankPrompt(prompt)).toBe(false);
    },
  );
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
  )(
    'rescueServiceRankFromRecommendSpecialistsIntent rescues $id',
    ({ prompt }) => {
      expect(
        rescueServiceRankFromRecommendSpecialistsIntent(
          prompt,
          'recommend_specialists',
        ),
      ).toEqual({
        action: 'list_services',
        rescueReason: 'rank_recommend_specialists',
      });
    },
  );

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

describe('ai-service-rank-discovery.util admin analytics guard (rank-not-analyze-*-en)', () => {
  it.each(
    SERVICE_RANK_EXTRACTION_SCENARIOS.filter(
      (scenario) =>
        scenario.id === 'rank-not-analyze-appt-en' ||
        scenario.id === 'rank-not-analyze-services-admin-en',
    ),
  )(
    'extractServiceRankFromPrompt returns null for $id',
    ({ prompt, serviceRank }) => {
      expect(serviceRank).toBeNull();
      expect(extractServiceRankFromPrompt(prompt)).toBeNull();
      expect(isServiceCatalogRankPrompt(prompt)).toBe(false);
    },
  );

  it('isAdminServiceAnalyticsRankPrompt blocks catalog rank enrichment', () => {
    expect(
      isAdminServiceAnalyticsRankPrompt('Most booked service this month'),
    ).toBe(true);
    expect(
      enrichServiceRankFromPrompt(
        { serviceRank: 'most_popular' },
        'Most booked service this month',
      ).serviceRank,
    ).toBeUndefined();
  });

  it.each(
    SERVICE_RANK_EXTRACTION_SCENARIOS.filter(
      (scenario) => scenario.id === 'rank-not-analyze-appt-en',
    ),
  )(
    'isAdminAppointmentAnalyticsRankPrompt blocks catalog rank for $id',
    ({ prompt }) => {
      expect(isAdminAppointmentAnalyticsRankPrompt(prompt)).toBe(true);
      expect(extractServiceRankFromPrompt(prompt)).toBeNull();
      expect(
        enrichServiceRankFromPrompt({ serviceRank: 'highest_price' }, prompt)
          .serviceRank,
      ).toBeUndefined();
    },
  );

  it.each(SERVICE_RANK_ADMIN_ANALYTICS_RESCUE_SCENARIOS)(
    'rescueServiceRankDiscoveryIntent dashboard $id',
    ({ prompt, fromAction, expectedAction, rescueReason, serviceMetric }) => {
      const rescued = rescueServiceRankDiscoveryIntent(
        prompt,
        fromAction,
        'dashboard',
      );
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);
      if (serviceMetric) {
        expect(rescued?.params.serviceMetric).toBe(serviceMetric);
      }
    },
  );
});

describe('ai-service-rank-discovery.util package guard (rank-not-package-en)', () => {
  it.each(SERVICE_RANK_PACKAGE_RESCUE_SCENARIOS)(
    'rescueServiceRankDiscoveryIntent $surface $id',
    ({ prompt, fromAction, surface, expectedAction, rescueReason }) => {
      const rescued = rescueServiceRankDiscoveryIntent(
        prompt,
        fromAction,
        surface,
      );
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);
      expect(rescued?.params.serviceRank).toBeUndefined();
    },
  );
});

describe('ai-service-rank-discovery.util most popular rank (rank-most-popular-en)', () => {
  it('extracts most_popular and haircut category', () => {
    const prompt = "What's your most popular haircut?";
    expect(extractServiceRankFromPrompt(prompt)).toBe('most_popular');
    expect(extractServiceRankServiceCategoryFromPrompt(prompt)).toBe('haircut');
    expect(buildServiceRankDiscoveryRescueParams(prompt)).toEqual({
      serviceRank: 'most_popular',
      serviceCategory: 'haircut',
    });
  });
});

describe('ai-service-rank-discovery.util tier metadata filter (rank-tier-metadata-en)', () => {
  it('extracts premium tier and color category without catalog rank', () => {
    const prompt = 'Premium tier services for color';
    expect(extractServiceRankFromPrompt(prompt)).toBeNull();
    expect(extractServiceTierFromPrompt(prompt)).toBe('premium');
    expect(extractServiceRankServiceCategoryFromPrompt(prompt)).toBe('color');
    expect(buildServiceRankDiscoveryRescueParams(prompt)).toEqual({
      serviceTier: 'premium',
      serviceCategory: 'color',
    });
  });

  it('rescues list_services misroutes to tier filter', () => {
    const rescued = rescueServiceRankDiscoveryIntent(
      'Premium tier services for color',
      'unknown',
      'public',
    );
    expect(rescued).toEqual({
      action: 'list_services',
      rescueReason: 'rank_tier_filter',
      params: { serviceTier: 'premium', serviceCategory: 'color' },
    });
  });
});

describe('ai-service-rank-discovery.util provider budget (discover-best-provider-budget-en)', () => {
  it('extracts unaliased "cut" from stylist-for-a-cut provider rank prompt', () => {
    const prompt = 'Best rated stylist for a cut under $60 this week';
    expect(isProviderRankDiscoveryPrompt(prompt)).toBe(true);
    // e2e-bug.323 — bare "cut" must not pre-alias to "haircut": that let the
    // hairstyle synonym steal literal "* cut" catalog matches (Men's cut /
    // Women's cut). Staying "cut" still falls back to hairstyle via the
    // synonym chain when no cut-named service exists.
    expect(extractProviderRankServiceCategoryFromPrompt(prompt)).toBe('cut');
    expect(extractServiceRankFromPrompt(prompt)).toBeNull();
  });
});

describe('ai-service-rank-discovery.util affordability browse (discover-flagship-question-en)', () => {
  it('lists facials in budget without catalog rank', () => {
    const prompt =
      'Can I afford a deluxe facial tomorrow or Sunday under $100?';
    expect(isAffordabilityListPrompt(prompt)).toBe(true);
    expect(extractServiceRankFromPrompt(prompt)).toBeNull();
    expect(
      enrichServiceRankFromPrompt(
        { serviceCategory: 'facial', serviceRank: 'highest_price' },
        prompt,
      ).serviceRank,
    ).toBeUndefined();
  });
});

describe('ai-service-rank-discovery.util value-or-premium browse (discover-value-or-premium-en)', () => {
  it('lists all services in budget without catalog rank', () => {
    const prompt = 'Affordable or premium massage — what fits $80?';
    expect(isValueOrPremiumBudgetListPrompt(prompt)).toBe(true);
    expect(extractServiceRankFromPrompt(prompt)).toBeNull();
    expect(
      enrichServiceRankFromPrompt(
        { serviceCategory: 'massage', serviceRank: 'highest_price' },
        prompt,
      ).serviceRank,
    ).toBeUndefined();
  });
});

describe('ai-service-rank-discovery.util mid-range browse (rank-mid-range-en)', () => {
  it('lists color services by price without catalog rank', () => {
    const prompt = 'Mid-range color service';
    expect(isMidRangeServiceListPrompt(prompt)).toBe(true);
    expect(extractServiceRankFromPrompt(prompt)).toBeNull();
    expect(extractServiceRankServiceCategoryFromPrompt(prompt)).toBe('color');
    expect(buildServiceRankDiscoveryRescueParams(prompt)).toEqual({
      serviceCategory: 'color',
      limit: 3,
    });
    expect(
      rescueServiceRankDiscoveryIntent(prompt, 'unknown', 'public'),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'rank_mid_range_list',
      params: { serviceCategory: 'color', limit: 3 },
    });
  });
});

describe('ai-service-rank-discovery.util voice premium (rank-voice-premium-en)', () => {
  it('maps short voice prompt to highest_price cut (e2e-bug.323 — unaliased)', () => {
    const prompt = 'Premium cut?';
    expect(extractServiceRankFromPrompt(prompt)).toBe('highest_price');
    expect(extractServiceRankServiceCategoryFromPrompt(prompt)).toBe('cut');
    expect(buildServiceRankDiscoveryRescueParams(prompt)).toEqual({
      serviceRank: 'highest_price',
      serviceCategory: 'cut',
    });
  });
});

describe('ai-service-rank-discovery.util voice cheapest (rank-voice-cheapest-en)', () => {
  it('maps colloquial voice prompt to lowest_price facial', () => {
    const prompt = 'Cheapest facial you got';
    expect(extractServiceRankFromPrompt(prompt)).toBe('lowest_price');
    expect(extractServiceRankServiceCategoryFromPrompt(prompt)).toBe('facial');
    expect(buildServiceRankDiscoveryRescueParams(prompt)).toEqual({
      serviceRank: 'lowest_price',
      serviceCategory: 'facial',
    });
    expect(
      rescueServiceRankDiscoveryIntent(prompt, 'unknown', 'customer'),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'rank_list_services',
      params: {
        serviceRank: 'lowest_price',
        serviceCategory: 'facial',
      },
    });
  });
});

describe('ai-service-rank-discovery.util recommend not provider (rank-recommend-not-provider-en)', () => {
  it('maps recommend+best+service anti-person prompt to highest_price spa', () => {
    const prompt = 'Recommend your best spa service not a person';
    expect(isServiceCatalogRecommendNotProviderPrompt(prompt)).toBe(true);
    expect(isProviderRankDiscoveryPrompt(prompt)).toBe(false);
    expect(isSubjectiveServiceRankPrompt(prompt)).toBe(false);
    expect(extractServiceRankFromPrompt(prompt)).toBe('highest_price');
    expect(extractServiceRankServiceCategoryFromPrompt(prompt)).toBe('spa');
    expect(buildServiceRankDiscoveryRescueParams(prompt)).toEqual({
      serviceRank: 'highest_price',
      serviceCategory: 'spa',
    });
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
});

describe('ai-service-rank-discovery.util session flows (rank-session-upgrade-en / rank-session-then-budget-en)', () => {
  it('rank-session-upgrade-en switches lowest_price to highest_price while keeping haircut', () => {
    const scenario = RANK_SESSION_SCENARIOS.find(
      (entry) => entry.id === 'rank-session-upgrade-en',
    )!;
    let params: Record<string, unknown> = {};
    for (const turn of scenario.turns) {
      params = enrichRankSessionParamsFromPrompt(params, turn.prompt);
      expect(params).toMatchObject(turn.expectedParams);
    }
    expect(isRankSessionUpgradePrompt('show premium instead')).toBe(true);
    expect(extractServiceRankFromPrompt('show premium instead')).toBe(
      'highest_price',
    );
  });

  it('rank-session-then-budget-en keeps luxury facial rank and adds maxPrice ceiling', () => {
    const scenario = RANK_SESSION_SCENARIOS.find(
      (entry) => entry.id === 'rank-session-then-budget-en',
    )!;
    let params: Record<string, unknown> = {};
    for (const turn of scenario.turns) {
      params = enrichRankSessionParamsFromPrompt(params, turn.prompt);
      expect(params).toMatchObject(turn.expectedParams);
    }
    expect(
      isRankSessionBudgetRefinePrompt('anything like that under $120?'),
    ).toBe(true);
    expect(
      extractMaxPriceFromBudgetPrompt('anything like that under $120?'),
    ).toBe(120);
    expect(
      extractServiceRankFromPrompt('anything like that under $120?'),
    ).toBeNull();
  });
});

describe('ai-service-rank-discovery.util premium journey (discover-journey-premium-en)', () => {
  it('does not treat options as a service category on premium options', () => {
    expect(extractServiceRankFromPrompt('premium options')).toBe(
      'highest_price',
    );
    expect(
      extractServiceRankServiceCategoryFromPrompt('premium options'),
    ).toBeNull();
  });

  it('treats too much — under $90 as rank session budget refine', () => {
    const prompt = 'too much — under $90?';
    expect(isRankSessionBudgetRefinePrompt(prompt)).toBe(true);
    expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(90);
    expect(extractServiceRankServiceCategoryFromPrompt(prompt)).toBeNull();
    let params: Record<string, unknown> = {
      serviceCategory: 'massage',
      serviceRank: 'highest_price',
    };
    params = enrichRankSessionParamsFromPrompt(params, prompt);
    expect(params).toMatchObject({
      serviceCategory: 'massage',
      serviceRank: 'highest_price',
      maxPrice: 90,
    });
  });
});

describe('ai-service-rank-discovery.util best massage compound rank (rank-list-then-book-en)', () => {
  it('extractBestServiceCategoryFromPrompt maps massage', () => {
    expect(
      extractBestServiceCategoryFromPrompt(
        "What's your best massage and book it Saturday",
      ),
    ).toBe('massage');
    expect(
      extractServiceRankFromPrompt(
        "What's your best massage and book it Saturday",
      ),
    ).toBe('highest_price');
  });
});

describe('ai-service-rank-discovery.util subjective rank (rank-best-for-me-en)', () => {
  it('isSubjectiveServiceRankPrompt detects first-time subjective prompts', () => {
    expect(
      isSubjectiveServiceRankPrompt(
        "What's the best option for a first-time haircut?",
      ),
    ).toBe(true);
    expect(
      isSubjectiveServiceRankPrompt(
        "What's the best premium service for lashes?",
      ),
    ).toBe(false);
    expect(
      extractServiceRankFromPrompt(
        "What's the best option for a first-time haircut?",
      ),
    ).toBeNull();
  });

  it('extractSubjectiveRankServiceCategoryFromPrompt maps haircut', () => {
    expect(
      extractSubjectiveRankServiceCategoryFromPrompt(
        "What's the best option for a first-time haircut?",
      ),
    ).toBe('haircut');
  });

  it('enrichServiceRankFromPrompt strips serviceRank for subjective prompts', () => {
    expect(
      enrichServiceRankFromPrompt(
        { serviceRank: 'highest_price' },
        "What's the best option for a first-time haircut?",
      ).serviceRank,
    ).toBeUndefined();
  });

  it.each(SERVICE_RANK_SUBJECTIVE_RESCUE_SCENARIOS)(
    'rescueServiceRankDiscoveryIntent $id',
    ({ prompt, fromAction, expectedAction, rescueReason, serviceCategory }) => {
      const rescued = rescueServiceRankDiscoveryIntent(
        prompt,
        fromAction,
        'public',
      );
      expect(rescued).toEqual({
        action: expectedAction,
        rescueReason,
        params: expect.objectContaining({ serviceCategory }),
      });
    },
  );
});

describe('ai-service-rank-discovery.util provider rank rescue (rank-specialist-stays-en)', () => {
  it('isProviderRankDiscoveryPrompt detects specialist and rated-provider cues', () => {
    expect(
      isProviderRankDiscoveryPrompt(
        'Who is the best rated lash specialist this week?',
      ),
    ).toBe(true);
    expect(
      isProviderRankDiscoveryPrompt('Best rated deep tissue massage'),
    ).toBe(true);
    expect(
      isProviderRankDiscoveryPrompt(
        "What's the best premium service for lashes?",
      ),
    ).toBe(false);
  });

  it('extractProviderRankServiceCategoryFromPrompt maps lash specialist', () => {
    expect(
      extractProviderRankServiceCategoryFromPrompt(
        'Who is the best rated lash specialist this week?',
      ),
    ).toBe('lash');
  });

  it.each(SERVICE_RANK_PROVIDER_MISROUTE_RESCUE_SCENARIOS)(
    'rescueServiceRankDiscoveryIntent $id',
    ({ prompt, fromAction, expectedAction, rescueReason, serviceCategory }) => {
      const rescued = rescueServiceRankDiscoveryIntent(
        prompt,
        fromAction,
        'public',
      );
      expect(rescued).toEqual({
        action: expectedAction,
        rescueReason,
        params: expect.objectContaining({ serviceCategory }),
      });
    },
  );
});
