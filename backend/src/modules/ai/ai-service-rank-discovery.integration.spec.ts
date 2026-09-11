import {
  SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES,
  RANK_SESSION_SCENARIOS,
  SERVICE_RANK_EXTRACTION_SCENARIOS,
  SERVICE_RANK_PROVIDER_MISROUTE_RESCUE_SCENARIOS,
  SERVICE_RANK_RECOMMEND_SPECIALISTS_RESCUE_SCENARIOS,
  SERVICE_RANK_ADMIN_ANALYTICS_RESCUE_SCENARIOS,
  SERVICE_RANK_PACKAGE_RESCUE_SCENARIOS,
  SERVICE_RANK_SUBJECTIVE_RESCUE_SCENARIOS,
  SIMILAR_SERVICE_RANK_PROMPTS,
} from './ai-service-rank-discovery.fixtures.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-intent-heuristics.js';
import { enrichRankSessionParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import { RANK_SESSION_PICK_CATALOG } from './ai-rank-list-services.fixtures.js';
import {
  buildRankedServicesFromSessionContext,
  serializeRankedServiceIds,
} from './ai-rank-session-pick.util.js';
import {
  enrichServiceRankFromPrompt,
  isRankSessionBudgetRefinePrompt,
  isRankSessionUpgradePrompt,
  rescueServiceRankDiscoveryIntent,
  rescueServiceRankFromRecommendSpecialistsIntent,
} from './ai-service-rank-discovery.util.js';
import {
  enrichBudgetFromPrompt,
  extractMaxPriceFromBudgetPrompt,
  rescueBudgetServiceDiscoveryIntent,
} from './ai-budget-service-discovery.util.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-assistant.service.js';

describe('ai service rank discovery classifier wiring (rank-1.2)', () => {
  it('includes serviceRank rules and param in public and customer schemas', () => {
    const publicSchema = buildPublicClassifierSchema();
    const customerSchema = buildCustomerClassifierSchema();
    const sampleRule = SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES.slice(0, 80);

    expect(publicSchema).toContain('"serviceRank"');
    expect(customerSchema).toContain('"serviceRank"');
    expect(publicSchema).toContain('highest_price');
    expect(publicSchema).toContain('lowest_price');
    expect(publicSchema).toContain('most_popular');
    expect(customerSchema).toContain('highest_price');
    expect(customerSchema).toContain('lowest_price');
    expect(customerSchema).toContain('most_popular');
    expect(publicSchema).toContain(sampleRule);
    expect(customerSchema).toContain(sampleRule);
    expect(publicSchema).toContain(
      'What is the best and premium haircut service?',
    );
    expect(customerSchema).toContain("What's the cheapest haircut you offer?");
    expect(publicSchema).toContain(
      'recommend_specialists, serviceCategory=massage — NO serviceRank',
    );
  });

  it('documents service vs specialist disambiguation in rank rules', () => {
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain(
      'recommend_specialists',
    );
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain(
      'serviceRank=highest_price',
    );
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain(
      'serviceRank=lowest_price',
    );
  });
});

describe('ai service rank discovery post-LLM rescue (rank-1.3)', () => {
  it.each(
    SERVICE_RANK_EXTRACTION_SCENARIOS.filter(
      (scenario) => scenario.serviceRank,
    ),
  )(
    'enrichServiceRankFromPrompt sets serviceRank for $id',
    ({ prompt, serviceRank }) => {
      expect(enrichServiceRankFromPrompt({}, prompt).serviceRank).toBe(
        serviceRank,
      );
    },
  );

  it('enrichPublicAssistantParamsFromPrompt enriches premium rank on list_services', () => {
    const enriched = enrichPublicAssistantParamsFromPrompt(
      "What's your luxury massage option?",
      { serviceCategory: 'massage' },
      [{ id: 'm1', name: 'Swedish massage' }],
      'list_services',
    );
    expect(enriched.serviceRank).toBe('highest_price');
  });

  it('customer enrichServiceRankFromPrompt strips rank for specialist prompts', () => {
    expect(
      enrichServiceRankFromPrompt(
        { serviceRank: 'highest_price' },
        'Who is the best rated lash specialist this week?',
      ).serviceRank,
    ).toBeUndefined();
  });
});

describe('ai service rank recommend_specialists guard (rank-1.5)', () => {
  it.each(SERVICE_RANK_RECOMMEND_SPECIALISTS_RESCUE_SCENARIOS)(
    'rescue pipeline $id',
    ({ prompt, fromAction, expectedAction, rescueReason }) => {
      const budgetRescue = rescueBudgetServiceDiscoveryIntent(
        prompt,
        fromAction,
        'public',
      );
      const resolvedAction = budgetRescue?.action ?? fromAction;
      const rankRescue = rescueServiceRankFromRecommendSpecialistsIntent(
        prompt,
        resolvedAction,
      );
      const rescued = rankRescue ?? budgetRescue;

      expect(rescued?.action ?? fromAction).toBe(expectedAction);
      if (rescueReason) {
        expect(rescued?.rescueReason).toBe(rescueReason);
      } else {
        expect(rescued).toBeNull();
      }
    },
  );

  it('enriches serviceRank after rescuing recommend_specialists to list_services', () => {
    const prompt = "What's the best premium service for lashes?";
    const rescued = rescueServiceRankFromRecommendSpecialistsIntent(
      prompt,
      'recommend_specialists',
    );
    expect(rescued).toEqual({
      action: 'list_services',
      rescueReason: 'rank_recommend_specialists',
    });
    expect(enrichServiceRankFromPrompt({}, prompt).serviceRank).toBe(
      'highest_price',
    );
  });
});

describe('ai service rank admin analytics guard (rank-not-analyze-*-en)', () => {
  it.each(SERVICE_RANK_ADMIN_ANALYTICS_RESCUE_SCENARIOS)(
    'rescueServiceRankDiscoveryIntent dashboard $id',
    ({ prompt, fromAction, expectedAction, rescueReason }) => {
      const rescued = rescueServiceRankDiscoveryIntent(
        prompt,
        fromAction,
        'dashboard',
      );
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);
    },
  );

  it('rank-not-analyze-services-admin-en fixture stays analyze_services', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-not-analyze-services-admin-en',
    )!;
    expect(scenario.expectedAction).toBe('analyze_services');
    expect(
      enrichServiceRankFromPrompt(
        { serviceRank: 'most_popular' },
        scenario.prompt,
      ).serviceRank,
    ).toBeUndefined();
    expect(
      rescueServiceRankDiscoveryIntent(
        scenario.prompt,
        'list_services',
        'dashboard',
      ),
    ).toEqual({
      action: 'analyze_services',
      rescueReason: 'rank_to_analyze_services',
      params: { serviceMetric: 'most_booked' },
    });
  });

  it('rank-not-analyze-appt-en fixture stays analyze_appointments', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-not-analyze-appt-en',
    )!;
    expect(scenario.expectedAction).toBe('analyze_appointments');
    expect(
      enrichServiceRankFromPrompt(
        { serviceRank: 'highest_price' },
        scenario.prompt,
      ).serviceRank,
    ).toBeUndefined();
    expect(
      rescueServiceRankDiscoveryIntent(
        scenario.prompt,
        'list_services',
        'dashboard',
      ),
    ).toEqual({
      action: 'analyze_appointments',
      rescueReason: 'rank_to_analyze_appointments',
      params: {},
    });
  });
});

