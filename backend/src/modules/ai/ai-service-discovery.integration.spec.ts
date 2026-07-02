import {
  SERVICE_DISCOVERY_INTEGRATION_CATALOG,
  SERVICE_DISCOVERY_PUBLIC_INTEGRATION_IDS,
  SERVICE_DISCOVERY_JOURNEY_SCENARIOS,
  SERVICE_DISCOVERY_PARITY_SCENARIOS,
  SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS,
  serviceDiscoveryParityByPairId,
  serviceDiscoveryPublicIntegrationBySection,
} from './ai-service-discovery.fixtures.js';
import { DISCOVER_CROSS_SPRINT_MULTILINGUAL_SCENARIOS } from './ai-service-discovery-multilingual.fixtures.js';
import { rescueCheckoutCurrencyIntent } from './ai-checkout-currency.util.js';
import { enrichDiscoverParityParamsForSurface } from './ai-customer-public-discover-parity.util.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-intent-heuristics.js';
import { resolvePublicAvailabilityWindows } from './ai-orchestration.helpers.js';
import {
  APPLY_SERVICE_DISCOVERY_TO_CATALOG_SCENARIOS,
  SERVICE_DISCOVERY_ENRICHMENT_PIPELINE_SCENARIOS,
} from './ai-service-catalog-rank.fixtures.js';
import { applyServiceDiscoveryToCatalog } from './ai-service-catalog-rank.util.js';
import {
  applyBudgetFilterForRecommendSpecialists,
  composePublicListServicesBudgetResponse,
  resolveDiscoverConstrainedService,
} from './ai-budget-list-services.logic.js';
import { applyBudgetFilterForAvailabilityCheck } from './ai-flexible-availability-check.logic.js';
import { composePublicListServicesRankResponse } from './ai-rank-list-services.logic.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import { buildNearestAvailabilityWindowQueries } from './ai-nearest-slot-resolver.util.js';
import { isFlexibleAvailabilityBudgetBookCompoundPrompt } from './ai-flexible-availability-compound.util.js';
import {
  isAffordabilityListPrompt,
  isProviderRankDiscoveryPrompt,
  isValueOrPremiumBudgetListPrompt,
} from './ai-service-rank-discovery.util.js';
import { rescueBudgetServiceDiscoveryIntent } from './ai-budget-service-discovery.util.js';
import { decomposeDeterministicForSurface } from './intent-decomposition.util.js';

function runPublicDiscoveryEnrichment(
  scenario: (typeof SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS)[number],
): Record<string, unknown> {
  return enrichPublicAssistantParamsFromPrompt(
    scenario.prompt,
    scenario.classifierParams ?? {},
    SERVICE_DISCOVERY_INTEGRATION_CATALOG,
    scenario.action,
  );
}

function expectPartialParams(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(expected)) {
    expect(actual[key]).toEqual(value);
  }
}

describe('ai service discovery fixtures (discover-1.6)', () => {
  it('ships unique cross-sprint public integration ids', () => {
    expect(SERVICE_DISCOVERY_PUBLIC_INTEGRATION_IDS.length).toBe(
      new Set(SERVICE_DISCOVERY_PUBLIC_INTEGRATION_IDS).size,
    );
    expect(
      SERVICE_DISCOVERY_PUBLIC_INTEGRATION_IDS.length,
    ).toBeGreaterThanOrEqual(15);
  });

  it('covers TODO sections A, B, C, D, E, F, and H', () => {
    for (const section of ['A', 'B', 'C', 'D', 'E', 'F', 'H'] as const) {
      if (section === 'F') {
        expect(SERVICE_DISCOVERY_JOURNEY_SCENARIOS.length).toBeGreaterThan(0);
        continue;
      }
      expect(
        serviceDiscoveryPublicIntegrationBySection(section).length,
      ).toBeGreaterThan(0);
    }
  });

  it('aligns section A catalog ids with APPLY_SERVICE_DISCOVERY_TO_CATALOG_SCENARIOS where ids match', () => {
    for (const scenario of serviceDiscoveryPublicIntegrationBySection('A')) {
      const catalogScenario = APPLY_SERVICE_DISCOVERY_TO_CATALOG_SCENARIOS.find(
        (row) => row.id === scenario.id,
      );
      if (!catalogScenario || !scenario.expectedCatalogIds) continue;
      if (scenario.id === 'discover-value-or-premium-en') continue;
      expect(catalogScenario.expectedIds).toEqual(scenario.expectedCatalogIds);
    }
  });
});

