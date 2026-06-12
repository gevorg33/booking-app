import {
  DISCOVER_CROSS_SPRINT_MULTILINGUAL_SCENARIOS,
  lookupServiceDiscoverySourceFixture,
  MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS,
  SERVICE_DISCOVERY_MULTILINGUAL_CLASSIFIER_RULES,
  SERVICE_DISCOVERY_MULTILINGUAL_FIXTURE_IDS,
  serviceDiscoveryMultilingualByDomain,
} from './ai-service-discovery-multilingual.fixtures.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-intent-heuristics.js';

describe('ai-service-discovery-multilingual.fixtures (discover-1.5)', () => {
  it('ships classifier rules for budget, rank, and OR availability', () => {
    expect(SERVICE_DISCOVERY_MULTILINGUAL_CLASSIFIER_RULES).toContain('maxPrice');
    expect(SERVICE_DISCOVERY_MULTILINGUAL_CLASSIFIER_RULES).toContain(
      'availabilityWindows',
    );
    expect(SERVICE_DISCOVERY_MULTILINGUAL_CLASSIFIER_RULES).toContain(
      'serviceRank',
    );
  });

  it('uses unique multilingual fixture ids', () => {
    expect(SERVICE_DISCOVERY_MULTILINGUAL_FIXTURE_IDS.length).toBe(
      new Set(SERVICE_DISCOVERY_MULTILINGUAL_FIXTURE_IDS).size,
    );
  });

  it.each(MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS)(
    'sourceFixtureId $sourceFixtureId resolves for $id',
    ({ sourceFixtureId, relatedFixtureIds = [] }) => {
      expect(lookupServiceDiscoverySourceFixture(sourceFixtureId)).toBeDefined();
      for (const relatedId of relatedFixtureIds) {
        expect(lookupServiceDiscoverySourceFixture(relatedId)).toBeDefined();
      }
    },
  );

  it('ships cross-sprint section I discover rows', () => {
    expect(DISCOVER_CROSS_SPRINT_MULTILINGUAL_SCENARIOS.map((row) => row.id)).toEqual([
      'discover-hy-budget-or-en',
      'discover-ru-premium-en',
      'discover-hy-cheapest-en',
      'discover-ru-or-book-en',
    ]);
  });

  it('ships at least four HY and four RU rows per budget, rank, and availability domain', () => {
    for (const domain of ['budget', 'rank', 'availability'] as const) {
      const rows = serviceDiscoveryMultilingualByDomain(domain);
      expect(rows.filter((row) => row.locale === 'hy').length).toBeGreaterThanOrEqual(
        4,
      );
      expect(rows.filter((row) => row.locale === 'ru').length).toBeGreaterThanOrEqual(
        4,
      );
      expect(rows.filter((row) => row.locale === 'translit').length).toBeGreaterThanOrEqual(
        1,
      );
    }
  });

  it.each(DISCOVER_CROSS_SPRINT_MULTILINGUAL_SCENARIOS)(
    'cross-sprint enrichment extracts discovery params for $id',
    ({ prompt, expectedParams, expectedAction }) => {
      const enriched = enrichPublicAssistantParamsFromPrompt(
        prompt,
        expectedParams?.serviceCategory
          ? { serviceCategory: expectedParams.serviceCategory }
          : {},
        [],
        expectedAction ?? 'check_availability',
      );
      if (expectedParams?.maxPrice != null) {
        expect(enriched.maxPrice).toBe(expectedParams.maxPrice);
      }
      if (expectedParams?.serviceRank != null) {
        expect(enriched.serviceRank).toBe(expectedParams.serviceRank);
      }
      if (expectedParams?.availabilityWindows) {
        expect(enriched.availabilityWindows).toEqual(
          expectedParams.availabilityWindows,
        );
      }
      if (expectedParams?.date != null) {
        expect(enriched.date).toBe(expectedParams.date);
      }
      if (expectedParams?.timeOfDay != null) {
        expect(enriched.timeOfDay).toBe(expectedParams.timeOfDay);
      }
      if (expectedParams?.bookingFirstAvailable === true) {
        expect(enriched.bookingFirstAvailable).toBe(true);
      }
      if (expectedParams?.availabilityWindows) {
        expect(enriched.date).toBeUndefined();
        expect(enriched.timeOfDay).toBeUndefined();
      }
      if (
        expectedParams?.date != null &&
        expectedParams?.timeOfDay != null &&
        !expectedParams?.availabilityWindows
      ) {
        expect(enriched.availabilityWindows).toBeUndefined();
      }
    },
  );

  it.each(
    MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS.filter((row) =>
      [
        'discover-ml-budget-translit-under-50',
        'discover-ml-rank-translit-premium',
        'discover-ml-rank-translit-cheapest',
        'discover-ml-avail-hy-or',
        'discover-ml-avail-ru-or',
        'discover-ml-avail-translit-or',
      ].includes(row.id),
    ),
  )('enrichment extracts discovery params for $id', ({ prompt, expectedParams }) => {
    const enriched = enrichDiscoveryParamsFromPrompt({}, prompt);
    if (expectedParams?.maxPrice != null) {
      expect(enriched.maxPrice).toBe(expectedParams.maxPrice);
    }
    if (expectedParams?.serviceRank != null) {
      expect(enriched.serviceRank).toBe(expectedParams.serviceRank);
    }
  });

  it('mirror rows reuse canonical source prompts when present', () => {
    const mirrored = MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS.find(
      (row) => row.id === 'discover-ml-budget-hy-dram',
    )!;
    const source = lookupServiceDiscoverySourceFixture(mirrored.sourceFixtureId);
    expect(mirrored.prompt).toBe(source?.prompt);
  });
});