describe('ai service rank package guard (rank-not-package-en)', () => {
  it('documents package disambiguation in rank classifier rules', () => {
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain(
      'discover_packages',
    );
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain(
      "What's your premium spa package?",
    );
  });

  it('rank-not-package-en fixture blocks catalog rank and rescues to package discovery', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-not-package-en',
    )!;
    expect(scenario.expectedAction).toBe('discover_packages');
    expect(
      enrichServiceRankFromPrompt(
        { serviceRank: 'highest_price' },
        scenario.prompt,
      ).serviceRank,
    ).toBeUndefined();
    expect(
      rescueServiceRankDiscoveryIntent(
        scenario.prompt,
        'list_services',
        'public',
      ),
    ).toEqual({
      action: 'booking_help',
      rescueReason: 'discover_packages',
      params: {},
    });
    expect(
      rescueServiceRankDiscoveryIntent(
        scenario.prompt,
        'list_services',
        'customer',
      ),
    ).toEqual({
      action: 'discover_packages',
      rescueReason: 'discover_packages',
      params: {},
    });
  });

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
    },
  );
});

describe('ai service rank mid-range browse (rank-mid-range-en)', () => {
  it('rank-mid-range-en fixture lists color without catalog rank', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-mid-range-en',
    )!;
    expect(scenario.phase2).toBeUndefined();
    expect(scenario.expectedParams).toEqual({
      serviceCategory: 'color',
      limit: 3,
    });
    expect(
      rescueServiceRankDiscoveryIntent(
        scenario.prompt,
        'list_services',
        'public',
      ),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'rank_mid_range_list',
      params: { serviceCategory: 'color', limit: 3 },
    });
  });
});