describe('ai service discovery public integration — enrichment pipeline (discover-1.6)', () => {
  it.each(
    SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.filter(
      (scenario) => scenario.expectedDiscovery,
    ),
  )('enrichDiscoveryParamsFromPrompt $id', (scenario) => {
    const enriched = enrichDiscoveryParamsFromPrompt(
      scenario.classifierParams ?? {},
      scenario.prompt,
    );
    expectPartialParams(enriched, scenario.expectedDiscovery!);
    for (const key of scenario.forbiddenDiscoveryKeys ?? []) {
      expect(enriched[key]).toBeUndefined();
    }
  });

  it.each(
    SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.filter(
      (scenario) => scenario.expectedDiscovery,
    ),
  )('enrichPublicAssistantParamsFromPrompt $id', (scenario) => {
    const enriched = runPublicDiscoveryEnrichment(scenario);
    expectPartialParams(enriched, scenario.expectedDiscovery!);
    for (const key of scenario.forbiddenDiscoveryKeys ?? []) {
      expect(enriched[key]).toBeUndefined();
    }
  });

  it.each(
    SERVICE_DISCOVERY_ENRICHMENT_PIPELINE_SCENARIOS.filter((row) =>
      SERVICE_DISCOVERY_PUBLIC_INTEGRATION_IDS.includes(row.id),
    ),
  )('enrichDiscoveryParamsFromPrompt matches pipeline fixture $id', (row) => {
    expect(
      enrichDiscoveryParamsFromPrompt(row.params ?? {}, row.prompt),
    ).toEqual(row.expectedAfterPipeline);
  });
});

describe('ai service discovery public integration — section A list_services (discover-1.6)', () => {
  it.each(serviceDiscoveryPublicIntegrationBySection('A'))(
    'applyServiceDiscoveryToCatalog for $id',
    (scenario) => {
      const enriched = runPublicDiscoveryEnrichment(scenario);
      const params = scenario.catalogParams ?? enriched;
      expect(
        applyServiceDiscoveryToCatalog(
          SERVICE_DISCOVERY_INTEGRATION_CATALOG,
          params,
        ).map((service) => service.id),
      ).toEqual(scenario.expectedCatalogIds);
    },
  );

  it('discover-value-or-premium-en lists massage under budget and notes highest in range', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-value-or-premium-en',
    )!;
    const enriched = runPublicDiscoveryEnrichment(scenario);
    expect(enriched.serviceRank).toBeUndefined();
    expect(isValueOrPremiumBudgetListPrompt(scenario.prompt)).toBe(true);

    const massageCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'massage',
    );
    const composed = composePublicListServicesBudgetResponse({
      matchedServices: massageCatalog.map((service) => ({
        ...service,
        currency: 'USD',
      })),
      maxPrice: enriched.maxPrice,
      valueOrPremiumBrowse: true,
      header: 'Services within your budget:',
    });

    expect(composed.services.map((service) => service.id)).toEqual([
      'massage-55',
      'massage-65',
    ]);
    expect(composed.summary).toContain('Massage basic');
    expect(composed.summary).toContain('Massage standard');
    expect(composed.summary).toContain('Highest in your $80 range:');
    expect(composed.summary).toContain('Massage standard at $65');
  });

  it('discover-no-premium-in-budget-en clarifies no premium in budget with closest above', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-no-premium-in-budget-en',
    )!;
    const enriched = runPublicDiscoveryEnrichment(scenario);
    expect(enriched).toMatchObject({
      maxPrice: 30,
      serviceRank: 'highest_price',
      serviceCategory: 'haircut',
    });

    const haircutCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'haircut',
    );
    const composed = composePublicListServicesRankResponse({
      matchedServices: haircutCatalog.map((service) => ({
        ...service,
        currency: 'USD',
      })),
      serviceRank: 'highest_price',
      limit: 1,
      maxPrice: 30,
      serviceCategory: 'haircut',
      allCatalogServices: haircutCatalog,
    });

    expect(composed.services).toHaveLength(0);
    expect(composed.summary).toContain('No premium haircut under $30.');
    expect(composed.summary).toContain('Closest options');
    expect(composed.summary).toContain('Haircut basic');
    expect(composed.summary).toContain('$35');
  });
});

