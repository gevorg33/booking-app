import {
  BUDGET_CURRENCY_EDGE_SCENARIOS,
  BUDGET_DISAMBIGUATION_SCENARIOS,
  BUDGET_DOMAIN_FIXTURE_IDS,
  BUDGET_DURATION_SCENARIOS,
  BUDGET_HANDLER_OUTCOME_SCENARIOS,
  BUDGET_CART_TOTAL_EXTRACTION_SCENARIOS,
  BUDGET_PROMO_EXTRACTION_SCENARIOS,
  BUDGET_RANGE_EXTRACTION_SCENARIOS,
  BUDGET_NAMED_SERVICE_EXTRACTION_SCENARIOS,
  BUDGET_ANY_PROVIDER_EXTRACTION_SCENARIOS,
  BUDGET_PROVIDER_EMPLOYEE_EXTRACTION_SCENARIOS,
  BUDGET_SHORT_DURATION_EXTRACTION_SCENARIOS,
  BUDGET_LONG_DURATION_EXTRACTION_SCENARIOS,
  BUDGET_VOICE_ASR_EXTRACTION_SCENARIOS,
  BUDGET_MAX_PRICE_EXTRACTION_SCENARIOS,
  BUDGET_PROVIDER_NAMED_SCENARIOS,
  BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES,
  BUDGET_SESSION_SCENARIOS,
  BUDGET_VOICE_SCENARIOS,
  SIMILAR_BUDGET_SERVICE_PROMPTS,
} from './ai-budget-service-discovery.fixtures.js';
import { rescueCheckoutCurrencyIntent } from './ai-checkout-currency.util.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import {
  applyBudgetDiscoveryToCatalog,
  applyBudgetFilterToMatchedServices,
  budgetScenarioAppliesToSurface,
  buildBudgetNoMatchHint,
  buildBudgetListServicesNoMatchSummary,
  enrichBudgetFromPrompt,
  extractBudgetCartServiceCountFromPrompt,
  extractBudgetEmployeeNameFromPrompt,
  extractBudgetNamedServiceFromPrompt,
  extractBudgetPromoCodeFromPrompt,
  isBudgetShortServicePrompt,
  isBudgetLongServicePrompt,
  extractBudgetMinDurationMinutesFromPrompt,
  extractMinPriceFromBudgetPrompt,
  extractMaxPriceFromBudgetPrompt,
  isBudgetAnyProviderListPrompt,
  isBudgetPriceRangePrompt,
  extractMaxTotalPriceFromBudgetPrompt,
  isBudgetCartTotalPrompt,
  isBudgetSubscriptionBalancePrompt,
  isBudgetWithPromoPrompt,
  isBudgetAdministrativeOrExplainContext,
  isBudgetGiftCardMisroute,
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
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain('minPrice');
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain('discover_packages');
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain('gift card');
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain('her cut');
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain(
      'preferShortDuration',
    );
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain(
      'minDurationMinutes',
    );
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain('employeeName');
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
      'budget-session-stale-budget-en',
      'budget-session-list-then-pick-en',
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
    expect(
      BUDGET_DURATION_SCENARIOS.filter((scenario) => scenario.phase2).map(
        (scenario) => scenario.id,
      ),
    ).toEqual([]);
  });

  it('has at least 40 unique ids across the budget domain', () => {
    expect(BUDGET_DOMAIN_FIXTURE_IDS.length).toBeGreaterThanOrEqual(40);
    expect(BUDGET_DOMAIN_FIXTURE_IDS.length).toBe(58);
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
      const misroute = resolveBudgetMisrouteAction(prompt);
      if (
        expectedAction === 'explain_checkout_currency' &&
        misroute == null
      ) {
        expect(
          rescueCheckoutCurrencyIntent(prompt, 'list_services'),
        ).toEqual({
          action: 'explain_checkout_currency',
          rescueReason: 'explain_checkout_currency',
        });
        return;
      }
      expect(misroute).toBe(expectedAction);
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
      const misroute = resolveBudgetMisrouteAction(prompt);
      if (
        expectedAction === 'explain_checkout_currency' &&
        misroute == null
      ) {
        expect(
          rescueCheckoutCurrencyIntent(prompt, 'list_services'),
        ).toEqual({
          action: 'explain_checkout_currency',
          rescueReason: 'explain_checkout_currency',
        });
        return;
      }
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
      const misroute = resolveBudgetMisrouteAction(prompt);
      if (
        expectedAction === 'explain_checkout_currency' &&
        misroute == null
      ) {
        expect(
          rescueCheckoutCurrencyIntent(prompt, 'list_services'),
        ).toEqual({
          action: 'explain_checkout_currency',
          rescueReason: 'explain_checkout_currency',
        });
        return;
      }
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

  it('does not misroute provider package appointments today to list_packages', () => {
    const prompt = 'Show my package appointments today';
    expect(
      rescueBudgetServiceDiscoveryIntent(prompt, 'unknown', 'dashboard'),
    ).toBeNull();
  });

  it.each(
    BUDGET_HANDLER_OUTCOME_SCENARIOS.filter(
      (scenario) => scenario.id === 'budget-short-service-en',
    ),
  )(
    'applyBudgetFilterToMatchedServices preferShortDuration $id',
    ({
      services,
      maxPrice,
      serviceCategory,
      preferShortDuration,
      expectedIds,
    }) => {
      const categorized = applyBudgetDiscoveryToCatalog(services, {
        maxPrice,
        serviceCategory,
      });
      const matches = applyBudgetFilterToMatchedServices(
        categorized,
        maxPrice,
        undefined,
        preferShortDuration,
      );
      expect(matches.map((service) => service.id)).toEqual(expectedIds);
    },
  );

  it.each(
    BUDGET_HANDLER_OUTCOME_SCENARIOS.filter(
      (scenario) =>
        scenario.maxPrice != null &&
        scenario.expectedIds != null &&
        scenario.expectedIds.length > 0 &&
        !scenario.serviceName &&
        !scenario.preferShortDuration &&
        scenario.minDurationMinutes == null,
    ),
  )(
    'applyBudgetDiscoveryToCatalog $id',
    ({ services, maxPrice, minPrice, serviceCategory, expectedIds }) => {
      const matches = applyBudgetDiscoveryToCatalog(services, {
        maxPrice,
        minPrice,
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
    (scenario) =>
      scenario.expectedNavigateServiceId !== undefined &&
      !scenario.serviceName &&
      scenario.minDurationMinutes == null,
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

  it('resolveBudgetNavigateServiceId honors minDurationMinutes filter', () => {
    const scenario = BUDGET_HANDLER_OUTCOME_SCENARIOS.find(
      (entry) => entry.id === 'budget-long-massage-en',
    )!;
    const categorized = applyBudgetDiscoveryToCatalog(scenario.services, {
      maxPrice: scenario.maxPrice,
      serviceCategory: scenario.serviceCategory,
    });
    const matches = applyBudgetFilterToMatchedServices(
      categorized,
      scenario.maxPrice,
      undefined,
      undefined,
      scenario.minDurationMinutes,
    );
    expect(resolveBudgetNavigateServiceId(matches)).toBe(
      scenario.expectedNavigateServiceId,
    );
  });

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
    expect(
      enrichBudgetFromPrompt(
        { maxPrice: 50 },
        '$50 gift card, premium cut tomorrow',
      ).maxPrice,
    ).toBeUndefined();
    expect(
      enrichBudgetFromPrompt(
        { maxPrice: 50 },
        '$50 gift card, haircut tomorrow or Friday',
      ).maxPrice,
    ).toBeUndefined();
  });

  it('budget-not-gift-card-or-en rescues check_availability to apply_gift_card_code', () => {
    const scenario = SIMILAR_BUDGET_SERVICE_PROMPTS.find(
      (entry) => entry.id === 'budget-not-gift-card-or-en',
    )!;
    expect(isBudgetGiftCardMisroute(scenario.prompt)).toBe(true);
    expect(
      rescueBudgetServiceDiscoveryIntent(
        scenario.prompt,
        'check_availability',
        'customer',
      ),
    ).toEqual({
      action: 'apply_gift_card_code',
      rescueReason: 'apply_gift_card_code',
    });
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
      const misroute = resolveBudgetMisrouteAction(prompt);
      if (
        expectedAction === 'explain_checkout_currency' &&
        misroute == null
      ) {
        expect(
          rescueCheckoutCurrencyIntent(prompt, 'list_services'),
        ).toEqual({
          action: 'explain_checkout_currency',
          rescueReason: 'explain_checkout_currency',
        });
        return;
      }
      expect(
        rescueBudgetServiceDiscoveryIntent(prompt, 'list_services', 'customer'),
      ).toEqual({
        action: expectedAction,
        rescueReason: misroute,
      });
    },
  );

  it.each(BUDGET_DISAMBIGUATION_SCENARIOS.filter(
    (scenario) => scenario.surface !== 'customer',
  ))(
    'rescueBudgetServiceDiscoveryIntent public $id',
    ({ prompt, expectedAction }) => {
      const misroute = resolveBudgetMisrouteAction(prompt);
      if (
        expectedAction === 'explain_checkout_currency' &&
        misroute == null
      ) {
        expect(rescueCheckoutCurrencyIntent(prompt, 'list_services')).toEqual({
          action: 'explain_checkout_currency',
          rescueReason: 'explain_checkout_currency',
        });
        return;
      }
      const rescued = rescueBudgetServiceDiscoveryIntent(
        prompt,
        'list_services',
        'public',
      );
      expect(rescued?.rescueReason).toBe(misroute);
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

  it('budget-list-then-pick-en extracts list_services maxPrice on turn 1', () => {
    const scenario = SIMILAR_BUDGET_SERVICE_PROMPTS.find(
      (entry) => entry.id === 'budget-list-then-pick-en',
    )!;
    expect(scenario.expectedAction).toBe('list_services');
    expect(extractMaxPriceFromBudgetPrompt(scenario.prompt)).toBe(40);
    expect(
      rescueBudgetServiceDiscoveryIntent(scenario.prompt, 'unknown'),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'budget_list_services',
    });
  });

  it.each(BUDGET_CART_TOTAL_EXTRACTION_SCENARIOS)(
    'extractMaxTotalPriceFromBudgetPrompt $id',
    ({ prompt, maxTotalPrice, serviceCount }) => {
      expect(isBudgetCartTotalPrompt(prompt)).toBe(true);
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBeNull();
      expect(extractMaxTotalPriceFromBudgetPrompt(prompt)).toBe(maxTotalPrice);
      expect(extractBudgetCartServiceCountFromPrompt(prompt)).toBe(
        serviceCount,
      );
      expect(enrichBudgetFromPrompt({}, prompt)).toMatchObject({
        maxTotalPrice,
        serviceCount,
      });
    },
  );

  it('discover-not-multi-cart-en enriches cart total with tomorrow date via discovery pipeline', () => {
    const prompt = 'Two services under $100 total tomorrow';
    expect(enrichDiscoveryParamsFromPrompt({}, prompt)).toMatchObject({
      maxTotalPrice: 100,
      serviceCount: 2,
      date: 'tomorrow',
    });
    expect(
      enrichDiscoveryParamsFromPrompt({}, prompt).maxPrice,
    ).toBeUndefined();
  });

  it('budget-stale-session-en overrides prior session maxPrice', () => {
    const scenario = SIMILAR_BUDGET_SERVICE_PROMPTS.find(
      (entry) => entry.id === 'budget-stale-session-en',
    )!;
    expect(extractMaxPriceFromBudgetPrompt(scenario.prompt)).toBe(30);
    expect(
      enrichBudgetFromPrompt({ maxPrice: 50, serviceCategory: 'haircut' }, scenario.prompt),
    ).toMatchObject({ maxPrice: 30, serviceCategory: 'haircut' });
  });

  it.each(BUDGET_PROMO_EXTRACTION_SCENARIOS)(
    'extractBudgetPromoCodeFromPrompt $id',
    ({ prompt, maxPrice, promoCode }) => {
      expect(isBudgetWithPromoPrompt(prompt)).toBe(true);
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(maxPrice);
      expect(extractBudgetPromoCodeFromPrompt(prompt)).toBe(promoCode);
      expect(enrichBudgetFromPrompt({}, prompt)).toMatchObject({
        maxPrice,
        promoCode,
      });
    },
  );

  it.each(BUDGET_RANGE_EXTRACTION_SCENARIOS)(
    'extractMinPriceFromBudgetPrompt $id',
    ({ prompt, minPrice, maxPrice }) => {
      expect(isBudgetPriceRangePrompt(prompt)).toBe(true);
      expect(extractMinPriceFromBudgetPrompt(prompt)).toBe(minPrice);
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(maxPrice);
      expect(enrichBudgetFromPrompt({}, prompt)).toMatchObject({
        minPrice,
        maxPrice,
      });
    },
  );

  it.each(BUDGET_VOICE_ASR_EXTRACTION_SCENARIOS)(
    'enrichBudgetVoiceServiceFromPrompt $id',
    ({ prompt, maxPrice, serviceCategory }) => {
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(maxPrice);
      expect(enrichBudgetFromPrompt({}, prompt)).toMatchObject({
        maxPrice,
        serviceCategory,
      });
    },
  );

  it.each(BUDGET_NAMED_SERVICE_EXTRACTION_SCENARIOS)(
    'extractBudgetNamedServiceFromPrompt $id',
    ({ prompt, maxPrice, serviceName }) => {
      expect(extractBudgetNamedServiceFromPrompt(prompt)).toBe(serviceName);
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(maxPrice);
      expect(enrichBudgetFromPrompt({}, prompt)).toMatchObject({
        maxPrice,
        serviceName,
      });
    },
  );

  it.each(BUDGET_PROVIDER_EMPLOYEE_EXTRACTION_SCENARIOS)(
    'extractBudgetEmployeeNameFromPrompt $id',
    ({ prompt, maxPrice, employeeName }) => {
      expect(extractBudgetEmployeeNameFromPrompt(prompt)).toBe(employeeName);
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(maxPrice);
      expect(enrichBudgetFromPrompt({}, prompt)).toMatchObject({
        maxPrice,
        employeeName,
      });
    },
  );

  it.each(BUDGET_SHORT_DURATION_EXTRACTION_SCENARIOS)(
    'enrichBudgetDurationPreferenceFromPrompt $id',
    ({ prompt, maxPrice, serviceCategory, preferShortDuration }) => {
      expect(isBudgetShortServicePrompt(prompt)).toBe(true);
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(maxPrice);
      expect(enrichBudgetFromPrompt({}, prompt)).toMatchObject({
        maxPrice,
        serviceCategory,
        preferShortDuration,
      });
    },
  );

  it.each(BUDGET_LONG_DURATION_EXTRACTION_SCENARIOS)(
    'enrichBudgetDurationPreferenceFromPrompt long $id',
    ({ prompt, maxPrice, serviceCategory, minDurationMinutes }) => {
      expect(isBudgetLongServicePrompt(prompt)).toBe(true);
      expect(extractBudgetMinDurationMinutesFromPrompt(prompt)).toBe(
        minDurationMinutes,
      );
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(maxPrice);
      expect(enrichBudgetFromPrompt({}, prompt)).toMatchObject({
        maxPrice,
        serviceCategory,
        minDurationMinutes,
      });
    },
  );

  it.each(BUDGET_ANY_PROVIDER_EXTRACTION_SCENARIOS)(
    'enrichBudgetProviderScopeFromPrompt $id',
    ({ prompt, maxPrice, allProviders }) => {
      expect(isBudgetAnyProviderListPrompt(prompt)).toBe(true);
      expect(extractMaxPriceFromBudgetPrompt(prompt)).toBe(maxPrice);
      expect(enrichBudgetFromPrompt({}, prompt)).toMatchObject({
        maxPrice,
        allProviders,
      });
      expect(
        rescueBudgetServiceDiscoveryIntent(prompt, 'unknown'),
      ).toEqual({
        action: 'list_services',
        rescueReason: 'budget_list_services',
      });
      expect(
        rescueBudgetServiceDiscoveryIntent(prompt, 'recommend_specialists'),
      ).toEqual({
        action: 'list_services',
        rescueReason: 'budget_list_services',
      });
    },
  );

  it('budget-subscription-en routes to discover_subscription_plans without maxPrice', () => {
    const scenario = SIMILAR_BUDGET_SERVICE_PROMPTS.find(
      (entry) => entry.id === 'budget-subscription-en',
    )!;
    expect(isBudgetSubscriptionBalancePrompt(scenario.prompt)).toBe(true);
    expect(shouldExtractBudgetMaxPrice(scenario.prompt)).toBe(false);
    expect(extractMaxPriceFromBudgetPrompt(scenario.prompt)).toBeNull();
    expect(resolveBudgetMisrouteAction(scenario.prompt)).toBe(
      'discover_subscription_plans',
    );
    expect(
      rescueBudgetServiceDiscoveryIntent(
        scenario.prompt,
        'list_services',
        'customer',
      ),
    ).toEqual({
      action: 'discover_subscription_plans',
      rescueReason: 'discover_subscription_plans',
    });
  });

  it('budget-or-windows-en is routed through flexible availability enrichment', () => {
    const scenario = SIMILAR_BUDGET_SERVICE_PROMPTS.find(
      (entry) => entry.id === 'budget-or-windows-en',
    )!;
    expect(scenario.phase2).toBeUndefined();
    expect(scenario.expectedAction).toBe('check_availability');
    expect(scenario.expectedParams?.availabilityWindows).toHaveLength(2);
  });
});
