import {
  SERVICE_DISCOVERY_INTEGRATION_CATALOG,
  SERVICE_DISCOVERY_PUBLIC_INTEGRATION_IDS,
  SERVICE_DISCOVERY_PUBLIC_INTEGRATION_SCENARIOS,
  serviceDiscoveryPublicIntegrationBySection,
} from './ai-service-discovery.fixtures.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-intent-heuristics.js';
import {
  resolvePublicAvailabilityWindows,
} from './ai-orchestration.helpers.js';
import {
  APPLY_SERVICE_DISCOVERY_TO_CATALOG_SCENARIOS,
  SERVICE_DISCOVERY_ENRICHMENT_PIPELINE_SCENARIOS,
} from './ai-service-catalog-rank.fixtures.js';
import {
  applyServiceDiscoveryToCatalog,
} from './ai-service-catalog-rank.util.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
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
    expect(SERVICE_DISCOVERY_PUBLIC_INTEGRATION_IDS.length).toBeGreaterThanOrEqual(
      15,
    );
  });

  it('covers TODO sections A, B, C, D, and H', () => {
    for (const section of ['A', 'B', 'C', 'D', 'H'] as const) {
      expect(serviceDiscoveryPublicIntegrationBySection(section).length).toBeGreaterThan(
        0,
      );
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

      if (scenario.expectedCatalogIds && scenario.catalogParams) {
        expect(
          applyServiceDiscoveryToCatalog(
            SERVICE_DISCOVERY_INTEGRATION_CATALOG,
            scenario.catalogParams,
          ).map((service) => service.id),
        ).toEqual(scenario.expectedCatalogIds);
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
});

describe('ai service discovery public integration — section H negatives (discover-1.6)', () => {
  it.each(serviceDiscoveryPublicIntegrationBySection('H'))(
    'blocks discovery misroutes for $id',
    (scenario) => {
      const enriched = runPublicDiscoveryEnrichment(scenario);
      for (const key of scenario.forbiddenDiscoveryKeys ?? []) {
        expect(enriched[key]).toBeUndefined();
      }

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
    },
  );
});
