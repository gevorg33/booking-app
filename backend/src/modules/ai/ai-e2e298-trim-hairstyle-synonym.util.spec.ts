import {
  E2E298_EXPAND_CASES,
  E2E298_PROMPT_CASES,
  E2E298_RESOLVE_CASES,
  E2E298_SALON_CATALOG,
} from './ai-e2e298-trim-hairstyle-synonym.fixtures.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-booking-param-hints.util.js';
import { normalizeAvailabilityServiceCategory } from './ai-flexible-availability.util.js';
import {
  fuzzyMatchServiceByName,
  matchServicesByQuery,
  resolveServicesFromCatalogParams,
} from './ai-orchestration.helpers.js';
import {
  expandServiceLookupQueries,
  findServiceLookupSynonymTokenInPrompt,
} from './ai-service-lookup-synonyms.util.js';
import {
  extractServiceRankServiceCategoryFromPrompt,
} from './ai-service-rank-discovery.util.js';

const CATALOG = [...E2E298_SALON_CATALOG];

describe('e2e-bug.298 trim ↔ hairstyle catalog synonym', () => {
  it.each(E2E298_EXPAND_CASES)(
    'expandServiceLookupQueries $id',
    ({ query, mustInclude }) => {
      const expanded = expandServiceLookupQueries(query);
      for (const alias of mustInclude) {
        expect(expanded).toContain(alias);
      }
    },
  );

  it('normalizeAvailabilityServiceCategory maps trim/cut/style → haircut', () => {
    expect(normalizeAvailabilityServiceCategory('trim')).toBe('haircut');
    expect(normalizeAvailabilityServiceCategory('cut')).toBe('haircut');
    expect(normalizeAvailabilityServiceCategory('styling')).toBe('haircut');
  });

  it.each(E2E298_RESOLVE_CASES)(
    'resolveServicesFromCatalogParams $id',
    ({ query, expectNames }) => {
      const matched = resolveServicesFromCatalogParams(CATALOG, query);
      expect(matched.map((s) => s.name).sort()).toEqual(
        [...expectNames].sort(),
      );
    },
  );

  it('fuzzy + matchServicesByQuery map trim → hairstyle', () => {
    expect(fuzzyMatchServiceByName(CATALOG, 'trim')?.name).toBe('hairstyle');
    expect(matchServicesByQuery(CATALOG, 'trim').map((s) => s.name)).toEqual([
      'hairstyle',
    ]);
  });

  it.each(E2E298_PROMPT_CASES)(
    'enrich + resolve prompt $id',
    ({ prompt, serviceToken, expectResolveNames }) => {
      expect(findServiceLookupSynonymTokenInPrompt(prompt)).toBeTruthy();

      const rankCat = extractServiceRankServiceCategoryFromPrompt(prompt);
      if (rankCat) {
        expect(
          normalizeAvailabilityServiceCategory(rankCat) === 'haircut' ||
            rankCat === serviceToken ||
            rankCat === 'haircut',
        ).toBe(true);
      }

      const enriched = enrichPublicAssistantParamsFromPrompt(
        prompt,
        { serviceCategory: serviceToken },
        CATALOG,
        prompt.includes('list') || prompt.includes('show')
          ? 'list_services'
          : 'recommend_specialists',
      );

      const matched = resolveServicesFromCatalogParams(CATALOG, {
        serviceCategory:
          (enriched.serviceCategory as string | null | undefined) ??
          serviceToken,
        serviceName: enriched.serviceName as string | null | undefined,
      });
      expect(matched.map((s) => s.name).sort()).toEqual(
        [...expectResolveNames].sort(),
      );
    },
  );

  it('does not map massage trim-like noise', () => {
    expect(expandServiceLookupQueries('massage')).toEqual(['massage']);
    expect(
      resolveServicesFromCatalogParams(CATALOG, {
        serviceCategory: 'massage',
      }).map((s) => s.name),
    ).toEqual(['Swedish massage']);
  });
});