describe('ai service rank voice premium (rank-voice-premium-en)', () => {
  it('rank-voice-premium-en fixture maps short prompt to premium haircut', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-voice-premium-en',
    )!;
    expect(scenario.surface).toBe('customer');
    expect(
      rescueServiceRankDiscoveryIntent(scenario.prompt, 'unknown', 'customer'),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'rank_list_services',
      // e2e-bug.524 — 'Premium cut?' says "cut", never "haircut", and
      // RANK_SERVICE_CATEGORY_ALIASES deliberately does NOT alias bare
      // 'cut' -> 'haircut' (e2e-bug.323: pre-aliasing discards the raw token
      // before matchServicesByQuery runs, so its literal-substring-first
      // expansion can no longer prefer real rows named "Men's cut"). Only the
      // plural folds, 'cuts' -> 'cut'. This expectation predates that decision.
      params: {
        serviceRank: 'highest_price',
        serviceCategory: 'cut',
      },
    });
  });
});

describe('ai service rank voice cheapest (rank-voice-cheapest-en)', () => {
  it('rank-voice-cheapest-en fixture maps colloquial prompt to lowest_price facial', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-voice-cheapest-en',
    )!;
    expect(scenario.expectedParams).toEqual({
      serviceCategory: 'facial',
      serviceRank: 'lowest_price',
    });
    expect(
      rescueServiceRankDiscoveryIntent(scenario.prompt, 'unknown', 'customer'),
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

describe('ai service rank recommend not provider (rank-recommend-not-provider-en)', () => {
  it('rank-recommend-not-provider-en fixture rescues recommend_specialists to catalog rank', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-recommend-not-provider-en',
    )!;
    expect(scenario.expectedParams).toEqual({
      serviceCategory: 'spa',
      serviceRank: 'highest_price',
    });
    expect(
      rescueServiceRankDiscoveryIntent(
        scenario.prompt,
        'recommend_specialists',
        'public',
      ),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'rank_recommend_specialists',
      params: {
        serviceRank: 'highest_price',
        serviceCategory: 'spa',
      },
    });
  });
});

describe('ai service rank most popular (rank-most-popular-en)', () => {
  it('rank-most-popular-en fixture enriches most_popular and haircut category', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-most-popular-en',
    )!;
    expect(scenario.expectedParams).toEqual({
      serviceCategory: 'haircut',
      serviceRank: 'most_popular',
    });
    expect(enrichServiceRankFromPrompt({}, scenario.prompt).serviceRank).toBe(
      'most_popular',
    );
    expect(
      rescueServiceRankDiscoveryIntent(scenario.prompt, 'unknown', 'public'),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'rank_list_services',
      params: {
        serviceRank: 'most_popular',
        serviceCategory: 'haircut',
      },
    });
  });
});

