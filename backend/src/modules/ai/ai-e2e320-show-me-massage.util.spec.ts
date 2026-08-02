import {
  E2E320_EXPLICIT_MASSAGE_CONTROLS,
  E2E320_MASSAGE_FAMILY_NAMES,
  E2E320_SALON_MASSAGE_CATALOG,
  E2E320_SHORT_MASSAGE_LIST_CASES,
  E2E320_SINGLE_SERVICE_CONTROLS,
} from './ai-e2e320-show-me-massage.fixtures.js';
import {
  applyPromptMentionedServiceOverrideToParams,
  enrichPublicAssistantParamsFromPrompt,
} from './ai-booking-param-hints.util.js';
import { resolveServicesFromCatalogParams } from './ai-orchestration.helpers.js';
import {
  expandServiceLookupQueries,
  findServiceLookupSynonymTokenInPrompt,
} from './ai-service-lookup-synonyms.util.js';

const CATALOG = [...E2E320_SALON_MASSAGE_CATALOG];

describe('e2e-bug.320 show me massage keeps massage family', () => {
  it('findServiceLookupSynonymTokenInPrompt prefers massage', () => {
    expect(findServiceLookupSynonymTokenInPrompt('show me massage')).toBe(
      'massage',
    );
    expect(expandServiceLookupQueries('massage')).toEqual(
      expect.arrayContaining(['massage', 'massages']),
    );
  });

  it.each(E2E320_SHORT_MASSAGE_LIST_CASES)(
    'override keeps a category (not a single pin) for $id',
    ({ prompt }) => {
      const overridden = applyPromptMentionedServiceOverrideToParams(
        prompt,
        {},
        CATALOG,
      );
      expect(typeof overridden.serviceCategory).toBe('string');
      expect(overridden.serviceCategory).toBeTruthy();
      expect(overridden.serviceName).toBeNull();
      expect(overridden.serviceId).toBeUndefined();
    },
  );

  it.each([
    ...E2E320_SHORT_MASSAGE_LIST_CASES,
    ...E2E320_EXPLICIT_MASSAGE_CONTROLS,
  ])(
    'public enrich + resolve lists massage family for $id',
    ({ prompt, expectFamilyNames, forbidSingleOnly }) => {
      const enriched = enrichPublicAssistantParamsFromPrompt(
        prompt,
        {},
        CATALOG,
        'list_services',
      );
      expect(enriched.serviceName == null || enriched.serviceName === null).toBe(
        true,
      );

      const matched = resolveServicesFromCatalogParams(CATALOG, enriched);
      const names = matched.map((s) => s.name).sort();
      expect(names).toEqual([...expectFamilyNames].sort());
      expect(names).not.toEqual([forbidSingleOnly]);
    },
  );

  it('explicit Hot stone massage still pins single service', () => {
    const row = E2E320_SINGLE_SERVICE_CONTROLS[0];
    const enriched = enrichPublicAssistantParamsFromPrompt(
      row.prompt,
      {},
      CATALOG,
      'list_services',
    );
    const matched = resolveServicesFromCatalogParams(CATALOG, enriched);
    expect(matched.map((s) => s.name)).toEqual([row.expectServiceName]);
  });

  it('facemassage prompt does not spuriously expand via the massage group', () => {
    const enriched = enrichPublicAssistantParamsFromPrompt(
      'show me facemassage',
      {},
      CATALOG,
      'list_services',
    );
    const matched = resolveServicesFromCatalogParams(CATALOG, enriched);
    expect(matched.map((s) => s.name)).toEqual(
      expect.arrayContaining(['facemassage']),
    );
  });

  it('a second named massage variant (Deep tissue massage) still pins single service', () => {
    const enriched = enrichPublicAssistantParamsFromPrompt(
      'show me Deep tissue massage',
      {},
      CATALOG,
      'list_services',
    );
    const matched = resolveServicesFromCatalogParams(CATALOG, enriched);
    expect(matched.map((s) => s.name)).toEqual(['Deep tissue massage']);
  });

  it('does not expand an unrelated haircut-family prompt into the massage family', () => {
    const enriched = enrichPublicAssistantParamsFromPrompt(
      'show me haircuts',
      {},
      CATALOG,
      'list_services',
    );
    const matched = resolveServicesFromCatalogParams(CATALOG, enriched);
    expect(matched.map((s) => s.name)).not.toEqual(
      expect.arrayContaining([...E2E320_MASSAGE_FAMILY_NAMES]),
    );
  });
});
