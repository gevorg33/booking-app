import {
  expandServiceLookupQueries,
  fuzzyMatchServiceByName,
  matchServicesByQuery,
  resolvePublicAssistantSessionServiceFields,
  resolveServicesFromCatalogParams,
} from './ai-orchestration.helpers.js';
import { pickRankedServices } from './ai-service-catalog-rank.util.js';
import {
  E2E199_LIVE_PROMPT_CASES,
  E2E199_NEGATIVE_RESOLVE_CASES,
  E2E199_RESOLVE_CASES,
  E2E199_SALON_CATALOG,
} from './ai-e2e199-haircut-hairstyle-synonym.fixtures.js';

describe('e2e-bug.199 haircut ↔ hairstyle catalog synonym', () => {
  it.each(E2E199_RESOLVE_CASES.map((row) => [row.id, row] as const))(
    'resolveServicesFromCatalogParams $id',
    (_id, row) => {
      expect(
        resolveServicesFromCatalogParams(
          [...E2E199_SALON_CATALOG],
          row.query,
        ).map((s) => s.name),
      ).toEqual([...row.expectNames]);
    },
  );

  it.each(E2E199_LIVE_PROMPT_CASES.map((row) => [row.id, row] as const))(
    'live prompt token $id resolves on salon catalog',
    (_id, row) => {
      const byCategory = resolveServicesFromCatalogParams(
        [...E2E199_SALON_CATALOG],
        { serviceCategory: row.serviceToken },
      );
      const byName = resolveServicesFromCatalogParams(
        [...E2E199_SALON_CATALOG],
        { serviceName: row.serviceToken },
      );
      const names = new Set([
        ...byCategory.map((s) => s.name),
        ...byName.map((s) => s.name),
      ]);
      for (const expected of row.expectResolveNames) {
        expect(names.has(expected)).toBe(true);
      }
      expect(names.size).toBeGreaterThan(0);
    },
  );

  it.each(E2E199_NEGATIVE_RESOLVE_CASES.map((row) => [row.id, row] as const))(
    'negative $id does not false-match',
    (_id, row) => {
      expect(
        resolveServicesFromCatalogParams(
          [...E2E199_SALON_CATALOG],
          row.query,
        ).map((s) => s.name),
      ).toEqual([]);
    },
  );

  it('expandServiceLookupQueries includes hairstyle for haircut', () => {
    expect(expandServiceLookupQueries('haircut')).toEqual(
      expect.arrayContaining(['haircut', 'hairstyle', 'haircuts']),
    );
    expect(expandServiceLookupQueries('massage')).toEqual(['massage']);
  });

  it('fuzzy + matchServicesByQuery map haircut → hairstyle', () => {
    expect(
      fuzzyMatchServiceByName([...E2E199_SALON_CATALOG], 'haircut')?.name,
    ).toBe('hairstyle');
    expect(
      matchServicesByQuery([...E2E199_SALON_CATALOG], 'haircuts').map(
        (s) => s.name,
      ),
    ).toEqual(['hairstyle']);
  });

  it('session fields persist canonical hairstyle for haircut input', () => {
    expect(
      resolvePublicAssistantSessionServiceFields(
        { serviceName: 'haircut' },
        [...E2E199_SALON_CATALOG],
      ),
    ).toEqual({ serviceName: 'hairstyle', serviceCategory: null });
  });

  it('prefers literal haircut when both haircut and hairstyle exist', () => {
    const both = [
      ...E2E199_SALON_CATALOG,
      { id: '9', name: 'Men haircut', category: { name: 'Hair' } },
    ];
    expect(
      resolveServicesFromCatalogParams(both, {
        serviceCategory: 'haircut',
      }).map((s) => s.name),
    ).toEqual(['Men haircut']);
    expect(fuzzyMatchServiceByName(both, 'haircut')?.name).toBe('Men haircut');
  });

  it('rank discovery keeps hairstyle when filtering category haircut', () => {
    const ranked = pickRankedServices(
      [
        {
          id: '1',
          name: 'hairstyle',
          price: 15,
          serviceCategory: 'Hair Care',
        },
        {
          id: '2',
          name: 'Swedish massage',
          price: 40,
          serviceCategory: 'Massage',
        },
      ],
      { serviceCategory: 'haircut', serviceRank: 'lowest_price', limit: 1 },
    );
    expect(ranked.map((s) => s.name)).toEqual(['hairstyle']);
  });

  it('does not change create-service exact dedup for unknown haircut', () => {
    // findServiceByExactName must stay synonym-free — covered in helpers.spec;
    // assert resolve still synonym-matches while exact name remains absent.
    expect(
      E2E199_SALON_CATALOG.some(
        (s) => s.name.toLowerCase() === 'haircut',
      ),
    ).toBe(false);
    expect(
      resolveServicesFromCatalogParams([...E2E199_SALON_CATALOG], {
        serviceName: 'haircut',
      })[0]?.name,
    ).toBe('hairstyle');
  });
});