describe('ai service rank tier metadata filter (rank-tier-metadata-en)', () => {
  it('rank-tier-metadata-en fixture filters by premium tier without catalog rank', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-tier-metadata-en',
    )!;
    expect(scenario.expectedParams).toEqual({
      serviceCategory: 'color',
      serviceTier: 'premium',
    });
    expect(
      enrichServiceRankFromPrompt(
        { serviceRank: 'highest_price' },
        scenario.prompt,
      ).serviceRank,
    ).toBeUndefined();
    expect(
      rescueServiceRankDiscoveryIntent(
        scenario.prompt,
        'list_services',
        'customer',
      ),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'rank_tier_filter',
      params: { serviceTier: 'premium', serviceCategory: 'color' },
    });
  });
});

describe('ai service rank list-then-book compound (rank-list-then-book-en)', () => {
  it('rank-list-then-book-en fixture is a rank compound without phase2', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-list-then-book-en',
    )!;
    expect(scenario.phase2).toBeUndefined();
    expect(scenario.publicCompoundSteps).toEqual([
      'list_services',
      'book_appointment',
    ]);
    expect(scenario.customerCompoundSteps).toEqual([
      'list_services',
      'book_nearest_slot',
    ]);
    expect(scenario.expectedParams?.serviceRank).toBe('highest_price');
    expect(scenario.expectedParams?.serviceCategory).toBe('massage');
  });
});

describe('ai service rank subjective rescue (rank-best-for-me-en)', () => {
  it.each(SERVICE_RANK_SUBJECTIVE_RESCUE_SCENARIOS)(
    'rescueServiceRankDiscoveryIntent $id',
    ({ prompt, fromAction, expectedAction, rescueReason, serviceCategory }) => {
      const rescued = rescueServiceRankDiscoveryIntent(
        prompt,
        fromAction,
        'customer',
      );
      expect(rescued).toEqual({
        action: expectedAction,
        rescueReason,
        params: expect.objectContaining({ serviceCategory }),
      });
    },
  );

  it('rank-best-for-me-en fixture routes to booking_help without serviceRank', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-best-for-me-en',
    )!;
    expect(scenario.subjectiveRank).toBe(true);
    expect(scenario.clarify).toBeUndefined();
    expect(scenario.expectedAction).toBe('booking_help');
    expect(
      enrichServiceRankFromPrompt(
        { serviceRank: 'highest_price' },
        scenario.prompt,
      ).serviceRank,
    ).toBeUndefined();
    expect(
      rescueServiceRankDiscoveryIntent(
        scenario.prompt,
        'list_services',
        'public',
      ),
    ).toEqual({
      action: 'booking_help',
      rescueReason: 'rank_subjective_booking_help',
      params: expect.objectContaining({
        serviceCategory: scenario.expectedParams?.serviceCategory,
      }),
    });
  });
});

describe('ai service rank provider rank misroute rescue (rank-specialist-stays-en)', () => {
  it.each(SERVICE_RANK_PROVIDER_MISROUTE_RESCUE_SCENARIOS)(
    'rescueServiceRankDiscoveryIntent $id',
    ({ prompt, fromAction, expectedAction, rescueReason, serviceCategory }) => {
      const rescued = rescueServiceRankDiscoveryIntent(
        prompt,
        fromAction,
        'customer',
      );
      expect(rescued).toEqual({
        action: expectedAction,
        rescueReason,
        params: expect.objectContaining({ serviceCategory }),
      });
    },
  );

  it('rank-specialist-stays-en fixture stays recommend_specialists with providerRank', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-specialist-stays-en',
    )!;
    expect(scenario.providerRank).toBe(true);
    expect(scenario.blocked).toBeUndefined();
    expect(scenario.expectedAction).toBe('recommend_specialists');
    expect(
      enrichServiceRankFromPrompt(
        { serviceRank: 'highest_price' },
        scenario.prompt,
      ).serviceRank,
    ).toBeUndefined();
    expect(
      rescueServiceRankFromRecommendSpecialistsIntent(
        scenario.prompt,
        'recommend_specialists',
      ),
    ).toBeNull();
  });
});