describe('ai service discovery public integration — section B availability (discover-1.6)', () => {
  it.each(serviceDiscoveryPublicIntegrationBySection('B'))(
    'resolves availability windows for $id',
    (scenario) => {
      const enriched = runPublicDiscoveryEnrichment(scenario);

      if (scenario.expectSingleWindow) {
        expect(enriched.availabilityWindows).toBeUndefined();
      }

      if (scenario.classifierParams?.bookingFirstAvailable) {
        expect(enriched.bookingFirstAvailable).toBe(true);
      }

      const windows = resolvePublicAvailabilityWindows(
        enriched,
        scenario.prompt,
        'UTC',
        { defaultScanDays: 14 },
      );

      if (scenario.expectSingleWindow) {
        expect(windows).toHaveLength(1);
      }
    },
  );

  it.each(
    serviceDiscoveryPublicIntegrationBySection('B').filter(
      (scenario) => scenario.expectedCatalogIds,
    ),
  )('applyServiceDiscoveryToCatalog for $id', (scenario) => {
    const enriched = runPublicDiscoveryEnrichment(scenario);
    const params = scenario.catalogParams ?? enriched;
    expect(
      applyServiceDiscoveryToCatalog(
        SERVICE_DISCOVERY_INTEGRATION_CATALOG,
        params,
      ).map((service) => service.id),
    ).toEqual(scenario.expectedCatalogIds);
  });

  it('discover-budget-asap-en picks cheapest affordable service for book nearest', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-budget-asap-en',
    )!;
    const enriched = runPublicDiscoveryEnrichment(scenario);
    expect(enriched).toMatchObject({
      maxPrice: 40,
      bookingFirstAvailable: true,
    });

    const resolved = resolveDiscoverConstrainedService(
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      enriched,
    );
    expect(resolved.service?.id).toBe('manicure-25');
    expect(resolved.noMatchSummary).toBeNull();
  });

  it('discover-budget-weekend-en filters massage catalog and keeps Saturday afternoon window', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-budget-weekend-en',
    )!;
    const enriched = runPublicDiscoveryEnrichment(scenario);
    expect(enriched).toMatchObject({
      maxPrice: 70,
      serviceCategory: 'massage',
      timeOfDay: 'afternoon',
      weekdays: ['saturday'],
    });

    const massageCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'massage',
    );
    const budgetFiltered = applyBudgetFilterForAvailabilityCheck(
      massageCatalog.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
      })),
      enriched.maxPrice,
    );
    expect(budgetFiltered.services.map((service) => service.id)).toEqual([
      'massage-55',
      'massage-65',
    ]);
    expect(budgetFiltered.noMatchSummary).toBeNull();

    const windows = resolvePublicAvailabilityWindows(
      enriched,
      scenario.prompt,
      'UTC',
      { defaultScanDays: 14 },
    );
    expect(windows).toHaveLength(1);
    expect(windows[0]?.timeOfDay).toBe('afternoon');
  });
});

describe('ai service discovery public integration — section C rank + availability (discover-1.6)', () => {
  it.each(serviceDiscoveryPublicIntegrationBySection('C'))(
    'merges rank rescue with classifier time for $id',
    (scenario) => {
      const enriched = runPublicDiscoveryEnrichment(scenario);
      expectPartialParams(enriched, scenario.expectedDiscovery!);

      if (scenario.expectSingleWindow) {
        expect(enriched.availabilityWindows).toBeUndefined();
        const windows = resolvePublicAvailabilityWindows(
          enriched,
          scenario.prompt,
          'UTC',
          { defaultScanDays: 14 },
        );
        expect(windows).toHaveLength(1);
      }

      if (scenario.classifierParams?.bookingFirstAvailable) {
        expect(enriched.bookingFirstAvailable).toBe(true);
      }
    },
  );

  it.each(serviceDiscoveryPublicIntegrationBySection('C'))(
    'applyServiceDiscoveryToCatalog for $id',
    (scenario) => {
      const enriched = runPublicDiscoveryEnrichment(scenario);
      const params = scenario.catalogParams ?? enriched;
      expect(
        applyServiceDiscoveryToCatalog(
          SERVICE_DISCOVERY_INTEGRATION_CATALOG,
          params,
        ).map((service) => service.id),
      ).toEqual(scenario.expectedCatalogIds);
    },
  );

  it.each(
    serviceDiscoveryPublicIntegrationBySection('C').filter(
      (scenario) => scenario.publicCompoundSteps?.length,
    ),
  )('decomposes rank book compound for $id', (scenario) => {
    const decomposition = decomposeDeterministicForSurface(
      'public',
      scenario.prompt,
    );
    expect(decomposition?.steps.map((step) => step.action)).toEqual(
      scenario.publicCompoundSteps,
    );
  });

  it('discover-cheapest-friday-en rank-picks manicure-25 for availability check', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-cheapest-friday-en',
    )!;
    const enriched = runPublicDiscoveryEnrichment(scenario);
    const manicureCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'manicure',
    );
    const resolved = resolveDiscoverConstrainedService(
      manicureCatalog,
      enriched,
    );
    expect(resolved.service?.id).toBe('manicure-25');
    expect(resolved.noMatchSummary).toBeNull();
  });

  it('discover-premium-tomorrow-en rank-picks facial-120 for book nearest', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-premium-tomorrow-en',
    )!;
    const enriched = runPublicDiscoveryEnrichment(scenario);
    const facialCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'facial',
    );
    const resolved = resolveDiscoverConstrainedService(facialCatalog, enriched);
    expect(resolved.service?.id).toBe('facial-120');
    expect(resolved.noMatchSummary).toBeNull();
  });
});

