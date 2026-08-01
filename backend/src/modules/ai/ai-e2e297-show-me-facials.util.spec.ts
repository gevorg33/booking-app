import {
  E2E297_EXPLICIT_FACIAL_CONTROLS,
  E2E297_FACE_FAMILY_NAMES,
  E2E297_SALON_FACE_CATALOG,
  E2E297_SHORT_FACIALS_LIST_CASES,
  E2E297_SINGLE_SERVICE_CONTROLS,
} from './ai-e2e297-show-me-facials.fixtures.js';
import {
  applyPromptMentionedServiceOverrideToParams,
  enrichPublicAssistantParamsFromPrompt,
} from './ai-booking-param-hints.util.js';
import { resolveServicesFromCatalogParams } from './ai-orchestration.helpers.js';
import {
  expandServiceLookupQueries,
  findServiceLookupSynonymTokenInPrompt,
} from './ai-service-lookup-synonyms.util.js';
import { normalizeAvailabilityServiceCategory } from './ai-flexible-availability.util.js';

const CATALOG = [...E2E297_SALON_FACE_CATALOG];

describe('e2e-bug.297 show me facials keeps face family', () => {
  it('findServiceLookupSynonymTokenInPrompt prefers facials', () => {
    expect(findServiceLookupSynonymTokenInPrompt('show me facials')).toBe(
      'facials',
    );
    expect(expandServiceLookupQueries('facials')).toEqual(
      expect.arrayContaining(['facials', 'facial', 'face']),
    );
    expect(normalizeAvailabilityServiceCategory('facials')).toBe('facial');
  });

  it.each(E2E297_SHORT_FACIALS_LIST_CASES)(
    'override keeps category for $id',
    ({ prompt, expectCategory }) => {
      const overridden = applyPromptMentionedServiceOverrideToParams(
        prompt,
        {},
        CATALOG,
      );
      expect(overridden.serviceCategory).toBe(expectCategory);
      expect(overridden.serviceName).toBeNull();
      expect(overridden.serviceId).toBeUndefined();
    },
  );

  it.each([
    ...E2E297_SHORT_FACIALS_LIST_CASES,
    ...E2E297_EXPLICIT_FACIAL_CONTROLS,
  ])(
    'public enrich + resolve lists face family for $id',
    ({ prompt, expectCategory, expectFamilyNames, forbidSingleOnly }) => {
      const enriched = enrichPublicAssistantParamsFromPrompt(
        prompt,
        {},
        CATALOG,
        'list_services',
      );
      expect(enriched.serviceCategory).toBe(expectCategory);
      expect(enriched.serviceName == null || enriched.serviceName === null).toBe(
        true,
      );

      const matched = resolveServicesFromCatalogParams(CATALOG, enriched);
      const names = matched.map((s) => s.name).sort();
      expect(names).toEqual([...expectFamilyNames].sort());
      expect(names).not.toEqual([forbidSingleOnly]);
    },
  );

  it('explicit Face Pilling still pins single service', () => {
    const row = E2E297_SINGLE_SERVICE_CONTROLS[0];
    const enriched = enrichPublicAssistantParamsFromPrompt(
      row.prompt,
      {},
      CATALOG,
      'list_services',
    );
    expect(enriched.serviceName).toBe(row.expectServiceName);
    expect(enriched.serviceId).toBe(row.expectServiceId);
    expect(enriched.serviceCategory).toBeNull();
  });

  it('facemassage synonym still resolves face family when multi-match', () => {
    const row = E2E297_SINGLE_SERVICE_CONTROLS[1];
    const enriched = enrichPublicAssistantParamsFromPrompt(
      row.prompt,
      {},
      CATALOG,
      'list_services',
    );
    const matched = resolveServicesFromCatalogParams(CATALOG, enriched);
    expect(matched.map((s) => s.name)).toEqual(
      expect.arrayContaining([row.expectFamilyIncludes]),
    );
    expect(matched.length).toBeGreaterThanOrEqual(1);
  });

  it('does not expand hairstyle browse to face family', () => {
    const enriched = enrichPublicAssistantParamsFromPrompt(
      'show me hairstyle',
      {},
      CATALOG,
      'list_services',
    );
    const matched = resolveServicesFromCatalogParams(CATALOG, enriched);
    expect(matched.map((s) => s.name)).toEqual(['hairstyle']);
    expect(matched.map((s) => s.name)).not.toEqual(
      expect.arrayContaining([...E2E297_FACE_FAMILY_NAMES]),
    );
  });
});
