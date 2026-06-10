import {
  BUDGET_CURRENCY_EDGE_SCENARIOS,
  BUDGET_DISAMBIGUATION_SCENARIOS,
  BUDGET_DOMAIN_FIXTURE_IDS,
  BUDGET_DURATION_SCENARIOS,
  BUDGET_HANDLER_OUTCOME_SCENARIOS,
  BUDGET_MAX_PRICE_EXTRACTION_SCENARIOS,
  BUDGET_PROVIDER_NAMED_SCENARIOS,
  BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES,
  BUDGET_SESSION_SCENARIOS,
  BUDGET_VOICE_SCENARIOS,
  SIMILAR_BUDGET_SERVICE_PROMPTS,
} from './ai-budget-service-discovery.fixtures.js';
import {
  applyBudgetDiscoveryToCatalog,
  budgetScenarioAppliesToSurface,
  buildBudgetNoMatchHint,
  buildBudgetListServicesNoMatchSummary,
  enrichBudgetFromPrompt,
  extractMaxPriceFromBudgetPrompt,
  isBudgetAdministrativeOrExplainContext,
  rescueBudgetServiceDiscoveryIntent,
  resolveBudgetCompoundSteps,
  resolveBudgetMisrouteAction,
  resolveBudgetMisrouteActionForSurface,
  resolveBudgetNavigateServiceId,
  shouldExtractBudgetMaxPrice,
} from './ai-budget-service-discovery.util.js';
import {
  FILTER_SERVICES_BY_MAX_PRICE_SCENARIOS,
  SHARED_BUDGET_FILTER_SCENARIO_IDS,
} from './ai-service-catalog-rank.fixtures.js';
import { filterServicesByMaxPrice } from './ai-service-catalog-rank.util.js';

describe('ai-budget-service-discovery.fixtures (budget-1.10)', () => {
  it('ships classifier rules with maxPrice semantics', () => {
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain('maxPrice');
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain('discover_packages');
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain('gift card');
  });

  it('has at least 40 unique scenario ids', () => {
    const ids = SIMILAR_BUDGET_SERVICE_PROMPTS.map((scenario) => scenario.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(40);
  });

  it.each(SIMILAR_BUDGET_SERVICE_PROMPTS)(
    'scenario $id has required fixture fields',
    ({ id, prompt, surface, expectedAction }) => {
      expect(id).toBeTruthy();
      expect(prompt.trim().length).toBeGreaterThan(0);
      expect(['public', 'customer', 'both']).toContain(surface);
      expect(expectedAction.trim().length).toBeGreaterThan(0);
    },
  );
});

describe('ai-budget-service-discovery.fixtures sections I–L (budget-1.12)', () => {
  it('ships section H voice/mobile scenarios', () => {
    expect(BUDGET_VOICE_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'budget-voice-short-en',
      'budget-voice-no-verb-en',
      'budget-voice-asr-en',
      'budget-voice-chip-en',
      'budget-question-en',
      'budget-voice-whisper-en',
    ]);
  });

  it('ships section I session multi-turn scenarios', () => {
    expect(BUDGET_SESSION_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'budget-session-raise-en',
      'budget-session-service-switch-en',
      'budget-session-after-list-en',
      'budget-session-stale-service-en',
    ]);
  });

  it('ships section J currency edge scenarios', () => {
    expect(BUDGET_CURRENCY_EDGE_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'budget-range-en',
      'budget-round-number-en',
      'budget-tenant-amd-en',
      'budget-zero-en',
      'budget-large-en',
      'budget-currency-comma-en',
    ]);
  });

  it('ships section K provider/named service scenarios', () => {
    expect(BUDGET_PROVIDER_NAMED_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'budget-named-service-en',
      'budget-any-provider-en',
      'budget-provider-no-match-en',
    ]);
  });

  it('ships section L duration hooks', () => {
    expect(BUDGET_DURATION_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'budget-short-service-en',
      'budget-long-massage-en',
    ]);
    expect(BUDGET_DURATION_SCENARIOS.every((scenario) => scenario.phase2)).toBe(
      true,
    );
  });

  it('has at least 40 unique ids across the budget domain', () => {
    expect(BUDGET_DOMAIN_FIXTURE_IDS.length).toBeGreaterThanOrEqual(40);
    expect(BUDGET_DOMAIN_FIXTURE_IDS.length).toBe(52);
  });

  it.each(BUDGET_VOICE_SCENARIOS)(
    'voice scenario $id extracts maxPrice when expected',
    ({ id, prompt, expectedParams, skipMaxPrice }) => {
      if (skipMaxPrice || expectedParams?.maxPrice == null) return;
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(
        expectedParams.maxPrice,
      );
      expect(id).toBeTruthy();
    },
  );

  it.each(BUDGET_CURRENCY_EDGE_SCENARIOS.filter((scenario) => !scenario.phase2))(
    'currency edge scenario $id extracts maxPrice',
    ({ prompt, expectedParams }) => {
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(
        expectedParams!.maxPrice,
      );
    },
  );
});