describe('ai service discovery public integration — section D flagship (discover-1.6)', () => {
  it.each(serviceDiscoveryPublicIntegrationBySection('D'))(
    'runs triple-intersection pipeline for $id',
    (scenario) => {
      const enriched = runPublicDiscoveryEnrichment(scenario);
      expectPartialParams(enriched, scenario.expectedDiscovery!);

      for (const key of scenario.forbiddenDiscoveryKeys ?? []) {
        expect(enriched[key]).toBeUndefined();
      }

      if (scenario.expectOrWindowCount != null) {
        const windows = resolvePublicAvailabilityWindows(
          enriched,
          scenario.prompt,
          'UTC',
          { defaultScanDays: 14 },
        );
        expect(windows).toHaveLength(scenario.expectOrWindowCount);
      }

      if (scenario.publicCompoundSteps?.length) {
        const decomposition = decomposeDeterministicForSurface(
          'public',
          scenario.prompt,
        );
        expect(decomposition?.steps.map((step) => step.action)).toEqual(
          scenario.publicCompoundSteps,
        );
      }
    },
  );

  it.each(
    serviceDiscoveryPublicIntegrationBySection('D').filter(
      (scenario) => scenario.expectedCatalogIds,
    ),
  )('applyServiceDiscoveryToCatalog for $id', (scenario) => {
    const enriched = runPublicDiscoveryEnrichment(scenario);
    const params = scenario.catalogParams ?? enriched;
    expect(
      applyServiceDiscoveryToCatalog(
        SERVICE_DISCOVERY_INTEGRATION_CATALOG,
        params,
      ).map((service) => service.id),
    ).toEqual(scenario.expectedCatalogIds);
  });

  it('discover-flagship-book-en rank-picks cheapest massage and scans OR windows for book', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-flagship-book-en',
    )!;
    const enriched = runPublicDiscoveryEnrichment(scenario);
    expect(
      isFlexibleAvailabilityBudgetBookCompoundPrompt(scenario.prompt),
    ).toBe(true);
    expect(enriched).toMatchObject({
      maxPrice: 80,
      serviceRank: 'lowest_price',
      serviceCategory: 'massage',
      bookingFirstAvailable: true,
    });

    const massageCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'massage',
    );
    const resolved = resolveDiscoverConstrainedService(
      massageCatalog,
      enriched,
    );
    expect(resolved.service?.id).toBe('massage-55');
    expect(
      buildNearestAvailabilityWindowQueries(enriched, scenario.prompt, 'UTC'),
    ).toHaveLength(2);
  });

  it('discover-flagship-premium-en rank-picks highest styling in budget across OR windows', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-flagship-premium-en',
    )!;
    const enriched = runPublicDiscoveryEnrichment(scenario);
    expect(
      isFlexibleAvailabilityBudgetBookCompoundPrompt(scenario.prompt),
    ).toBe(true);
    expect(enriched).toMatchObject({
      maxPrice: 150,
      serviceRank: 'highest_price',
      serviceCategory: 'styling',
      bookingFirstAvailable: true,
    });

    const stylingCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'styling',
    );
    const resolved = resolveDiscoverConstrainedService(
      stylingCatalog,
      enriched,
    );
    expect(resolved.service?.id).toBe('style-140');
    expect(
      buildNearestAvailabilityWindowQueries(enriched, scenario.prompt, 'UTC'),
    ).toHaveLength(2);
  });

  it('discover-flagship-question-en lists affordable facials without catalog rank', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-flagship-question-en',
    )!;
    const enriched = runPublicDiscoveryEnrichment(scenario);
    expect(isAffordabilityListPrompt(scenario.prompt)).toBe(true);
    expect(enriched.serviceRank).toBeUndefined();
    expect(enriched).toMatchObject({
      maxPrice: 100,
      serviceCategory: 'facial',
      availabilityWindows: [{ date: 'tomorrow' }, { weekdays: ['sunday'] }],
    });

    const facialCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'facial',
    );
    const composed = composePublicListServicesBudgetResponse({
      matchedServices: facialCatalog.map((service) => ({
        ...service,
        currency: 'USD',
      })),
      maxPrice: enriched.maxPrice,
      serviceCategory: 'facial',
      header: 'Services within your budget:',
    });
    expect(composed.services.map((service) => service.id)).toEqual([
      'facial-55',
      'facial-95',
    ]);
    expect(
      resolvePublicAvailabilityWindows(enriched, scenario.prompt, 'UTC', {
        defaultScanDays: 14,
      }),
    ).toHaveLength(2);
  });
});

