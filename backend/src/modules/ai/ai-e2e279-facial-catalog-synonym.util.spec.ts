import {
  expandServiceLookupQueries,
  fuzzyMatchServiceByName,
  matchServicesByQuery,
  resolveServicesFromCatalogParams,
} from './ai-orchestration.helpers.js';
import { pickRankedServices } from './ai-service-catalog-rank.util.js';
import {
  E2E279_EXPAND_CASES,
  E2E279_LIVE_PROMPT_CASES,
  E2E279_NEGATIVE_RESOLVE_CASES,
  E2E279_RESOLVE_CASES,
  E2E279_SALON_CATALOG,
} from './ai-e2e279-facial-catalog-synonym.fixtures.js';

describe('e2e-bug.279 facial ↔ Face Pilling / facemassage catalog synonym', () => {
  it.each(E2E279_RESOLVE_CASES)(
    'resolveServicesFromCatalogParams $id',
    ({ query, expectNames }) => {
      expect(
        resolveServicesFromCatalogParams([...E2E279_SALON_CATALOG], query).map(
          (s) => s.name,
        ),
      ).toEqual([...expectNames]);
    },
  );

  it.each(E2E279_EXPAND_CASES)(
    'expandServiceLookupQueries $id',
    ({ query, mustInclude }) => {
      const expanded = expandServiceLookupQueries(query);
      for (const alias of mustInclude) {
        expect(expanded).toEqual(expect.arrayContaining([alias]));
      }
      // e2e-bug.320 made bare "massage" a synonym-group member on purpose: without
      // it, `findServiceLookupSynonymTokenInPrompt` never fired for "show me
      // massage", the multi-match family guard was skipped, and the query
      // collapsed onto whichever catalog service tie-broke first. This assertion
      // predates that and asserted the old, deliberately-removed behaviour.
      expect(expandServiceLookupQueries('massage')).toEqual([
        'massage',
        'massages',
      ]);
    },
  );

  it.each(E2E279_LIVE_PROMPT_CASES)(
    'live prompt token $id resolves on salon catalog',
    ({ serviceToken, expectResolveNames, forbidNames }) => {
      const byCategory = resolveServicesFromCatalogParams(
        [...E2E279_SALON_CATALOG],
        { serviceCategory: serviceToken },
      );
      const byName = resolveServicesFromCatalogParams(
        [...E2E279_SALON_CATALOG],
        { serviceName: serviceToken },
      );
      const names = new Set([
        ...byCategory.map((s) => s.name),
        ...byName.map((s) => s.name),
      ]);
      for (const expected of expectResolveNames) {
        expect(names.has(expected)).toBe(true);
      }
      expect(names.size).toBeGreaterThan(0);
      for (const forbidden of forbidNames || []) {
        expect(names.has(forbidden)).toBe(false);
      }
    },
  );

  it.each(E2E279_NEGATIVE_RESOLVE_CASES)(
    'negative $id',
    ({ query, expectNames, ...rest }) => {
      const names = resolveServicesFromCatalogParams(
        [...E2E279_SALON_CATALOG],
        query,
      ).map((s) => s.name);
      if (expectNames.length === 0) {
        expect(names).toEqual([]);
        return;
      }
      expect(names).toEqual([...expectNames]);
      const forbidNames =
        'forbidNames' in rest
          ? (rest as { forbidNames?: readonly string[] }).forbidNames
          : undefined;
      for (const forbidden of forbidNames || []) {
        expect(names.includes(forbidden)).toBe(false);
      }
    },
  );

  it('fuzzy + matchServicesByQuery map facial → face family', () => {
    const fuzzy = fuzzyMatchServiceByName([...E2E279_SALON_CATALOG], 'facial');
    expect(fuzzy?.name).toMatch(/face|facial/i);

    const matched = matchServicesByQuery(
      [...E2E279_SALON_CATALOG],
      'facial',
    ).map((s) => s.name);
    expect(matched).toEqual(['Face Pilling', 'Face Plasma', 'facemassage']);
    expect(matched).not.toContain('hairstyle');
    expect(matched).not.toContain('Swedish massage');
  });

  it('prefers literal facial when a service named facial exists', () => {
    const both = [
      ...E2E279_SALON_CATALOG,
      { id: '9', name: 'Classic Facial', category: { name: 'Face' } },
    ];
    expect(
      resolveServicesFromCatalogParams(both, {
        serviceCategory: 'facial',
      }).map((s) => s.name),
    ).toEqual(['Classic Facial']);
    expect(fuzzyMatchServiceByName(both, 'facial')?.name).toBe(
      'Classic Facial',
    );
  });

  it('rank discovery keeps face family when filtering category facial', () => {
    const ranked = pickRankedServices(
      [
        {
          id: '1',
          name: 'Face Pilling',
          price: 5,
          serviceCategory: 'Face',
        },
        {
          id: '2',
          name: 'facemassage',
          price: 40,
          serviceCategory: 'Face',
        },
        {
          id: '3',
          name: 'Swedish massage',
          price: 50,
          serviceCategory: 'Massage',
        },
      ],
      { serviceCategory: 'facial', serviceRank: 'lowest_price', limit: 2 },
    );
    expect(ranked.map((s) => s.name)).toEqual(['Face Pilling', 'facemassage']);
  });
});
