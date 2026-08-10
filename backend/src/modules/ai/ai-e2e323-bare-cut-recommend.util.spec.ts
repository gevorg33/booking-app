import {
  E2E323_BARE_CUT_CASES,
  E2E323_HAIRSTYLE_ONLY_CATALOG,
  E2E323_SALON_CATALOG,
} from './ai-e2e323-bare-cut-recommend.fixtures.js';
import { extractProviderRankServiceCategoryFromPrompt } from './ai-service-rank-discovery.util.js';
import { resolveServicesFromCatalogParams } from './ai-orchestration.helpers.js';
import { normalizeAvailabilityServiceCategory } from './ai-flexible-availability.util.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-booking-param-hints.util.js';

describe("e2e-bug.323 bare cut prefers Men's/Women's cut over hairstyle", () => {
  it.each(E2E323_BARE_CUT_CASES)(
    'extracts unaliased "cut" category for $id',
    ({ prompt }) => {
      const category = extractProviderRankServiceCategoryFromPrompt(prompt);
      expect(category).toMatch(/^cuts?$/);
    },
  );

  it.each(E2E323_BARE_CUT_CASES)(
    "resolves Men's cut + Women's cut (not hairstyle) for $id when the catalog has cut-named services",
    ({ prompt }) => {
      const category = extractProviderRankServiceCategoryFromPrompt(prompt);
      const matched = resolveServicesFromCatalogParams(
        [...E2E323_SALON_CATALOG],
        { serviceCategory: category },
      );
      const names = matched.map((s) => s.name).sort();
      expect(names).toEqual(["Men's cut", "Women's cut"].sort());
      expect(names).not.toEqual(expect.arrayContaining(['hairstyle']));
    },
  );

  it.each(E2E323_BARE_CUT_CASES)(
    'falls back to hairstyle for $id when the catalog has no cut-named service',
    ({ prompt }) => {
      const category = extractProviderRankServiceCategoryFromPrompt(prompt);
      const matched = resolveServicesFromCatalogParams(
        [...E2E323_HAIRSTYLE_ONLY_CATALOG],
        { serviceCategory: category },
      );
      expect(matched.map((s) => s.name)).toEqual(['hairstyle']);
    },
  );

  it('trim/styling still alias to haircut and resolve hairstyle (e2e-bug.298 regression guard)', () => {
    for (const prompt of [
      'best specialists for trim',
      'best specialists for styling',
    ]) {
      const category = extractProviderRankServiceCategoryFromPrompt(prompt);
      expect(category).toBe('haircut');
      const matched = resolveServicesFromCatalogParams(
        [...E2E323_SALON_CATALOG],
        { serviceCategory: category },
      );
      expect(matched.map((s) => s.name)).toEqual(['hairstyle']);
    }
  });

  it('explicit full name still pins to a single service', () => {
    const category = extractProviderRankServiceCategoryFromPrompt(
      "best specialists for Men's cut",
    );
    expect(category).toBeTruthy();
  });

  it('massage/facial rank categories are unaffected', () => {
    expect(
      extractProviderRankServiceCategoryFromPrompt(
        'best specialists for massage',
      ),
    ).toBe('massage');
    expect(
      extractProviderRankServiceCategoryFromPrompt(
        'best specialists for facial',
      ),
    ).toBe('facial');
  });

  // e2e-bug.323 real root cause: the LIVE recommend_specialists request path
  // does not call extractProviderRankServiceCategoryFromPrompt at all — it
  // goes through enrichPublicAssistantParamsFromPrompt's family-browse guard
  // (applyPromptMentionedServiceOverrideToParams), which used to normalize
  // the matched synonym token via normalizeAvailabilityServiceCategory
  // ('cut' -> 'haircut'), discarding the fact that the family match itself
  // was computed against the un-aliased "cut" query. This is the actual
  // end-to-end path a live "best specialists for a cut" request takes.
  it.each(E2E323_BARE_CUT_CASES)(
    'enrichPublicAssistantParamsFromPrompt keeps unaliased "cut" category for $id (live root cause)',
    ({ prompt }) => {
      const enriched = enrichPublicAssistantParamsFromPrompt(
        prompt,
        {},
        [...E2E323_SALON_CATALOG],
        'recommend_specialists',
      );
      expect(enriched.serviceCategory).toMatch(/^cuts?$/);
      expect(enriched.serviceCategory).not.toBe('haircut');

      const matched = resolveServicesFromCatalogParams(
        [...E2E323_SALON_CATALOG],
        enriched,
      );
      const names = matched.map((s) => s.name).sort();
      expect(names).toEqual(["Men's cut", "Women's cut"].sort());
    },
  );

  it('normalizeAvailabilityServiceCategory leaves "cut" unaliased but still maps trim/style to haircut', () => {
    expect(normalizeAvailabilityServiceCategory('cut')).toBe('cut');
    expect(normalizeAvailabilityServiceCategory('trim')).toBe('haircut');
    expect(normalizeAvailabilityServiceCategory('styling')).toBe('haircut');
  });
});