describe('ai service discovery public integration — section E provider + budget + OR (discover-1.6)', () => {
  it.each(serviceDiscoveryPublicIntegrationBySection('E'))(
    'runs provider budget OR pipeline for $id',
    (scenario) => {
      const enriched = runPublicDiscoveryEnrichment(scenario);
      expectPartialParams(enriched, scenario.expectedDiscovery!);

      for (const key of scenario.forbiddenDiscoveryKeys ?? []) {
        expect(enriched[key]).toBeUndefined();
      }

      if (scenario.expectOrWindowCount != null) {
        const windows = resolvePublicAvailabilityWindows(
          enriched,
          scenario.prompt,
          'UTC',
          { defaultScanDays: 14 },
        );
        expect(windows).toHaveLength(scenario.expectOrWindowCount);
      }
    },
  );

  it.each(
    serviceDiscoveryPublicIntegrationBySection('E').filter(
      (scenario) => scenario.expectedCatalogIds,
    ),
  )('applyServiceDiscoveryToCatalog for $id', (scenario) => {
    const enriched = runPublicDiscoveryEnrichment(scenario);
    const params = scenario.catalogParams ?? enriched;
    expect(
      applyServiceDiscoveryToCatalog(
        SERVICE_DISCOVERY_INTEGRATION_CATALOG,
        params,
      ).map((service) => service.id),
    ).toEqual(scenario.expectedCatalogIds);
  });

  it('discover-provider-budget-or-en keeps Karo on window A and team-wide fallback on window B', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-provider-budget-or-en',
    )!;
    const enriched = runPublicDiscoveryEnrichment(scenario);
    expect(enriched.employeeName).toBeUndefined();
    expect(enriched.availabilityWindows).toEqual([
      { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);

    const haircutCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'haircut',
    );
    const budgetFiltered = applyBudgetFilterForAvailabilityCheck(
      haircutCatalog.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
      })),
      enriched.maxPrice,
    );
    expect(budgetFiltered.services.map((service) => service.id)).toEqual([
      'hair-35',
      'hair-45',
    ]);
  });

  it('discover-best-provider-budget-en stays provider rank with budget service filter', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-best-provider-budget-en',
    )!;
    const enriched = runPublicDiscoveryEnrichment(scenario);
    expect(isProviderRankDiscoveryPrompt(scenario.prompt)).toBe(true);
    expect(enriched.serviceRank).toBeUndefined();
    expect(enriched).toMatchObject({
      maxPrice: 60,
      serviceCategory: 'haircut',
    });

    const haircutCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'haircut',
    );
    const budgetFiltered = applyBudgetFilterForRecommendSpecialists(
      haircutCatalog.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
      })),
      enriched.maxPrice,
    );
    expect(budgetFiltered.services.map((service) => service.id)).toEqual([
      'hair-35',
      'hair-45',
    ]);

    if (scenario.rescuedFromAction && scenario.rescuedAction) {
      expect(
        rescueBudgetServiceDiscoveryIntent(
          scenario.prompt,
          scenario.rescuedFromAction,
          'public',
        ),
      ).toEqual({
        action: scenario.rescuedAction,
        rescueReason: scenario.rescueReason,
      });
    }
  });
});

describe('ai service discovery public integration — section F journey (discover-1.6)', () => {
  it.each(SERVICE_DISCOVERY_JOURNEY_SCENARIOS)(
    'runs multi-turn session for $id',
    (scenario) => {
      let session: Record<string, unknown> = {
        ...(scenario.initialSession ?? {}),
      };
      const haircutCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
        (service) =>
          (service.serviceCategory ?? '').includes('hair') ||
          service.name.toLowerCase().includes('hair'),
      );
      const massageCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
        (service) => service.serviceCategory === 'massage',
      );

      for (const [index, turn] of scenario.turns.entries()) {
        if (turn.usePublicAssistantEnrichment) {
          session = enrichPublicAssistantParamsFromPrompt(
            turn.prompt,
            session,
            haircutCatalog,
            turn.action,
          );
        } else {
          session = enrichDiscoveryParamsFromPrompt(session, turn.prompt);
        }
        for (const [key, value] of Object.entries(turn.expectedDiscovery)) {
          expect(session[key]).toEqual(value);
        }
        for (const key of turn.forbiddenDiscoveryKeys ?? []) {
          expect(session[key]).toBeUndefined();
        }

        const listTurnIndex = scenario.listCatalogTurnIndex ?? 0;
        if (scenario.expectedListCatalogIds && index === listTurnIndex) {
          const params = scenario.listCatalogParams ?? session;
          const catalog =
            params.serviceCategory === 'massage'
              ? massageCatalog
              : haircutCatalog;
          expect(
            applyServiceDiscoveryToCatalog(catalog, params).map(
              (service) => service.id,
            ),
          ).toEqual(scenario.expectedListCatalogIds);
        }

        const budgetRankTurnIndex = scenario.budgetRankTurnIndex ?? 1;
        if (
          scenario.expectedBudgetRankCatalogIds &&
          index === budgetRankTurnIndex
        ) {
          const params = scenario.budgetRankCatalogParams ?? session;
          expect(
            applyServiceDiscoveryToCatalog(massageCatalog, params).map(
              (service) => service.id,
            ),
          ).toEqual(scenario.expectedBudgetRankCatalogIds);
        }
      }

      if (scenario.expectedBookServiceId) {
        const resolved = resolveDiscoverConstrainedService(
          haircutCatalog,
          session,
        );
        expect(resolved.service?.id).toBe(scenario.expectedBookServiceId);
      }

      if (scenario.expectedClarifyServiceId) {
        const resolved = resolveDiscoverConstrainedService(
          haircutCatalog,
          session,
        );
        expect(resolved.service?.id).toBe(scenario.expectedClarifyServiceId);
      }
    },
  );

  it('discover-journey-budget-list-book-en turn 1 lists hair services under budget', () => {
    const scenario = SERVICE_DISCOVERY_JOURNEY_SCENARIOS.find(
      (row) => row.id === 'discover-journey-budget-list-book-en',
    )!;
    const turn1 = enrichDiscoveryParamsFromPrompt({}, scenario.turns[0].prompt);
    const haircutCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => (service.serviceCategory ?? '').includes('hair'),
    );
    const composed = composePublicListServicesBudgetResponse({
      matchedServices: haircutCatalog.map((service) => ({
        ...service,
        currency: 'USD',
      })),
      maxPrice: turn1.maxPrice,
      serviceCategory: 'hair',
      header: 'Services within your budget:',
    });
    expect(composed.services.map((service) => service.id)).toEqual([
      'hair-35',
      'hair-45',
    ]);
  });
});