describe('ai service rank discovery session flows (rank-1.12 / discover-exit-1)', () => {
  it.each(
    RANK_SESSION_SCENARIOS.filter((scenario) =>
      ['rank-session-upgrade-en', 'rank-session-then-budget-en'].includes(
        scenario.id,
      ),
    ),
  )(
    'enrichRankSessionParamsFromPrompt merges full session params for $id',
    ({ turns }) => {
      let params: Record<string, unknown> = {};
      for (const turn of turns) {
        params = enrichRankSessionParamsFromPrompt(params, turn.prompt);
        expect(params).toMatchObject(turn.expectedParams ?? {});
      }
    },
  );

  it('rank-session-upgrade-en rescues T2 rank switch to list_services', () => {
    const scenario = RANK_SESSION_SCENARIOS.find(
      (entry) => entry.id === 'rank-session-upgrade-en',
    )!;
    const turn1 = enrichRankSessionParamsFromPrompt(
      {},
      scenario.turns[0].prompt,
    );
    expect(turn1).toMatchObject({
      serviceCategory: 'haircut',
      serviceRank: 'lowest_price',
    });

    const turn2Prompt = scenario.turns[1].prompt;
    expect(isRankSessionUpgradePrompt(turn2Prompt)).toBe(true);
    const turn2 = enrichRankSessionParamsFromPrompt(turn1, turn2Prompt);
    expect(turn2).toMatchObject({
      serviceCategory: 'haircut',
      serviceRank: 'highest_price',
    });
    expect(
      rescueServiceRankDiscoveryIntent(turn2Prompt, 'unknown', 'public'),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'rank_list_services',
      params: { serviceRank: 'highest_price' },
    });
  });

  it('rank-session-pick-one-en picks second ranked massage on turn 2', () => {
    const scenario = RANK_SESSION_SCENARIOS.find(
      (entry) => entry.id === 'rank-session-pick-one-en',
    )!;
    const turn1 = enrichRankSessionParamsFromPrompt(
      {},
      scenario.turns[0].prompt,
    );
    expect(turn1).toMatchObject(scenario.turns[0].expectedParams);

    const ranked = buildRankedServicesFromSessionContext(
      turn1,
      RANK_SESSION_PICK_CATALOG,
      scenario.turns[0].prompt,
    );
    const session = {
      ...turn1,
      rankedServiceIds: serializeRankedServiceIds(
        ranked.map((service) => service.id),
      ),
    };
    const catalog = RANK_SESSION_PICK_CATALOG.map((service) => ({
      id: service.id,
      name: service.name,
    }));
    const turn2 = enrichPublicAssistantParamsFromPrompt(
      scenario.turns[1].prompt,
      session,
      catalog,
      'book_appointment',
    );
    expect(turn2).toMatchObject(scenario.turns[1].expectedParams);
    expect(scenario.turns[1].expectedAction).toBe('book_appointment');
  });

  it('rank-session-then-budget-en intersects prior rank with new maxPrice on T2', () => {
    const scenario = RANK_SESSION_SCENARIOS.find(
      (entry) => entry.id === 'rank-session-then-budget-en',
    )!;
    const turn1 = enrichRankSessionParamsFromPrompt(
      {},
      scenario.turns[0].prompt,
    );
    expect(turn1).toMatchObject({
      serviceCategory: 'facial',
      serviceRank: 'highest_price',
    });

    const turn2Prompt = scenario.turns[1].prompt;
    expect(isRankSessionBudgetRefinePrompt(turn2Prompt)).toBe(true);
    expect(extractMaxPriceFromBudgetPrompt(turn2Prompt)).toBe(120);
    const turn2 = enrichRankSessionParamsFromPrompt(turn1, turn2Prompt);
    expect(turn2).toMatchObject({
      serviceCategory: 'facial',
      serviceRank: 'highest_price',
      maxPrice: 120,
    });
  });
});