describe('ai-budget-service-discovery.util (budget-1.10)', () => {
  it.each(BUDGET_MAX_PRICE_EXTRACTION_SCENARIOS)(
    'extractMaxPriceFromBudgetPrompt $id',
    ({ prompt, maxPrice, skipMaxPrice }) => {
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(maxPrice);
      expect(shouldExtractBudgetMaxPrice(prompt)).toBe(!skipMaxPrice);
    },
  );

  it.each(BUDGET_DISAMBIGUATION_SCENARIOS)(
    'resolveBudgetMisrouteAction customer $id',
    ({ prompt, expectedAction }) => {
      expect(resolveBudgetMisrouteAction(prompt)).toBe(expectedAction);
      expect(resolveBudgetMisrouteActionForSurface(prompt, 'customer')).toBe(
        expectedAction,
      );
    },
  );

  it.each(BUDGET_DISAMBIGUATION_SCENARIOS.filter(
    (scenario) => scenario.surface !== 'customer',
  ))(
    'resolveBudgetMisrouteActionForSurface public $id',
    ({ prompt, expectedAction, id }) => {
      const publicAction = resolveBudgetMisrouteActionForSurface(
        prompt,
        'public',
      );
      if (expectedAction === 'explain_checkout_currency') {
        expect(publicAction).toBe('explain_checkout_currency');
        return;
      }
      expect(publicAction).toBe('booking_help');
      expect(id).toBeTruthy();
    },
  );

  it.each(BUDGET_DISAMBIGUATION_SCENARIOS)(
    'resolveBudgetMisrouteActionForSurface dashboard $id',
    ({ prompt, expectedAction }) => {
      const dashboardAction = resolveBudgetMisrouteActionForSurface(
        prompt,
        'dashboard',
      );
      if (expectedAction === 'explain_checkout_currency') {
        expect(dashboardAction).toBe('explain_checkout_currency');
        return;
      }
      if (expectedAction === 'discover_packages') {
        expect(dashboardAction).toBe('list_packages');
        return;
      }
      if (expectedAction === 'apply_gift_card_code') {
        expect(dashboardAction).toBe('validate_gift_card');
        return;
      }
      if (expectedAction === 'discover_subscription_plans') {
        expect(dashboardAction).toBe('list_subscription_plans');
      }
    },
  );

  it('rescues dashboard package prompts to list_packages', () => {
    const prompt = 'Any spa packages under $100?';
    expect(
      rescueBudgetServiceDiscoveryIntent(prompt, 'list_services', 'dashboard'),
    ).toEqual({
      action: 'list_packages',
      rescueReason: 'discover_packages',
    });
  });

  it.each(BUDGET_HANDLER_OUTCOME_SCENARIOS)(
    'applyBudgetDiscoveryToCatalog $id',
    ({ services, maxPrice, serviceCategory, expectedIds }) => {
      const matches = applyBudgetDiscoveryToCatalog(services, {
        maxPrice,
        serviceCategory,
      });
      expect(matches.map((service) => service.id)).toEqual(expectedIds);
    },
  );

  it.each(SHARED_BUDGET_FILTER_SCENARIO_IDS)(
    'shared budget/rank filter scenario %s matches sort util',
    (scenarioId) => {
      const filterScenario = FILTER_SERVICES_BY_MAX_PRICE_SCENARIOS.find(
        (scenario) => scenario.id === scenarioId,
      )!;
      const budgetScenario = BUDGET_HANDLER_OUTCOME_SCENARIOS.find(
        (scenario) => scenario.id === scenarioId,
      )!;

      expect(
        filterServicesByMaxPrice(
          filterScenario.services,
          filterScenario.maxPrice,
        ).map((service) => service.id),
      ).toEqual(budgetScenario.expectedIds);
    },
  );

  it.each(BUDGET_HANDLER_OUTCOME_SCENARIOS.filter(
    (scenario) => scenario.expectedNavigateServiceId !== undefined,
  ))(
    'resolveBudgetNavigateServiceId $id',
    ({ services, maxPrice, serviceCategory, expectedNavigateServiceId }) => {
      const matches = applyBudgetDiscoveryToCatalog(services, {
        maxPrice,
        serviceCategory,
      });
      expect(resolveBudgetNavigateServiceId(matches)).toBe(
        expectedNavigateServiceId,
      );
    },
  );

  it('buildBudgetNoMatchHint names cheapest option above budget', () => {
    const scenario = BUDGET_HANDLER_OUTCOME_SCENARIOS.find(
      (entry) => entry.id === 'budget-no-match-cheapest-hint',
    );
    expect(scenario).toBeDefined();
    const hint = buildBudgetNoMatchHint(scenario!.services, scenario!.maxPrice);
    expect(hint).toContain('Nothing under $50');
    expect(hint).toContain('Haircut standard');
    expect(hint).toContain('$55');
  });

  it('buildBudgetListServicesNoMatchSummary lists closest alternatives', () => {
    const scenario = BUDGET_HANDLER_OUTCOME_SCENARIOS.find(
      (entry) => entry.id === 'budget-no-match-cheapest-hint',
    );
    expect(scenario).toBeDefined();
    const summary = buildBudgetListServicesNoMatchSummary(
      scenario!.services,
      scenario!.maxPrice,
    );
    expect(summary).toContain('Nothing under $50');
    expect(summary).toContain('Closest options');
    expect(summary).toContain('Haircut standard');
    expect(summary).toContain('Haircut deluxe');
  });

  it.each(BUDGET_SESSION_SCENARIOS)(
    'enrichBudgetFromPrompt session turn params for $id',
    ({ turns }) => {
      let params: Record<string, unknown> = {};
      for (const turn of turns) {
        params = enrichBudgetFromPrompt(params, turn.prompt);
        if (turn.expectedParams?.maxPrice != null) {
          expect(params.maxPrice).toBe(turn.expectedParams.maxPrice);
        }
      }
    },
  );

  it('enrichBudgetFromPrompt strips maxPrice for gift card prompts', () => {
    expect(
      enrichBudgetFromPrompt(
        { maxPrice: 50 },
        'I have a $50 gift card for a haircut',
      ).maxPrice,
    ).toBeUndefined();
  });

  it.each(BUDGET_DISAMBIGUATION_SCENARIOS)(
    'shouldExtractBudgetMaxPrice false for disambiguation $id',
    ({ prompt }) => {
      expect(shouldExtractBudgetMaxPrice(prompt)).toBe(false);
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBeNull();
    },
  );

  it.each(BUDGET_DISAMBIGUATION_SCENARIOS)(
    'rescueBudgetServiceDiscoveryIntent customer $id',
    ({ prompt, expectedAction }) => {
      expect(
        rescueBudgetServiceDiscoveryIntent(prompt, 'list_services', 'customer'),
      ).toEqual({
        action: expectedAction,
        rescueReason: resolveBudgetMisrouteAction(prompt),
      });
    },
  );

  it.each(BUDGET_DISAMBIGUATION_SCENARIOS.filter(
    (scenario) => scenario.surface !== 'customer',
  ))(
    'rescueBudgetServiceDiscoveryIntent public $id',
    ({ prompt, expectedAction }) => {
      const rescued = rescueBudgetServiceDiscoveryIntent(
        prompt,
        'list_services',
        'public',
      );
      expect(rescued?.rescueReason).toBe(resolveBudgetMisrouteAction(prompt));
      if (expectedAction === 'explain_checkout_currency') {
        expect(rescued?.action).toBe('explain_checkout_currency');
      } else {
        expect(rescued?.action).toBe('booking_help');
      }
    },
  );

  it('rescues list_services from unknown budget prompt', () => {
    expect(
      rescueBudgetServiceDiscoveryIntent(
        'What can I book with $30?',
        'unknown',
      ),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'budget_list_services',
    });
  });

  it('rescues recommend_specialists for rated + budget prompt', () => {
    expect(
      rescueBudgetServiceDiscoveryIntent(
        'Best rated massage under $100 this week',
        'unknown',
      ),
    ).toEqual({
      action: 'recommend_specialists',
      rescueReason: 'budget_recommend_specialists',
    });
  });

  it('keeps list_services for premium service catalog rank under budget (rank-1.5)', () => {
    expect(
      rescueBudgetServiceDiscoveryIntent(
        'Best premium haircut under $80',
        'list_services',
      ),
    ).toBeNull();
    expect(
      rescueBudgetServiceDiscoveryIntent(
        'Best premium haircut under $80',
        'unknown',
      ),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'rank_list_services',
    });
  });

  it.each(
    SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
      (scenario) => scenario.publicCompoundSteps?.length,
    ),
  )('resolveBudgetCompoundSteps public $id', (scenario) => {
    expect(resolveBudgetCompoundSteps(scenario, 'public')).toEqual(
      scenario.publicCompoundSteps,
    );
    expect(resolveBudgetCompoundSteps(scenario, 'customer')).toEqual(
      scenario.customerCompoundSteps,
    );
  });

  it('budgetScenarioAppliesToSurface respects both/public/customer tags', () => {
    expect(
      budgetScenarioAppliesToSurface({ surface: 'both' }, 'public'),
    ).toBe(true);
    expect(
      budgetScenarioAppliesToSurface({ surface: 'customer' }, 'public'),
    ).toBe(false);
    expect(
      budgetScenarioAppliesToSurface({ surface: 'customer' }, 'customer'),
    ).toBe(true);
  });
});