describe('ai service discovery parity — section G (discover-1.6)', () => {
  it.each(SERVICE_DISCOVERY_PARITY_SCENARIOS)(
    'enriches $id on $surface with shared discovery params',
    (scenario) => {
      const enriched = enrichDiscoverParityParamsForSurface(
        scenario.surface,
        scenario.prompt,
        scenario.classifierParams ?? {},
        SERVICE_DISCOVERY_INTEGRATION_CATALOG,
        scenario.action,
      );
      expect(enriched).toMatchObject(scenario.expectedDiscovery);
      for (const key of scenario.forbiddenDiscoveryKeys ?? []) {
        expect(enriched[key]).toBeUndefined();
      }
    },
  );

  it.each(
    SERVICE_DISCOVERY_PARITY_SCENARIOS.filter(
      (row) => row.surface === 'public' && row.expectedCatalogIds,
    ),
  )('applyServiceDiscoveryToCatalog for $id', (scenario) => {
    const enriched = enrichDiscoverParityParamsForSurface(
      scenario.surface,
      scenario.prompt,
      scenario.classifierParams ?? {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      scenario.action,
    );
    const params = scenario.catalogParams ?? enriched;
    const facialCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'facial',
    );
    expect(
      applyServiceDiscoveryToCatalog(facialCatalog, params).map(
        (service) => service.id,
      ),
    ).toEqual(scenario.expectedCatalogIds);
  });

  it('discover-parity-budget public and customer share identical list_services outcome', () => {
    const scenarios = serviceDiscoveryParityByPairId('discover-parity-budget');
    const publicEnriched = enrichDiscoverParityParamsForSurface(
      'public',
      scenarios[0].prompt,
      scenarios[0].classifierParams ?? {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      scenarios[0].action,
    );
    const customerEnriched = enrichDiscoverParityParamsForSurface(
      'customer',
      scenarios[1].prompt,
      scenarios[1].classifierParams ?? {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      scenarios[1].action,
    );
    expect(publicEnriched).toEqual(customerEnriched);

    const facialCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'facial',
    );
    const composed = composePublicListServicesBudgetResponse({
      matchedServices: facialCatalog.map((service) => ({
        ...service,
        currency: 'EUR',
      })),
      maxPrice: publicEnriched.maxPrice,
      serviceCategory: 'facial',
      header: 'Services within your budget:',
    });
    expect(composed.services).toHaveLength(0);
    expect(composed.summary).toContain('Nothing under $50');
    expect(composed.summary).toContain('Facial standard');
  });

  it('discover-parity-or public and customer share identical OR window parse', () => {
    const scenarios = serviceDiscoveryParityByPairId('discover-parity-or');
    const publicEnriched = enrichDiscoverParityParamsForSurface(
      'public',
      scenarios[0].prompt,
      scenarios[0].classifierParams ?? {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      scenarios[0].action,
    );
    const customerEnriched = enrichDiscoverParityParamsForSurface(
      'customer',
      scenarios[1].prompt,
      scenarios[1].classifierParams ?? {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      scenarios[1].action,
    );
    expect(publicEnriched).toEqual(customerEnriched);
    expect(publicEnriched.availabilityWindows).toEqual([
      { date: 'tomorrow', timeOfDay: 'morning' },
      { weekdays: ['saturday'], timeOfDay: 'afternoon' },
    ]);

    const windows = resolvePublicAvailabilityWindows(
      publicEnriched,
      scenarios[0].prompt,
      'UTC',
      { defaultScanDays: 14 },
    );
    expect(windows).toHaveLength(2);
    expect(windows[0]?.timeOfDay).toBe('morning');
    expect(windows[1]?.timeOfDay).toBe('afternoon');
  });

  it('discover-parity-voice-customer matches public ASR budget + OR window enrich', () => {
    const scenario = SERVICE_DISCOVERY_PARITY_SCENARIOS.find(
      (row) => row.id === 'discover-parity-voice-customer',
    )!;
    const customerEnriched = enrichDiscoverParityParamsForSurface(
      'customer',
      scenario.prompt,
      scenario.classifierParams ?? {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      scenario.action,
    );
    const publicEnriched = enrichDiscoverParityParamsForSurface(
      'public',
      scenario.prompt,
      scenario.classifierParams ?? {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      'check_availability',
    );
    expect(customerEnriched).toEqual(publicEnriched);
    expect(customerEnriched).toMatchObject(scenario.expectedDiscovery);

    const windows = resolvePublicAvailabilityWindows(
      customerEnriched,
      scenario.prompt,
      'UTC',
      { defaultScanDays: 14 },
    );
    expect(windows).toHaveLength(scenario.expectOrWindowCount ?? 2);
  });
});

function runSectionHDiscoveryEnrichment(
  scenario: (typeof SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS)[number],
): Record<string, unknown> {
  if (scenario.surface === 'dashboard') {
    return enrichDiscoveryParamsFromPrompt(
      scenario.classifierParams ?? {},
      scenario.prompt,
    );
  }
  return runPublicDiscoveryEnrichment(scenario);
}

describe('ai service discovery public integration — section H negatives (discover-1.6)', () => {
  it.each(serviceDiscoveryPublicIntegrationBySection('H'))(
    'blocks discovery misroutes for $id',
    (scenario) => {
      const enriched = runSectionHDiscoveryEnrichment(scenario);
      if (scenario.expectedDiscovery) {
        expectPartialParams(enriched, scenario.expectedDiscovery);
      }
      for (const key of scenario.forbiddenDiscoveryKeys ?? []) {
        expect(enriched[key]).toBeUndefined();
      }

      if (scenario.surface === 'dashboard') {
        expect(
          rescueBudgetServiceDiscoveryIntent(
            scenario.prompt,
            scenario.action,
            'dashboard',
          ),
        ).toBeNull();
      }

      if (scenario.rescuedFromAction && scenario.rescuedAction) {
        const rescued =
          scenario.rescueReason === 'explain_checkout_currency'
            ? rescueCheckoutCurrencyIntent(
                scenario.prompt,
                scenario.rescuedFromAction,
              )
            : rescueBudgetServiceDiscoveryIntent(
                scenario.prompt,
                scenario.rescuedFromAction,
                'public',
              );
        expect(rescued).toEqual({
          action: scenario.rescuedAction,
          rescueReason: scenario.rescueReason,
        });
      }

      if (scenario.customerRescuedAction && scenario.rescuedFromAction) {
        const customerRescued =
          scenario.rescueReason === 'explain_checkout_currency'
            ? rescueCheckoutCurrencyIntent(
                scenario.prompt,
                scenario.rescuedFromAction,
              )
            : rescueBudgetServiceDiscoveryIntent(
                scenario.prompt,
                scenario.rescuedFromAction,
                'customer',
              );
        expect(customerRescued).toEqual({
          action: scenario.customerRescuedAction,
          rescueReason: scenario.rescueReason,
        });
      }
    },
  );

  it('discover-not-admin-en keeps dashboard list_services READ budget filter', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-not-admin-en',
    )!;
    const enriched = enrichDiscoveryParamsFromPrompt({}, scenario.prompt);
    expect(enriched).toEqual({ maxPrice: 50 });
    expect(
      applyServiceDiscoveryToCatalog(
        SERVICE_DISCOVERY_INTEGRATION_CATALOG,
        enriched,
      ).map((service) => service.id),
    ).toEqual(scenario.expectedCatalogIds);

    const composed = composePublicListServicesBudgetResponse({
      matchedServices: SERVICE_DISCOVERY_INTEGRATION_CATALOG.map((service) => ({
        ...service,
        currency: 'USD',
      })),
      maxPrice: 50,
      header: 'Services within budget:',
    });
    expect(composed.services.map((service) => service.id)).toEqual(
      scenario.expectedCatalogIds,
    );
  });

  it('discover-not-multi-cart-en uses maxTotalPrice not maxPrice and lists valid combos', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-not-multi-cart-en',
    )!;
    const enriched = enrichDiscoveryParamsFromPrompt({}, scenario.prompt);
    expect(enriched).toMatchObject({
      maxTotalPrice: 100,
      serviceCount: 2,
      date: 'tomorrow',
    });
    expect(enriched.maxPrice).toBeUndefined();

    const composed = composePublicListServicesBudgetResponse({
      matchedServices: [
        {
          id: 'hair-35',
          name: 'Haircut basic',
          price: 35,
          serviceCategory: 'haircut',
          currency: 'USD',
        },
        {
          id: 'facial-55',
          name: 'Facial standard',
          price: 55,
          serviceCategory: 'facial',
          currency: 'USD',
        },
        {
          id: 'massage-95',
          name: 'Massage premium',
          price: 95,
          serviceCategory: 'massage',
          currency: 'USD',
        },
      ],
      maxTotalPrice: 100,
      serviceCount: 2,
      header: 'Services within your budget:',
    });
    expect(composed.summary).toContain('Haircut basic + Facial standard');
    expect(
      rescueBudgetServiceDiscoveryIntent(scenario.prompt, 'unknown', 'public'),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'budget_list_services',
    });
  });

  it('discover-not-currency-explain-en strips budget/rank and rescues explain_checkout_currency', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-not-currency-explain-en',
    )!;
    const enriched = runPublicDiscoveryEnrichment(scenario);
    expect(enriched).toEqual({});
    expect(
      rescueCheckoutCurrencyIntent(scenario.prompt, 'list_services'),
    ).toEqual({
      action: 'explain_checkout_currency',
      rescueReason: 'explain_checkout_currency',
    });
    expect(rescueCheckoutCurrencyIntent(scenario.prompt, 'unknown')).toEqual({
      action: 'explain_checkout_currency',
      rescueReason: 'explain_checkout_currency',
    });
  });

  it('discover-not-gift-en strips budget rank from premium wording and keeps date only', () => {
    const scenario = SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'discover-not-gift-en',
    )!;
    const enriched = enrichDiscoveryParamsFromPrompt(
      scenario.classifierParams ?? {},
      scenario.prompt,
    );
    expect(enriched).toEqual({
      serviceCategory: 'haircut',
      date: 'tomorrow',
    });
    expect(
      rescueBudgetServiceDiscoveryIntent(
        scenario.prompt,
        'list_services',
        'customer',
      ),
    ).toEqual({
      action: 'apply_gift_card_code',
      rescueReason: 'apply_gift_card_code',
    });
  });
});

