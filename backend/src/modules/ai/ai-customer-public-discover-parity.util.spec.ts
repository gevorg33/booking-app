import {
  SERVICE_DISCOVERY_INTEGRATION_CATALOG,
  SERVICE_DISCOVERY_PARITY_SCENARIOS,
  serviceDiscoveryParityByPairId,
} from './ai-service-discovery.fixtures.js';
import { applyServiceDiscoveryToCatalog } from './ai-service-catalog-rank.util.js';
import { composePublicListServicesBudgetResponse } from './ai-budget-list-services.logic.js';
import { resolvePublicAvailabilityWindows } from './ai-orchestration.helpers.js';
import { enrichDiscoverParityParamsForSurface } from './ai-customer-public-discover-parity.util.js';

describe('ai customer public discover parity util (discover-1.6 section G)', () => {
  it.each(SERVICE_DISCOVERY_PARITY_SCENARIOS)(
    'enriches $id with expected discovery params',
    (scenario) => {
      const enriched = enrichDiscoverParityParamsForSurface(
        scenario.surface,
        scenario.prompt,
        scenario.classifierParams ?? {},
        SERVICE_DISCOVERY_INTEGRATION_CATALOG,
        scenario.action,
      );
      expect(enriched).toMatchObject(scenario.expectedDiscovery);
    },
  );

  it('discover-parity-budget public and customer produce identical enrichment and catalog', () => {
    const [publicScenario, customerScenario] = serviceDiscoveryParityByPairId(
      'discover-parity-budget',
    );
    expect(publicScenario?.surface).toBe('public');
    expect(customerScenario?.surface).toBe('customer');

    const publicEnriched = enrichDiscoverParityParamsForSurface(
      'public',
      publicScenario!.prompt,
      publicScenario!.classifierParams ?? {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      publicScenario!.action,
    );
    const customerEnriched = enrichDiscoverParityParamsForSurface(
      'customer',
      customerScenario!.prompt,
      customerScenario!.classifierParams ?? {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      customerScenario!.action,
    );

    expect(publicEnriched).toEqual(customerEnriched);

    const facialCatalog = SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
      (service) => service.serviceCategory === 'facial',
    );
    const params = publicScenario!.catalogParams ?? publicEnriched;
    const catalogIds = applyServiceDiscoveryToCatalog(facialCatalog, params).map(
      (service) => service.id,
    );
    expect(catalogIds).toEqual(publicScenario!.expectedCatalogIds);

    const composeInput = {
      matchedServices: facialCatalog.map((service) => ({
        ...service,
        currency: 'EUR',
      })),
      maxPrice: params.maxPrice as number,
      serviceCategory: 'facial',
      header: 'Services within your budget:',
    };
    const publicList = composePublicListServicesBudgetResponse(composeInput);
    const customerList = composePublicListServicesBudgetResponse(composeInput);
    expect(publicList.services.map((service) => service.id)).toEqual(
      customerList.services.map((service) => service.id),
    );
    expect(publicList.summary).toBe(customerList.summary);
  });

  it('discover-parity-or public and customer produce identical OR availability windows', () => {
    const [publicScenario, customerScenario] = serviceDiscoveryParityByPairId(
      'discover-parity-or',
    );
    const publicEnriched = enrichDiscoverParityParamsForSurface(
      'public',
      publicScenario!.prompt,
      publicScenario!.classifierParams ?? {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      publicScenario!.action,
    );
    const customerEnriched = enrichDiscoverParityParamsForSurface(
      'customer',
      customerScenario!.prompt,
      customerScenario!.classifierParams ?? {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      customerScenario!.action,
    );

    expect(publicEnriched).toEqual(customerEnriched);
    expect(publicEnriched).toMatchObject(publicScenario!.expectedDiscovery);

    const windows = resolvePublicAvailabilityWindows(
      publicEnriched,
      publicScenario!.prompt,
      'UTC',
      { defaultScanDays: 14 },
    );
    expect(windows).toHaveLength(publicScenario!.expectOrWindowCount ?? 2);
  });

  it('discover-parity-voice-customer ASR enrich matches public check_availability', () => {
    const scenario = SERVICE_DISCOVERY_PARITY_SCENARIOS.find(
      (row) => row.id === 'discover-parity-voice-customer',
    )!;
    const customerEnriched = enrichDiscoverParityParamsForSurface(
      'customer',
      scenario.prompt,
      {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      scenario.action,
    );
    const publicEnriched = enrichDiscoverParityParamsForSurface(
      'public',
      scenario.prompt,
      {},
      SERVICE_DISCOVERY_INTEGRATION_CATALOG,
      'check_availability',
    );
    expect(customerEnriched).toEqual(publicEnriched);
    expect(customerEnriched.maxPrice).toBe(50);
    expect(customerEnriched.availabilityWindows).toEqual([
      { date: 'tomorrow' },
      { weekdays: ['friday'] },
    ]);
  });
});