describe('budget negative routing for accuracy eval (acc-2)', () => {
  const blockedPrompts = [
    'Explain business tax with an example breakdown on $100',
    'Why does the gift card purchase email show dollars?',
    'Why is the spa package total in dollars?',
    'Do any categories or packages still have translations in disabled locales?',
    'Bulk remove Russian translations from services and packages',
    'Sample gift card expiry email with our date settings',
    'Preview a sample confirmation email with our current date format',
    'What name do Russian visitors see for the Spa Day package on public booking?',
    'Mark City Tour as a tour with max 12 people',
  ];

  it.each(blockedPrompts)('does not budget-rescue administrative prompt %p', (prompt) => {
    expect(isBudgetAdministrativeOrExplainContext(prompt)).toBe(true);
    expect(extractMaxPriceFromBudgetPrompt(prompt)).toBeNull();
    expect(rescueBudgetServiceDiscoveryIntent(prompt, 'unknown')).toBeNull();
    expect(rescueBudgetServiceDiscoveryIntent(prompt, 'list_services')).toBeNull();
  });

  it('does not treat provider availability "free" as budget maxPrice', () => {
    const prompt =
      'which providers are free tomorrow for permanent lashes, then book nearest slot';
    expect(isBudgetAdministrativeOrExplainContext(prompt)).toBe(false);
    expect(extractMaxPriceFromBudgetPrompt(prompt)).toBeNull();
  });

  it('still rescues genuine budget discovery prompts', () => {
    expect(rescueBudgetServiceDiscoveryIntent('What can I book with $30?', 'unknown')).toEqual({
      action: 'list_services',
      rescueReason: 'budget_list_services',
    });
  });
});