describe('ai service discovery public integration — section I multilingual (discover-1.5)', () => {
  it('discover-ru-premium-en enriches ru rank + budget + tomorrow evening single window', () => {
    const scenario = DISCOVER_CROSS_SPRINT_MULTILINGUAL_SCENARIOS.find(
      (row) => row.id === 'discover-ru-premium-en',
    )!;
    const enriched = enrichPublicAssistantParamsFromPrompt(
      scenario.prompt,
      { serviceCategory: 'massage' },
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      scenario.expectedAction ?? 'list_services',
    );
    expect(enriched).toMatchObject(scenario.expectedParams ?? {});
    expect(enriched.availabilityWindows).toBeUndefined();
    expect(enriched.date).toBe('tomorrow');
    expect(enriched.timeOfDay).toBe('evening');

    const windows = resolvePublicAvailabilityWindows(
      enriched,
      scenario.prompt,
      'UTC',
      { defaultScanDays: 14 },
    );
    expect(windows).toHaveLength(1);
    expect(windows[0]?.timeOfDay).toBe('evening');
    expect(windows[0]?.dateKeys.length).toBeGreaterThan(0);

    const massageCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'massage',
    );
    expect(
      applyServiceDiscoveryToCatalog(massageCatalog, {
        maxPrice: 8000,
        serviceRank: 'highest_price',
        serviceCategory: 'massage',
        limit: 1,
      }).map((service) => service.id),
    ).toEqual(['massage-95']);
  });

  it('discover-hy-cheapest-en enriches hy rank + budget for manicure list_services', () => {
    const scenario = DISCOVER_CROSS_SPRINT_MULTILINGUAL_SCENARIOS.find(
      (row) => row.id === 'discover-hy-cheapest-en',
    )!;
    const enriched = enrichPublicAssistantParamsFromPrompt(
      scenario.prompt,
      {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      scenario.expectedAction ?? 'list_services',
    );
    expect(enriched).toMatchObject(scenario.expectedParams ?? {});
    expect(enriched.serviceCategory).toBe('manicure');

    const manicureCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'manicure',
    );
    expect(
      applyServiceDiscoveryToCatalog(manicureCatalog, enriched).map(
        (service) => service.id,
      ),
    ).toEqual(['manicure-25']);
  });

  it('discover-hy-budget-or-en enriches hy budget + OR windows for check_availability', () => {
    const scenario = DISCOVER_CROSS_SPRINT_MULTILINGUAL_SCENARIOS.find(
      (row) => row.id === 'discover-hy-budget-or-en',
    )!;
    const enriched = enrichPublicAssistantParamsFromPrompt(
      scenario.prompt,
      { serviceCategory: 'haircut' },
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      scenario.expectedAction ?? 'check_availability',
    );
    expect(enriched).toMatchObject(scenario.expectedParams ?? {});

    const windows = resolvePublicAvailabilityWindows(
      enriched,
      scenario.prompt,
      'UTC',
      { defaultScanDays: 14 },
    );
    expect(windows.length).toBeGreaterThanOrEqual(2);
  });

  it('discover-ru-or-book-en enriches ru OR windows + bookingFirstAvailable for book_appointment', () => {
    const scenario = DISCOVER_CROSS_SPRINT_MULTILINGUAL_SCENARIOS.find(
      (row) => row.id === 'discover-ru-or-book-en',
    )!;
    const enriched = enrichPublicAssistantParamsFromPrompt(
      scenario.prompt,
      { serviceCategory: 'haircut' },
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      scenario.expectedAction ?? 'book_appointment',
    );
    expect(enriched).toMatchObject(scenario.expectedParams ?? {});
    expect(enriched.bookingFirstAvailable).toBe(true);
    expect(enriched.date).toBeUndefined();
    expect(enriched.timeOfDay).toBeUndefined();

    const windows = resolvePublicAvailabilityWindows(
      enriched,
      scenario.prompt,
      'UTC',
      { defaultScanDays: 14 },
    );
    expect(windows.length).toBeGreaterThanOrEqual(2);
  });
});
