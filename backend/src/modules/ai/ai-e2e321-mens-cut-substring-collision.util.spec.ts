import {
  E2E321_MASSAGE_FAMILY_NAMES,
  E2E321_SALON_CATALOG,
  E2E321_SINGLE_PIN_CASES,
} from './ai-e2e321-mens-cut-substring-collision.fixtures.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-booking-param-hints.util.js';
import {
  resolveServicesFromCatalogParams,
  matchServicesByQuery,
} from './ai-orchestration.helpers.js';
import { normalizeServiceLookup } from './ai-service-lookup-synonyms.util.js';

const CATALOG = [...E2E321_SALON_CATALOG];

describe("e2e-bug.321 Men's cut / Women's cut substring collision", () => {
  it('documents the raw substring collision that motivates the fix', () => {
    expect(
      normalizeServiceLookup("Women's cut").includes(
        normalizeServiceLookup("Men's cut"),
      ),
    ).toBe(true);
    // matchServicesByQuery alone (no serviceId short-circuit) still exhibits
    // the collision — this is why resolveServicesFromCatalogParams must not
    // route an already-resolved serviceId pin back through it.
    expect(
      matchServicesByQuery(CATALOG, "Men's cut").map((s) => s.name),
    ).toEqual(expect.arrayContaining(["Men's cut", "Women's cut"]));
  });

  it.each(E2E321_SINGLE_PIN_CASES)(
    'public enrich + resolve pins exactly one service for $id',
    ({ prompt, expectServiceName, expectServiceId }) => {
      const enriched = enrichPublicAssistantParamsFromPrompt(
        prompt,
        {},
        CATALOG,
        'list_services',
      );
      expect(enriched.serviceId).toBe(expectServiceId);
      const matched = resolveServicesFromCatalogParams(CATALOG, enriched);
      expect(matched.map((s) => s.name)).toEqual([expectServiceName]);
    },
  );

  it('resolveServicesFromCatalogParams honors serviceId directly for both directions', () => {
    expect(
      resolveServicesFromCatalogParams(CATALOG, {
        serviceName: "Men's cut",
        serviceId: 'mc',
      }).map((s) => s.name),
    ).toEqual(["Men's cut"]);
    expect(
      resolveServicesFromCatalogParams(CATALOG, {
        serviceName: "Women's cut",
        serviceId: 'wc',
      }).map((s) => s.name),
    ).toEqual(["Women's cut"]);
  });

  it('a stale Men\'s cut session pin does not leak into a fresh massage list request', () => {
    const staleParams = { serviceName: "Men's cut", serviceId: 'mc' };
    const enriched = enrichPublicAssistantParamsFromPrompt(
      'list massage services',
      staleParams,
      CATALOG,
      'list_services',
    );
    const matched = resolveServicesFromCatalogParams(CATALOG, enriched);
    const names = matched.map((s) => s.name).sort();
    expect(names).toEqual([...E2E321_MASSAGE_FAMILY_NAMES].sort());
    expect(names).not.toEqual(
      expect.arrayContaining(["Men's cut", "Women's cut"]),
    );
  });

  it('serviceId short-circuit is skipped when serviceCategory is actively browsing (family intent wins)', () => {
    const matched = resolveServicesFromCatalogParams(CATALOG, {
      serviceCategory: 'massage',
      serviceId: 'mc',
    });
    expect(matched.map((s) => s.name).sort()).toEqual(
      [...E2E321_MASSAGE_FAMILY_NAMES].sort(),
    );
  });

  it('serviceNames array multi-resolve path is unaffected by the serviceId short-circuit', () => {
    const matched = resolveServicesFromCatalogParams(CATALOG, {
      serviceNames: ["Men's cut", 'Swedish massage'],
    });
    expect(matched.map((s) => s.name).sort()).toEqual(
      ["Men's cut", 'Swedish massage'].sort(),
    );
  });
});
